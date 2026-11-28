---
title: "Next.js Tauri 데스크톱 앱"
description: Next.js 16 웹을 정적 export 하나로 묶어 Vercel 웹과 Tauri 2 데스크톱 앱에 같이 올렸다. middleware 제거, 인증·OAuth·딥링크의 클라이언트 이전, DMG 창 깨짐, Windows 단일 인스턴스와 무서명 배포.
date: 2026-05-28
tags: [nextjs, tauri, desktop, supabase, case-study]
keywords: [Next.js static export, output export, Tauri 2, Tauri deep link, Supabase PKCE, localStorage session, NSIS, SmartScreen, code signing, WebView2, tauri.localhost, single-instance]
---

공유 가계부 통통(웹·Android)에 macOS·Windows 데스크톱 앱을 더했다. 목표는 `pnpm build` 가 만드는 `out/` 하나를 Vercel 과 Tauri 가 같이 쓰는 것이다. `TAURI_BUILD` 같은 환경 변수로 빌드를 가르면 두 결과물이 조금씩 어긋나고, 그 차이는 찾기 어렵다.

## 출발점: 서버가 하던 일

Tauri 웹뷰는 정적 파일만 읽으므로 `output: 'export'` 가 필요하고, Route Handler, Server Action, middleware, `cookies()` 같은 요청 시점 API 는 쓸 수 없다.

통통의 페이지는 이미 전부 `"use client"` 였고 데이터는 토큰을 붙인 외부 API 호출로 받는다. 서버 코드는 `src/proxy.ts`(Next.js 16 에서 middleware 가 이름을 바꾼 것) 하나와, 그것이 기대는 쿠키 세션(`@supabase/ssr`)뿐이었다.

```ts title="src/proxy.ts (삭제 전, 요약)"
export async function proxy(request: NextRequest) {
  const supabase = createServerClient(url, anonKey, {
    cookies: { /* request ↔ response 쿠키 */ },
  });
  const { data: { session } } = await supabase.auth.getSession();

  // 세션 없으면 마케팅 랜딩으로
  if (!session && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/landing', request.url));
  }
  // 로그인한 사람은 /login 에서 / 로
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return response;
}
```

## 1단계: 정적 export 로 통일

`next.config.ts` 는 분기 없이 항상 `output: "export"` 다. `manifest.ts`, `robots.ts`, `sitemap.ts` 에는 `export const dynamic = "force-static"` 을 붙여 빌드 시점에 굽고, `start` 스크립트는 `next start` 대신 `out/` 을 정적 서버로 띄운다.

### proxy 를 지우고 게이트는 클라이언트로

비로그인 리다이렉트는 클라이언트 `RequireAuth` 도 이미 하고 있었으므로 proxy 를 지워도 동작은 같다. 빠진 건 "로그인 상태로 /login 에 오면 / 로" 하나이고, 3단계에서 복원했다.

- 서버 리다이렉트에서는 비로그인 사용자가 보호된 페이지 HTML 을 받지 않는다. 클라이언트 게이트에서는 정적 HTML 이 먼저 내려가고 세션 확인까지 스플래시를 보여준다.
- 보호된 페이지 HTML 에는 데이터가 없으므로 노출되는 건 빈 화면 구조 정도다.

### Supabase 세션: 쿠키에서 localStorage + PKCE 로

`@supabase/ssr` 의 `createBrowserClient` 는 서버가 읽을 쿠키에 세션을 둔다. 이제 읽을 서버가 없고, macOS 웹뷰 origin 은 `tauri://localhost` 커스텀 스킴이라 쿠키가 재시작 후 남는다는 보장도 없다. `supabase-js` 의 `createClient` 로 바꿔 세션을 localStorage 에 둔다.

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

PKCE 의 code verifier 가 localStorage 에 있으므로 `code` 교환은 로그인을 시작한 바로 그 웹뷰에서 일어나야 한다. 이 제약이 아래 딥링크 설계를 정했다.

### 메일 링크의 origin

가입 확인 메일의 `emailRedirectTo` 가 `window.location.origin` 이면 데스크톱에서 `tauri://localhost/auth/callback` 이 되어 브라우저가 열 수 없다. `webOrigin()` 헬퍼로 그런 origin 이면 운영 웹 주소를 쓰게 했다(Windows 에서 다시 고친다).

## 2단계: Tauri 2 셸 씌우기

`tauri.conf.json` 의 `frontendDist` 는 웹과 같은 `../out`, `beforeBuildCommand` 는 `pnpm build`, `beforeDevCommand` 는 `pnpm dev`(3000 포트)다. 식별자 `com.tongtong.desktop`, 딥링크 스킴 `tongtong`, 창 1280×800(최소 960×640). 웹 배포에는 `.vercelignore` 로 `src-tauri/` 를 뺐다.

