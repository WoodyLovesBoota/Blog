---
title: "Shipping a Next.js app as a Tauri desktop app"
description: A Next.js 16 web app was bundled into a single static export and shipped both to Vercel and as a Tauri 2 desktop app. Removing middleware, moving auth, OAuth and deep links to the client, a broken DMG window, and Windows single-instance and unsigned distribution.
keywords: [Next.js static export, output export, Tauri 2, Tauri deep link, Supabase PKCE, localStorage session, NSIS, SmartScreen, code signing, WebView2, tauri.localhost, single-instance]
translatedFrom: ko
---

TongTong, a shared household budget app (web and Android), gained macOS and Windows desktop apps. The goal was for Vercel and Tauri to share the single `out/` that `pnpm build` produces. Splitting the build with an environment variable like `TAURI_BUILD` lets the two outputs drift apart slightly, and those differences are hard to find.

## Starting point: what the server did

The Tauri webview only reads static files, so `output: 'export'` is required, and request-time APIs such as Route Handlers, Server Actions, middleware and `cookies()` are off the table.

Every TongTong page was already `"use client"`, and data comes from external API calls with a token attached. The only server code was `src/proxy.ts` (middleware, renamed in Next.js 16) and the cookie session it relied on (`@supabase/ssr`).

```ts title="src/proxy.ts (before removal, condensed)"
export async function proxy(request: NextRequest) {
  const supabase = createServerClient(url, anonKey, {
    cookies: { /* request ↔ response cookies */ },
  });
  const { data: { session } } = await supabase.auth.getSession();

  // No session: send to the marketing landing page
  if (!session && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/landing', request.url));
  }
  // Signed-in users go from /login to /
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return response;
}
```

## Step 1: one static export

`next.config.ts` is always `output: "export"`, with no branching. `manifest.ts`, `robots.ts` and `sitemap.ts` get `export const dynamic = "force-static"` so they are baked at build time, and the `start` script serves `out/` with a static server instead of `next start`.

### Delete proxy, move the gate to the client

The client-side `RequireAuth` already redirected signed-out users, so deleting proxy changes nothing there. The one missing behavior was "signed-in user on /login goes to /", restored in step 3.

- With a server redirect, signed-out users never receive the protected page's HTML. With a client gate, the static HTML arrives first and a splash screen shows until the session is checked.
- Protected page HTML contains no data, so what leaks is little more than the empty page structure.

### Supabase session: from cookies to localStorage + PKCE

`createBrowserClient` from `@supabase/ssr` keeps the session in cookies for the server to read. There is no server to read them anymore, and the macOS webview origin is the custom scheme `tauri://localhost`, so there is no guarantee cookies survive a restart. Switching to `createClient` from `supabase-js` puts the session in localStorage.

```ts title="src/lib/supabase/client.ts"
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}
```

The PKCE code verifier lives in localStorage, so the `code` exchange has to happen in the same webview that started the sign-in. This constraint shaped the deep link design below.

### Origin of email links

If the sign-up confirmation email's `emailRedirectTo` is `window.location.origin`, on desktop it becomes `tauri://localhost/auth/callback`, which a browser cannot open. A `webOrigin()` helper uses the production web address for such origins (fixed again for Windows).

## Step 2: wrapping it in a Tauri 2 shell

In `tauri.conf.json`, `frontendDist` is `../out`, the same as the web, `beforeBuildCommand` is `pnpm build`, and `beforeDevCommand` is `pnpm dev` (port 3000). Identifier `com.tongtong.desktop`, deep link scheme `tongtong`, window 1280×800 (minimum 960×640). The web deployment excludes `src-tauri/` via `.vercelignore`.

### Permissions: opener only for https and mailto

Left open, the `opener` plugin can open any scheme, `file:` included, so only `https://*` and `mailto:*` are allowed.

```json title="src-tauri/capabilities/default.json"
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "deep-link:default",
    {
      "identifier": "opener:allow-open-url",
      "allow": [{ "url": "https://*" }, { "url": "mailto:*" }]
    }
  ]
}
```

### Google sign-in and the tongtong:// deep link

Google blocks OAuth in embedded webviews (`disallowed_useragent`). On desktop, `skipBrowserRedirect: true` returns just the URL, which opens in the system browser, and when it finishes `tongtong://auth/callback?code=...` wakes the app. This address must be registered in Supabase Redirect URLs.

```ts title="src/lib/auth/oauth.ts" {5-8}
export async function signInWithGoogle() {
  const supabase = getSupabaseBrowserClient();
  if (!isTauri()) {
    // ... web: redirectTo `${window.location.origin}/auth/callback`
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: DESKTOP_AUTH_CALLBACK, skipBrowserRedirect: true },
  });
  if (error) return { error };
  await openExternal(data.url); // system browser
  return { error: null };
}
```

`DesktopBridge` at the root doesn't exchange the deep link's `code` itself; it hands it to the webview's `/auth/callback?code=`. That takes the same `exchangeCodeForSession` path as the web and finds the verifier in the same localStorage. If the app was closed and launched by the link, `getCurrent()` returns the URL.

