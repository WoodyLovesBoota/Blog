---
title: "Next.js performance: first paint and Lighthouse"
description: Mobile performance work on a Next.js App Router web app. Part 1 completes the first paint from server HTML alone instead of waiting for hydration, bringing the home hero from 9.0s to 1.5s. Part 2 trims translation messages, third-party scripts, render-blocking CSS and the server region to raise the Lighthouse mobile score from 79 to 96.
date: 2025-12-12
tags: [performance, nextjs, react, hydration, lighthouse, case-study]
keywords: [Next.js performance, web performance, first paint, hydration, LCP, hero image, font subsetting, streaming SSR, Lighthouse, Total Blocking Time, next-intl, third-party scripts, CSS chunking, Vercel region]
---

| Metric | Before | After | Note |
| --- | --- | --- | --- |
| Home hero image visible | 9.0s | 1.5s | Throttled mobile, frame capture |
| Lighthouse mobile score | 79 | 96 | Production |
| Total Blocking Time | 390ms | 190ms | Lighthouse |
| Page weight | 2.08MB | 1.03MB | Transferred on load |
| Fonts per page | 1.29MB | 71KB | Subset, preload removed |
| Server response (layout) | 170ms | 30ms | Unthrottled, warm cache |
| Server response (region) | 1,010ms | 324ms | Function region moved |

## Measurement

Both parts use Lighthouse's mobile throttling (150ms RTT · 1.6Mbps · 4× CPU). On a local build all 40 JS chunks are requested before the first paint and the simulation counts every one as blocking the LCP (69 and a 6s LCP locally, real LCP 160ms), so everything was measured on production or deployed builds.

- **Part 1 · First paint**: 390×844 @2x, cache disabled. `Page.startScreencast` saved every painted frame for 12s; times are read from the frames. One run per version.
- **Part 2 · Lighthouse**: Lighthouse 13.5 (DevTools), home, logged out, mobile. One run per deploy, repeated when a result looked off.

## Part 1 · First paint: removing the dependency on hydration

FCP was under 2 seconds, but a frame-by-frame recording showed the home page's hero card empty until about 9 seconds.

![Filmstrip of the home page: three versions across eight timestamps](/images/nextjs-web-performance/home-strip.webp)

_FIG 1 — Home page, 1–12s. A: original · B: after structural refactor · C: after hero image fix. Brand marks are blurred._

### Cause

1. Server renders HTML
2. **Browser paints the HTML** — _← first thing the user sees_
3. Browser downloads and runs JavaScript
4. React hydrates
5. Effects run — _useEffect · onLoad · animate_

With a 4× CPU slowdown, steps 2 and 4 were 7–10 seconds apart. Several things the user should see in step 2 were only set in steps 4 and 5: data copied into a store in an effect, entrance animations that started at `opacity: 0`, an image revealed in `onLoad`, and icons loaded with `ssr: false`. Every change below aims to complete the first paint using only what the server knows: cookies, the URL and server-fetched data.

### Layout data

The shared layout awaited four API calls on every request and then copied the results into a client store inside `useLayoutEffect`. Effects don't run on the server, so the HTML was rendered with the store's empty defaults. Every page waited for data that never appeared in its HTML. The layout now reads only a cookie and returns the shell. Per-user queries start on the server and stream to the client as pending promises; public data is cached for 60 seconds and awaited for at most 300ms.

```tsx title="Before · (web)/layout.tsx" {3-8,18}
export default async function WebLayout({ children }) {
  // every page waits, even ones that use none of it
  const [list, rate, uids, me] = await Promise.allSettled([
    getPartnerList(),
    getUsdRate(),
    isLogin ? getMyUids() : null,
    isLogin ? getMe() : null,
  ]);

  return (
    <StoreBootstrap data={{ list, rate, uids, me }}>
      {children}
    </StoreBootstrap>
  );
}

// StoreBootstrap.tsx — never runs on the server
useLayoutEffect(() => {
  setCommonData(data);
}, []);
```

```tsx title="After · (web)/layout.tsx" {3,9-10,12}
export default async function WebLayout({ children }) {
  const jar = await cookies();
  const isLogin = !!jar.get(ACCESS_TOKEN)?.value;

  return (
    <AppProviders initialIsLogin={isLogin}>
      <QueryPrefetch
        // public data: wait 300ms at most
        awaited={[partnerListOptions()]}
        waitMs={300}
        // personal data: start, don't wait
        queries={isLogin ? [meOptions(), uidsOptions()] : []}
      >
        <SiteShell>{children}</SiteShell>
      </QueryPrefetch>
    </AppProviders>
  );
}

// queryClient.ts — stream unfinished queries too
shouldDehydrateQuery: (q) =>
  defaultShouldDehydrateQuery(q) || q.state.status === "pending",
```

### Hero image

The hero symbol becomes visible when React's `onLoad` handler adds a class. The image finished downloading early, but the handler isn't attached until hydration, so the card stayed empty for several more seconds. An inline script after the image now marks it as loaded as soon as the parser reaches it. The React handler stays for client-side navigation, where the inline script doesn't run.