### 권한: opener 는 https 와 mailto 만

`opener` 플러그인을 열어 두면 `file:` 등 아무 스킴이나 열 수 있으므로 `https://*` 와 `mailto:*` 만 허용했다.

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

### Google 로그인과 tongtong:// 딥링크

Google 은 임베디드 웹뷰 OAuth 를 막는다(`disallowed_useragent`). 데스크톱에서는 `skipBrowserRedirect: true` 로 URL 만 받아 시스템 브라우저로 열고, 끝나면 `tongtong://auth/callback?code=...` 로 앱을 깨운다. 이 주소는 Supabase Redirect URLs 에 등록해야 한다.

```ts title="src/lib/auth/oauth.ts" {5-8}
export async function signInWithGoogle() {
  const supabase = getSupabaseBrowserClient();
  if (!isTauri()) {
    // ... 웹: redirectTo `${window.location.origin}/auth/callback`
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: DESKTOP_AUTH_CALLBACK, skipBrowserRedirect: true },
  });
  if (error) return { error };
  await openExternal(data.url); // 시스템 브라우저
  return { error: null };
}
```

루트의 `DesktopBridge` 는 딥링크의 `code` 를 직접 교환하지 않고 웹뷰의 `/auth/callback?code=` 로 넘긴다. 웹과 같은 `exchangeCodeForSession` 경로를 타고 verifier 도 같은 localStorage 에서 찾는다. 앱이 꺼져 있다가 링크로 켜진 경우는 `getCurrent()` 가 URL 을 돌려준다.

```tsx title="src/components/layout/DesktopBridge.tsx (요약)"
const handleUrls = (urls: string[] | null | undefined) => {
  const hit = urls?.find((u) => u.startsWith(DESKTOP_AUTH_CALLBACK));
  if (!hit) return;
  // getCurrent() 는 앱을 띄운 링크를 새로고침 뒤에도 다시 돌려준다.
  // 같은 code 를 두 번 교환하지 않게
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

- 웹뷰는 `target="_blank"` 로 새 창을 열지 않으므로, 다른 origin 의 https/mailto 클릭을 캡처 단계에서 가로채 시스템 브라우저로 넘긴다.
- Tauri 플러그인은 이 컴포넌트 안에서만 dynamic import 하고, `isTauri()` 는 `@tauri-apps/api` 대신 전역 `globalThis.isTauri` 를 본다. 웹 첫 로드 번들에 Tauri 코드가 실리지 않는다.
- API 는 `fetch` + Bearer 토큰이고 백엔드 CORS 가 모든 origin 을 허용해 Tauri http 플러그인 없이 동작한다. CORS 를 좁히면 `tauri://localhost`(macOS)와 `http://tauri.localhost`(Windows)를 허용해야 한다.

## 3단계: 앱 안에서는 랜딩 건너뛰기

앱을 연 사람은 이미 설치한 사람이므로 마케팅 랜딩이 필요 없다.

- `RequireAuth`: 세션이 없으면 웹은 `/landing`, 데스크톱은 `/login`
- `DesktopBridge`: 데스크톱에서 `/landing` 진입 시 `/login`
- 로그인 화면: 데스크톱에서 "홈으로 돌아가기" 숨김
- 로그인 페이지 마운트 시 `getSession()` 에 세션이 있으면 `/` 로(proxy 에서 빠진 동작 복원). `/onboarding` 분기는 `/` 의 `RequireAuth` 가 처리

렌더링 결과가 달라지는 분기에 `isTauri()` 를 바로 쓰면, 웹 기준으로 구운 정적 HTML 과 Tauri 첫 렌더가 달라 hydration 불일치가 난다. 서버 스냅샷을 `false` 로 고정한다.

```ts title="src/hooks/useIsTauri.ts"
const noopSubscribe = () => () => {};

export function useIsTauri(): boolean {
  return useSyncExternalStore(noopSubscribe, isTauri, () => false);
}
```

## DMG 창이 깨져서 나온 문제

DMG 는 `public/downloads/TongTong-mac.dmg` 로 랜딩에서 받게 했다.

- 서명 인증서가 없어 `signingIdentity: "-"`(ad-hoc)를 넣었다. Apple Silicon 에서 다운로드한 앱이 "손상됨" 대신 "그래도 열기" 를 보여주게 하려는 설정이고, 랜딩에 "시스템 설정 → 개인정보 보호 및 보안 → 그래도 열기" 안내를 붙였다.
- `out/downloads` 의 DMG 가 앱 안에 묶이지 않도록 `beforeBuildCommand` 에서 지운다.