```tsx title="src/components/layout/DesktopBridge.tsx (condensed)"
const handleUrls = (urls: string[] | null | undefined) => {
  const hit = urls?.find((u) => u.startsWith(DESKTOP_AUTH_CALLBACK));
  if (!hit) return;
  // getCurrent() returns the launching link again after a reload —
  // don't exchange the same code twice
  if (sessionStorage.getItem(HANDLED_KEY) === hit) return;
  sessionStorage.setItem(HANDLED_KEY, hit);

  const code = new URL(hit).searchParams.get("code");
  router.replace(
    code ? `/auth/callback?code=${encodeURIComponent(code)}` : "/login",
  );
};

const { getCurrent, onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
unlisten = await onOpenUrl(handleUrls);
handleUrls(await getCurrent());
```

- The webview doesn't open new windows for `target="_blank"`, so clicks on cross-origin https/mailto links are intercepted in the capture phase and passed to the system browser.
- Tauri plugins are dynamically imported only inside this component, and `isTauri()` checks the global `globalThis.isTauri` instead of using `@tauri-apps/api`. No Tauri code ends up in the web's initial bundle.
- The API is `fetch` + a Bearer token, and backend CORS allows every origin, so it works without the Tauri http plugin. If CORS is narrowed, it must allow `tauri://localhost` (macOS) and `http://tauri.localhost` (Windows).

## Step 3: skipping the landing page inside the app

Anyone who opens the app has already installed it, so the marketing landing page is unnecessary.

- `RequireAuth`: with no session, web goes to `/landing`, desktop goes to `/login`
- `DesktopBridge`: on desktop, entering `/landing` goes to `/login`
- Login screen: "Back to home" is hidden on desktop
- On mount, the login page goes to `/` if `getSession()` has a session (restoring the behavior lost with proxy). The `/onboarding` branch is handled by `RequireAuth` on `/`

Using `isTauri()` directly in a branch that changes rendered output causes a hydration mismatch, because the static HTML was baked for the web and differs from Tauri's first render. The server snapshot is pinned to `false`.

```ts title="src/hooks/useIsTauri.ts"
const noopSubscribe = () => () => {};

export function useIsTauri(): boolean {
  return useSyncExternalStore(noopSubscribe, isTauri, () => false);
}
```

## The broken DMG window

The DMG is served from the landing page as `public/downloads/TongTong-mac.dmg`.

- With no signing certificate, `signingIdentity: "-"` (ad-hoc) is set. On Apple Silicon, this makes a downloaded app show "Open Anyway" instead of "damaged", and the landing page includes a "System Settings → Privacy & Security → Open Anyway" guide.
- `beforeBuildCommand` deletes the DMG in `out/downloads` so it isn't bundled into the app.

The DMG's Finder window was absurdly large, and the icon and Applications folder were in swapped positions. The cause was `CI=true`, set during the build. In a CI environment, the Tauri DMG bundler skips the AppleScript step that sets the window size and icon positions. The values were fixed in the config and the build rerun without `CI=true`.

```json title="src-tauri/tauri.conf.json"
"macOS": {
  "signingIdentity": "-",
  "dmg": {
    "windowSize": { "width": 660, "height": 400 },
    "appPosition": { "x": 180, "y": 180 },
    "applicationFolderPosition": { "x": 480, "y": 180 }
  }
}
```

If Finder throws an AppleScript error (-10006), detach the mounted `dmg.*` volumes and retry.

## Menu bar tray