```tsx title="Before · HomeHero.tsx" {8}
const [loaded, setLoaded] = useState(false);

<Image
  // opacity: 0 until Loaded
  className={cx("Symbol", { Loaded: loaded })}
  src={SYMBOL}
  // attached at hydration
  onLoad={() => setLoaded(true)}
/>
```

```tsx title="After · HomeHero.tsx" {16}
// runs when the parser reaches it — before hydration
const REVEAL = `(function () {
  var img = document.currentScript
    .parentElement.querySelector("img");
  function show() { img.setAttribute("data-loaded", ""); }
  if (img.complete && img.naturalWidth) show();
  else img.addEventListener("load", show, { once: true });
})()`;

<Image
  src={SYMBOL}
  fetchPriority="high"
  onLoad={() => setLoaded(true)}
  suppressHydrationWarning
/>
<script dangerouslySetInnerHTML={{ __html: REVEAL }} />
```

### Entrance animations

The JS animation library on the product intro hero renders its initial state, `opacity: 0`, into the server HTML, so the hero stayed invisible until the library ran: on this profile, from 1.5s to about 9.4s. CSS keyframes, which start once the HTML and CSS have loaded, replace it. Icons had the same problem with `ssr: false` and now use a static import map. Animations below the fold are unchanged.

```tsx title="Before · ProductIntro.tsx" {2,7}
<motion.div
  initial={{ opacity: 0, y: 60 }}
  animate={loaded ? { opacity: 1, y: 0 } : undefined}
>
  <Image src={HERO} onLoad={() => setLoaded(true)} />
</motion.div>
// <h1> is also inside a motion.div with initial={{ opacity: 0 }}
```

```tsx title="After · ProductIntro.tsx · .scss" {9,12}
<div className={cx("HeroImageEnter")}>
  <Image src={HERO} />
</div>
<div className={cx("HeroContentEnter")}>
  <h1>{title}</h1>
</div>

.HeroImageEnter {
  animation: hero-rise 0.9s ease-out backwards;
}
.HeroContentEnter {
  animation: hero-fade 0.8s ease-out backwards;
}
@media (prefers-reduced-motion: reduce) {
  .HeroImageEnter, .HeroContentEnter { animation: none; }
}
```

![Filmstrip of the product intro page: three versions across eight timestamps](/images/nextjs-web-performance/intro-strip.webp)

_FIG 2 — Product intro page, 1–12s. Headline visible at 9.4s → 2.5s → 1.5s._

### Fonts

The brand font (`Brand-Variable.woff2`) was a 1.29MB variable font that still contained 11,172 Hangul glyphs for a locale the site no longer served. Only English pages used it, but `localFont`'s preload default (`true`) preloaded it on all 14 locales. I subset it to the glyphs in use (1.29MB → 71KB), declared `unicode-range` so pages without those characters skip the file, and turned off the preload.

```ts title="After · fonts/brand.ts" {3,6}
export const brand = localFont({
  // 71KB, weight axis kept
  src: "./Brand-latin.woff2",
  weight: "400 1000",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: LATIN }],
});
```

### Related changes

- **Login state**: It defaulted to `false` and was updated in an effect, so signed-in users briefly saw the logged-out header. The server now reads the session cookie and passes it as the provider's initial value.
- **Responsive layout**: A width hook started at 1280px, so mobile users received desktop HTML first. Where the layouts differ, both versions are now rendered and a media query shows one.

### Results

Values are seconds from navigation start. The B → C range also includes unrelated commits, so I attribute only the home hero image change to the hero fix.

| Page | Element | A · Original | B · Refactor | C · Hero fix |
| --- | --- | --- | --- | --- |
| Home | Hero headline | 2.0 | 2.0 | **1.5** |
| | Hero image | 9.0 | 8.5 – 9.0 | **1.5** |
| | Header menu icon | 10 | 2.0 | **1.5** |
| Product intro | Hero headline | 9.4 | 2.5 – 3.0 | **1.5 – 2.0** |
| | Hero image | 9.5 – 10 | 4.0 – 6.0 | **2.5 – 3.0** |

## Part 2 · Lighthouse: removing work

In the production report the real LCP was 662ms, but Lighthouse estimated an LCP of 3.2s and a TBT of 390ms, and those two metrics cost most of the score. The mobile score is an estimate of a slow 4G, 4× CPU phone based on a load over a fast connection, so every transferred byte and every main-thread long task counts whether or not the user notices. The goal was to remove work rather than tune the hero.

### Cause

1. HTML: 490KB uncompressed, 335KB of it translation messages
2. Main thread: long tasks from the analytics SDK · error tracking · chat widget
3. CSS: render-blocking files with other routes' styles, 98–99% unused on home
4. Server: functions ran in the US, the API in Tokyo, TTFB up to 1s

### Translation messages

The locale layout passed the whole message file to the client provider, so it was serialized into the RSC payload of every page. The English file alone was 330KB, and all 3,952 keys sat in one namespace, so picking namespaces wasn't possible.

A build step scans the source for keys client code can reach (literal keys, string constants, template patterns) and writes 1,764 of them to a JSON list. The layout sends only those. Server components read the full file, and development builds send everything so new keys work before the list is rebuilt.