DMG 의 Finder 창이 터무니없이 크고 아이콘과 Applications 폴더 순서가 뒤바뀌어 있었다. 원인은 빌드 시 켠 `CI=true` 다. Tauri DMG 번들러는 CI 환경에서 AppleScript 로 창 크기와 아이콘 위치를 잡는 단계를 건너뛴다. 설정에 값을 고정하고 `CI=true` 없이 다시 빌드했다.

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

Finder AppleScript 에러(-10006)가 나면 마운트된 `dmg.*` 볼륨을 detach 하고 다시 시도한다.

## 메뉴 막대 트레이

메뉴 막대에 "오늘 지출: ₩12,000"(나, 파트너, 공동 지출을 기준 통화로 환산한 합)을 표시하고 "통통 열기 / 기록하기 / 종료" 메뉴를 둔다. Rust 는 트레이와 `set_tray_title` 커맨드만 제공하고, 금액 계산은 웹의 쿼리 훅과 환율 변환을 재사용하는 `DesktopTray` 가 해서 문자열만 `invoke` 로 넘긴다. "기록하기" 는 Rust 가 `tray-new-entry` 이벤트를 보내 프론트가 기록 시트를 연다.

```rust title="src-tauri/src/lib.rs (일부)"
#[tauri::command]
fn set_tray_title(app: AppHandle, title: Option<String>) {
  let Some(tray) = app.tray_by_id(TRAY_ID) else { return };
  let _ = tray.set_title(title.as_deref());
  // Windows 트레이에는 제목이 없어서 툴팁으로 대신 보여준다
  let tooltip = match title.as_deref() {
    Some(t) => format!("통통 · {t}"),
    None => "통통".to_string(),
  };
  let _ = tray.set_tooltip(Some(tooltip));
}
```

- macOS 아이콘은 단색 template 이미지에 `icon_as_template(true)` 를 줘 메뉴 막대 밝기에 맞춰 색이 입혀진다. Windows/Linux 는 컬러 앱 아이콘.
- 창 닫기는 창만 숨기고 앱은 유지한다(금액 갱신용). 종료는 트레이 메뉴나 ⌘Q, macOS Dock 클릭 시 `RunEvent::Reopen` 에서 창을 다시 보인다.
- 숨겨진 동안에도 5분마다 다시 받고 자정을 넘기면 날짜를 바꾼다.
- `DesktopTray` 는 `next/dynamic` 으로 불러와 웹 번들에서 뺐다.

## Windows 편

### 코드 서명: 돈을 낼 것인가

| 선택지 | 비용 (2026년 5월 기준) | 비고 |
| --- | --- | --- |
| 서명 안 함 | 없음 | 첫 실행 시 SmartScreen "Windows의 PC 보호" → 추가 정보 → 실행 |
| Azure Artifact Signing | 월 $9.99 | 개인은 미국·캐나다만 가능 |
| OV 코드 서명 인증서 | 연 $150–300 | 평판이 쌓이기 전에는 여전히 SmartScreen 경고 |

Azure 는 거주 요건으로 빠지고, OV 인증서는 평판이 쌓이기 전까지 무서명과 첫 경험이 크게 다르지 않다. macOS ad-hoc 서명의 "그래도 열기" 와 같은 수준의 절차이기도 해서 서명하지 않고, 랜딩에 "'Windows의 PC 보호' 창이 뜨면 '추가 정보' → '실행'" 안내를 넣었다.

### NSIS, currentUser, WebView2

- 설치 파일은 NSIS. MSI(WiX)는 Windows 에서만 빌드된다.
- `currentUser` 모드로 관리자 권한 없이 사용자 계정에 설치한다.
- WebView2 가 없는 경우를 위해 `downloadBootstrapper` 를 지정했다.
- 번들 targets 는 `["app", "dmg", "nsis"]` 이고 OS 에 맞지 않는 형식은 무시된다.

### single-instance: 딥링크가 새 창을 띄우는 문제

macOS 는 `tongtong://` 링크를 실행 중인 앱에 전달하지만, Windows/Linux 는 새 프로세스를 띄우고 URL 을 명령줄 인자로 넘긴다. 그러면 Google 로그인 후 새 창이 뜨고, 그 창에는 PKCE verifier 가 없다.

Windows/Linux 에서만 `tauri-plugin-single-instance` 를 `deep-link` feature 와 함께 넣었다. 두 번째 실행을 기존 프로세스로 넘기고 URL 은 deep-link 플러그인이 기존 창의 `onOpenUrl` 로 전달하므로 `DesktopBridge` 는 그대로다.