The menu bar shows "Today's spending: ₩12,000" (the total of mine, my partner's and shared spending, converted to the base currency), with an "Open TongTong / New entry / Quit" menu. Rust only provides the tray and a `set_tray_title` command; the amount is computed by `DesktopTray`, which reuses the web's query hooks and currency conversion, and only the string is passed via `invoke`. For "New entry", Rust emits a `tray-new-entry` event and the frontend opens the entry sheet.

```rust title="src-tauri/src/lib.rs (excerpt)"
#[tauri::command]
fn set_tray_title(app: AppHandle, title: Option<String>) {
  let Some(tray) = app.tray_by_id(TRAY_ID) else { return };
  let _ = tray.set_title(title.as_deref());
  // The Windows tray has no title, so show it as a tooltip instead
  let tooltip = match title.as_deref() {
    Some(t) => format!("통통 · {t}"),
    None => "통통".to_string(),
  };
  let _ = tray.set_tooltip(Some(tooltip));
}
```

- On macOS the icon is a monochrome template image with `icon_as_template(true)`, so it is tinted to match the menu bar's brightness. Windows/Linux use the color app icon.
- Closing the window only hides it; the app keeps running (to keep the amount updated). Quit is via the tray menu or ⌘Q, and clicking the macOS Dock icon shows the window again in `RunEvent::Reopen`.
- While hidden, it refetches every 5 minutes and switches the date after midnight.
- `DesktopTray` is loaded with `next/dynamic`, keeping it out of the web bundle.

## Windows

### Code signing: pay or not

| Option | Cost (as of May 2026) | Note |
| --- | --- | --- |
| No signing | None | On first run, SmartScreen "Windows protected your PC" → More info → Run anyway |
| Azure Artifact Signing | $9.99/month | Individuals only in the US and Canada |
| OV code signing certificate | $150–300/year | Still a SmartScreen warning until reputation builds |

Azure is ruled out by the residency requirement, and with an OV certificate the first-run experience is not much different from unsigned until reputation builds. It is also about the same level of friction as "Open Anyway" for macOS ad-hoc signing, so the app is unsigned and the landing page says "If 'Windows protected your PC' appears, click 'More info' → 'Run anyway'".

### NSIS, currentUser, WebView2

- The installer is NSIS. MSI (WiX) only builds on Windows.
- `currentUser` mode installs into the user account without admin rights.
- `downloadBootstrapper` is set for machines without WebView2.
- Bundle targets are `["app", "dmg", "nsis"]`; formats that don't match the OS are ignored.

### single-instance: deep links opening a new window

macOS delivers `tongtong://` links to the running app, but Windows/Linux launch a new process and pass the URL as a command-line argument. After Google sign-in, a new window opens, and that window has no PKCE verifier.

`tauri-plugin-single-instance` was added with the `deep-link` feature, on Windows/Linux only. It hands the second launch to the existing process, and the deep-link plugin delivers the URL to the existing window's `onOpenUrl`, so `DesktopBridge` stays unchanged.

```rust title="src-tauri/src/lib.rs" {4-12}
let mut builder = tauri::Builder::default();

// single-instance must be the first plugin to intercept the second launch
#[cfg(any(target_os = "windows", target_os = "linux"))]
{
  builder = builder.plugin(
    tauri_plugin_single_instance::init(|app, _argv, _cwd| {
      // the deep-link feature forwards the URL;
      // here we only bring the window forward
      show_main(app);
    }),
  );
}
```

The scheme is registered in the registry during NSIS install, so for `tauri dev`, which skips installation, `app.deep_link().register_all()` is called in debug builds only.

### http://tauri.localhost

`webOrigin()` used the current origin when the protocol was http/https. The Windows webview origin `http://tauri.localhost` passed that check, so email links became `http://tauri.localhost/auth/callback`. Now desktop always uses the production address.

```ts title="src/lib/platform.ts" {2}
export function webOrigin(): string {
  if (isTauri()) return SITE_URL;
  const { protocol, origin } = window.location;
  return protocol === "http:" || protocol === "https:" ? origin : SITE_URL;
}
```

### Unix dependencies in build scripts

`rm -rf out/downloads` and `desktop:publish`, which used `mkdir -p`, `cp` and `$(...)`, break in Windows `cmd`, so they moved to Node scripts. `scripts/strip-downloads.mjs` is a single `fs.rmSync` line, and `scripts/desktop-publish.mjs` builds dmg or nsis depending on the OS and copies it to `public/downloads/TongTong-mac.dmg` or `TongTong-windows.exe`. File names carry no version, so landing page links stay fixed.

The landing page puts the button for the visitor's OS first. OS detection also uses `useSyncExternalStore` with the server snapshot pinned to `"other"`, and iPadOS Safari, which sends a Mac user agent, is filtered out with `maxTouchPoints`.

### Build environment: windows-latest

Cross-compiling with `cargo-xwin` on a Mac only supports NSIS and is experimental. With no Windows machine, the GitHub Actions `windows-latest` runner was used.

```yaml title=".github/workflows/desktop-windows.yml (condensed)"
jobs:
  build:
    runs-on: windows-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      # ...
    steps:
      # ...
      # pnpm-lock.yaml is v6 (pnpm 8 format), which the latest pnpm rejects
      - uses: pnpm/action-setup@v4
        with: { version: 8 }
      # ... node 22, rust toolchain/cache, pnpm install --frozen-lockfile
      - run: pnpm tauri build --bundles nsis
      - uses: actions/upload-artifact@v4
        with:
          path: src-tauri/target/release/bundle/nsis/*-setup.exe
          # ...
```

- `NEXT_PUBLIC_*` values are baked into client JS, so even in secrets only publishable keys go there. The first step checks for empty secrets and fails.
- The repo is private, so it can't publish through GitHub Releases; the installer is committed to `public/downloads/`. The repo grows with each version, so a proper release needs external hosting.

## Results

- The web and the macOS app use the same `out/` with no build branching.
- The cost of deleting `proxy.ts` is a brief splash from the client gate and a redirect effect on the login page.
- Platform branches exist in three places: OAuth, `DesktopBridge` and the landing skip. All Tauri code is dynamically imported, so none of it is in the web bundle.
- The macOS app ships as an ad-hoc signed DMG.

At the time of writing, Windows is code only. The single-instance and deep link code hasn't been verified to compile, and the CI workflow hasn't run because the repo secrets aren't registered yet. Merging into main without the exe would make the landing page's Windows button a 404, so the merge is blocked.

## Remaining work

- Verify on real Windows hardware: install, getting past SmartScreen, one window after Google sign-in, sign-in persisting across restarts (WebView2 user data folder), 125%/150% DPI layout
- Move installers out of the repo (external hosting)
- Allow both Tauri origins when narrowing backend CORS