```tsx title="Before · [locale]/layout.tsx" {5}
const messages = (await import(`../messages/${locale}.json`)).default;

return (
  // 330KB in every page's HTML
  <NextIntlClientProvider locale={locale} messages={messages}>
    {children}
  </NextIntlClientProvider>
);
```

```tsx title="After · [locale]/layout.tsx · i18n.util.ts" {4,15}
return (
  <NextIntlClientProvider
    locale={locale}
    messages={pickClientMessages(messages)}
  >
    {children}
  </NextIntlClientProvider>
);

// keys listed at build time by collect-client-keys.js
export function pickClientMessages(messages) {
  if (process.env.NODE_ENV !== "production") return messages;
  const picked = {};
  for (const [key, value] of Object.entries(messages.Index)) {
    if (clientKeySet.has(key)) picked[key] = value;
  }
  return { ...messages, Index: picked };
}
```

### Third-party scripts

Most of the blocking time came from third-party scripts.

- **Product analytics SDK:** the default build bundled session recording, which was unused. It now loads a core build (105KB → 42KB gzip) with a dynamic import and queues calls until it's ready.
- **Error tracking SDK:** the trace sample rate was 0, but the tracing code still loaded and initialized. Build-time flags compile it out.
- **Support chat:** about 440KB, loaded after every page load. It now loads when the user hovers over or opens the launcher.

```tsx title="Before · analytics.ts · layout.tsx" {2,10}
// full build, with session recording
import mixpanel from "mixpanel-browser";

export const track = (event, props) => {
  if (!isInitialized) initMixpanel();
  mixpanel.track(event, props);
};

// downloaded after every page load
<Script id="chat" strategy="lazyOnload" src={CHAT_SRC} />
```

```ts title="After · analytics.ts · chat.ts" {2,10}
// core build, loaded on first call
client ??= import("mixpanel-browser/dist/mixpanel-core.cjs")
  .then((mod) => { mod.default.init(TOKEN); return mod.default; });

export const track = (event, props) =>
  client.then((mp) => mp.track(event, props));

// injected once, when the user opens the chat
export function openChat() {
  loadChat().then((zE) => zE("messenger", "open"));
}
```

```ts title="Before · instrumentation-client.ts" {4}
Sentry.init({
  dsn: DSN,
  // samples nothing, but tracing still loads and runs
  tracesSampleRate: 0,
});
```

```js title="After · next.config.js" {5-6}
compiler: {
  // bundleSizeOptimizations is webpack-only;
  // Turbopack builds get the SDK flags through define
  define: {
    __SENTRY_TRACING__: false,
    __SENTRY_DEBUG__: false,
  },
},
```

### Render-blocking CSS

The default chunking merged other routes' CSS into shared files, so the home page downloaded the service intro (84KB), reviews (27KB) and calculator (23KB) CSS before it could paint. Turbopack's graph chunking groups CSS by what each route actually imports. It produces more files, so the request cost is set to 50,000; higher values merged the files back and lost most of the savings.

```js title="Before · next.config.js"
experimental: {
  optimizeCss: true,
  // cssChunking defaults to true:
  // shared files mix in other routes' CSS
},
```

```js title="After · next.config.js" {3}
experimental: {
  optimizeCss: true,
  cssChunking: { type: "graph", requestCost: 50000 },
},
```

| Route | Default | Graph | Change |
| --- | --- | --- | --- |
| Home | 64.6KB | 46.1KB | −29% |
| Login | 55.7KB | 40.1KB | −28% |
| Service intro | 58.9KB | 47.0KB | −20% |
| Events | 45.0KB | 37.7KB | −16% |
| Exchange list | 56.5KB | 53.7KB | −5% |

### Server region

Requests entered at the Singapore edge and ran in US East, while the API is in Tokyo, so every server-side fetch during rendering crossed the Pacific twice. TTFB ranged from 0.4s to 1.2s. Pinning the functions to Tokyo in `vercel.json` cut server response time from 1,010ms to 324ms.

```text title="Before · response header" {2}
// edge :: function region
x-vercel-id: sin1::iad1::…
```

```jsonc title="After · vercel.json" {2}
{
  "regions": ["hnd1"]
}

// x-vercel-id: sin1::hnd1::…
```

### Results

Each row adds one deploy to the previous one. The second step, measured twice without changes, gave 89 and 91, so differences of a few points are noise.

| Step | Score | FCP | LCP | TBT | Weight |
| --- | --- | --- | --- | --- | --- |
| Before | 79 | 1.8s | 3.2s | 390ms | 2.08MB |
| + Messages, scripts | 89 – 91 | 1.8s | 2.6 – 2.7s | 200 – 240ms | 1.61MB |
| + Chat on demand | 92 | 1.8s | 2.6s | 180ms | 1.17MB |
| + CSS, region | 93 | 1.7s | 2.7s | 170ms | 1.15MB |
| Release | **96** | **1.5s** | **1.8s** | **190ms** | **1.03MB** |

Remaining:

- A shared icon module that ships all 80 icons (28KB, 94% unused)
- An animation library that loads its full bundle in the header (42KB, 74% unused)