```rust title="src-tauri/src/lib.rs" {4-11}
let mut builder = tauri::Builder::default();

// single-instance 는 반드시 첫 번째 플러그인이어야 두 번째 실행을 가로챌 수 있다
#[cfg(any(target_os = "windows", target_os = "linux"))]
{
  builder = builder.plugin(
    tauri_plugin_single_instance::init(|app, _argv, _cwd| {
      // URL 전달은 deep-link feature 가 한다. 여기선 창만 앞으로
      show_main(app);
    }),
  );
}
```

스킴은 NSIS 설치 때 레지스트리에 등록되므로, 설치를 거치지 않는 `tauri dev` 용으로 debug 빌드에서만 `app.deep_link().register_all()` 을 호출한다.

### http://tauri.localhost

`webOrigin()` 은 프로토콜이 http/https 면 현재 origin 을 썼다. Windows 웹뷰 origin `http://tauri.localhost` 는 이를 통과해 메일 링크가 `http://tauri.localhost/auth/callback` 이 된다. 데스크톱이면 무조건 운영 주소를 쓰게 바꿨다.

```ts title="src/lib/platform.ts" {2}
export function webOrigin(): string {
  if (isTauri()) return SITE_URL;
  const { protocol, origin } = window.location;
  return protocol === "http:" || protocol === "https:" ? origin : SITE_URL;
}
```

### 빌드 스크립트의 유닉스 의존

`rm -rf out/downloads` 와 `mkdir -p`·`cp`·`$(...)` 를 쓰던 `desktop:publish` 는 Windows `cmd` 에서 깨지므로 Node 스크립트로 옮겼다. `scripts/strip-downloads.mjs` 는 `fs.rmSync` 한 줄, `scripts/desktop-publish.mjs` 는 OS 에 따라 dmg/nsis 를 빌드해 `public/downloads/TongTong-mac.dmg` 또는 `TongTong-windows.exe` 로 복사한다. 파일명에 버전이 없어 랜딩 링크가 고정된다.

랜딩은 방문자 OS 에 맞는 버튼을 앞에 둔다. OS 판별도 `useSyncExternalStore` 로 서버 스냅샷을 `"other"` 로 고정하고, Mac user agent 를 보내는 iPadOS Safari 는 `maxTouchPoints` 로 거른다.

### 빌드 환경: windows-latest

맥에서 `cargo-xwin` 크로스 컴파일은 NSIS 만 되고 실험적이다. Windows 머신이 없어서 GitHub Actions `windows-latest` 러너를 썼다.

```yaml title=".github/workflows/desktop-windows.yml (요약)"
jobs:
  build:
    runs-on: windows-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      # ...
    steps:
      # ...
      # pnpm-lock.yaml 이 v6(pnpm 8 형식)이라 최신 pnpm 은 거부한다
      - uses: pnpm/action-setup@v4
        with: { version: 8 }
      # ... node 22, rust toolchain/cache, pnpm install --frozen-lockfile
      - run: pnpm tauri build --bundles nsis
      - uses: actions/upload-artifact@v4
        with:
          path: src-tauri/target/release/bundle/nsis/*-setup.exe
          # ...
```

- `NEXT_PUBLIC_*` 는 클라이언트 JS 에 박히므로 시크릿에 넣더라도 publishable 키만 넣는다. 시크릿이 비어 있으면 첫 단계에서 실패하게 검사한다.
- private 레포라 GitHub Releases 로 공개할 수 없어 `public/downloads/` 에 커밋한다. 버전마다 레포가 커지므로 정식 배포 때는 외부 호스팅으로 옮겨야 한다.

## 결과

- 웹과 macOS 앱이 빌드 분기 없이 같은 `out/` 을 쓴다.
- `proxy.ts` 를 지운 대가는 클라이언트 게이트의 짧은 스플래시와 로그인 페이지의 리다이렉트 effect 정도다.
- 플랫폼 분기는 OAuth, `DesktopBridge`, 랜딩 건너뛰기 세 군데이고, Tauri 코드는 전부 dynamic import 라 웹 번들에 없다.
- macOS 앱은 ad-hoc 서명 DMG 로 배포한다.

Windows 는 작성 시점 기준 코드만 들어간 상태다. single-instance 와 딥링크 코드는 컴파일이 검증되지 않았고, CI 워크플로는 리포 시크릿 등록 전이라 실행되지 않았다. 랜딩의 Windows 버튼은 exe 없이 main 에 합치면 404 가 나므로 병합을 막아 두었다.

## 남은 과제

- Windows 실기기 검증: 설치, SmartScreen 통과, Google 로그인 후 창 하나 유지, 재시작 후 로그인 유지(WebView2 사용자 데이터 폴더), 125%/150% DPI 레이아웃
- 설치 파일을 레포 밖(외부 호스팅)으로 옮기기
- 백엔드 CORS 를 좁힐 때 두 Tauri origin 허용
