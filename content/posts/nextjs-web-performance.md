---
title: "Next.js 웹 최적화: 첫 화면, Lighthouse"
description: Next.js App Router 웹 앱의 모바일 성능 개선. 1부는 하이드레이션 이후에야 세팅되던 첫 화면을 서버 HTML만으로 완성해 히어로 표시를 9.0초에서 1.5초로, 2부는 번역 메시지·서드파티 스크립트·렌더 블로킹 CSS·서버 리전을 정리해 Lighthouse 모바일 점수를 79에서 96으로 올렸다.
date: 2025-12-12
tags: [performance, nextjs, react, hydration, lighthouse, case-study]
keywords: [Next.js 성능 최적화, 웹 최적화, 하이드레이션, 히어로 이미지, 폰트 서브셋, 스트리밍 SSR, Lighthouse 점수, 서드파티 스크립트, CSS chunking, Vercel 리전, first paint, hydration, LCP, Total Blocking Time, next-intl, font subsetting]
translatedFrom: en
---

| 지표 | 이전 | 이후 | 비고 |
| --- | --- | --- | --- |
| 홈 히어로 이미지 표시 | 9.0s | 1.5s | 모바일 스로틀링, 프레임 실측 |
| Lighthouse 모바일 점수 | 79 | 96 | 프로덕션 |
| Total Blocking Time | 390ms | 190ms | Lighthouse |
| 페이지 용량 | 2.08MB | 1.03MB | 로드 시 전송량 |
| 페이지당 폰트 | 1.29MB | 71KB | 서브셋, preload 제거 |
| 서버 응답 (레이아웃) | 170ms | 30ms | 스로틀링 없음, 캐시 warm |
| 서버 응답 (리전) | 1,010ms | 324ms | 함수 리전 이동 |

## 측정

공통 조건은 Lighthouse 모바일 스로틀링(150ms RTT · 1.6Mbps · 4× CPU)이다. 로컬 빌드는 JS chunk 40개가 첫 페인트 전에 모두 요청돼 시뮬레이션이 전부 LCP 블로킹으로 계산하므로(로컬 69점·LCP 6초, 실제 LCP 160ms), 모두 프로덕션/배포 빌드로 쟀다.

- **1부 · 첫 화면**: 390×844 @2x, 캐시 비활성화. `Page.startScreencast`로 12초간 그려진 프레임을 전부 저장해 요소가 보이는 시점을 읽었다. 버전당 1회.
- **2부 · Lighthouse**: Lighthouse 13.5(DevTools), 홈·로그아웃·모바일. 배포당 1회, 이상하면 재실행.

## 1부 · 첫 화면: 하이드레이션 의존 제거

FCP는 2초 미만이었지만, 페이지를 프레임 단위로 녹화하면 홈 화면 히어로 카드가 약 9초까지 비어 있었다.

![홈 화면 필름스트립: 세 버전을 여덟 시점에 걸쳐 비교](/images/nextjs-web-performance/home-strip.webp)

_FIG 1 — 홈 화면, 1–12s. A: 원본 · B: 구조 리팩터링 이후 · C: 히어로 이미지 수정 이후. 브랜드 마크는 블러 처리했다._

### 원인

1. 서버가 HTML을 렌더링한다
2. **브라우저가 HTML을 그린다** — _← 사용자가 처음 보는 화면_
3. 브라우저가 JavaScript를 내려받아 실행한다
4. React가 하이드레이션한다
5. effect가 실행된다 — _useEffect · onLoad · animate_

CPU 4배 감속에서 2단계와 4단계 사이가 7–10초였다. 2단계에 보여야 할 것들이 4, 5단계에서 세팅되고 있었다. effect에서 store로 복사하는 데이터, `opacity: 0`에서 시작하는 등장 애니메이션, `onLoad`에서 드러나는 이미지, `ssr: false`로 불러오는 아이콘이다. 아래 변경은 모두 첫 화면을 서버가 아는 것(쿠키, URL, 서버에서 가져온 데이터)만으로 완성하기 위한 것이다.

### 레이아웃 데이터

공통 레이아웃은 요청마다 API 호출 네 개를 await한 뒤 결과를 `useLayoutEffect`에서 클라이언트 store로 복사했다. effect는 서버에서 실행되지 않으므로 HTML은 store의 빈 기본값으로 렌더링됐다. 모든 페이지가 자기 HTML에 쓰이지도 않는 데이터를 기다렸다. 이제 레이아웃은 쿠키만 읽고 셸을 반환한다. 사용자별 쿼리는 서버에서 시작해 pending 상태의 promise로 스트리밍하고, 공개 데이터는 60초 캐시하며 최대 300ms까지만 await한다.

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

### 히어로 이미지

히어로 심볼은 React `onLoad` 핸들러가 클래스를 붙여야 보인다. 이미지 다운로드는 일찍 끝나도 핸들러는 하이드레이션 때 연결되므로, 카드는 그 뒤로 몇 초 더 비어 있었다. 그래서 이미지 뒤에 인라인 스크립트를 두어 파서가 도달하는 즉시 이미지를 로드 완료로 표시한다. 인라인 스크립트가 실행되지 않는 클라이언트 사이드 내비게이션을 위해 React 핸들러는 남겨 뒀다.

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

### 등장 애니메이션

제품 소개 페이지 히어로의 JS 애니메이션 라이브러리는 초기 상태 `opacity: 0`을 서버 HTML에 그대로 렌더링한다. 그래서 라이브러리가 실행될 때까지, 이 환경에서는 1.5s부터 약 9.4s까지 히어로가 보이지 않았다. HTML과 CSS가 로드되면 바로 시작하는 CSS keyframes로 바꿨다. `ssr: false` 아이콘도 같은 문제라 정적 import 맵으로 바꿨다. 첫 화면 아래 애니메이션은 그대로 뒀다.

```tsx title="Before · ProductIntro.tsx" {2,7}
<motion.div
  initial={{ opacity: 0, y: 60 }}
  animate={loaded ? { opacity: 1, y: 0 } : undefined}
>
  <Image src={HERO} onLoad={() => setLoaded(true)} />
</motion.div>
// <h1>도 initial={{ opacity: 0 }}인 motion.div 안에 있다
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

![제품 소개 페이지 필름스트립: 세 버전을 여덟 시점에 걸쳐 비교](/images/nextjs-web-performance/intro-strip.webp)

_FIG 2 — 제품 소개 페이지, 1–12s. 헤드라인이 보이는 시점 9.4s → 2.5s → 1.5s._

### 폰트

브랜드 폰트(`Brand-Variable.woff2`)는 1.29MB 가변 폰트로, 더 이상 지원하지 않는 로케일용 한글 글리프 11,172자가 들어 있었다. 이 폰트를 쓰는 건 영어 페이지뿐인데 `localFont`의 preload 기본값(`true`) 때문에 14개 로케일 전체에서 preload됐다. 쓰는 글리프만 남기도록 서브셋하고(1.29MB → 71KB), `unicode-range`를 선언해 해당 문자가 없는 페이지는 파일을 건너뛰게 했으며, preload를 껐다.

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

### 관련 변경

- **로그인 상태**: 기본값 `false`에서 effect로 갱신돼 로그인한 사용자도 잠깐 로그아웃 헤더를 봤다. 이제 서버가 세션 쿠키를 읽어 provider 초기값으로 넘긴다.
- **반응형 레이아웃**: 너비 훅이 1280px에서 시작해 모바일도 데스크톱 HTML을 먼저 받았다. 레이아웃이 다른 부분은 두 버전을 모두 렌더링하고 미디어 쿼리로 하나만 보여 준다.

### 결과

내비게이션 시작부터의 초 단위 시간이다. B → C 구간에는 무관한 커밋도 섞여 있어, 히어로 수정의 효과로 보는 건 홈 히어로 이미지 변화뿐이다.

| 페이지 | 요소 | A · 원본 | B · 리팩터링 | C · 히어로 수정 |
| --- | --- | --- | --- | --- |
| 홈 | 히어로 헤드라인 | 2.0 | 2.0 | **1.5** |
| | 히어로 이미지 | 9.0 | 8.5 – 9.0 | **1.5** |
| | 헤더 메뉴 아이콘 | 10 | 2.0 | **1.5** |
| 제품 소개 | 히어로 헤드라인 | 9.4 | 2.5 – 3.0 | **1.5 – 2.0** |
| | 히어로 이미지 | 9.5 – 10 | 4.0 – 6.0 | **2.5 – 3.0** |

## 2부 · Lighthouse: 작업량 줄이기

프로덕션 리포트에서 실제 LCP는 662ms였지만, Lighthouse는 LCP 3.2초, TBT 390ms로 추정했고 점수는 대부분 이 두 지표에서 깎였다. 모바일 점수는 빠른 회선에서 로드한 결과로 slow 4G·4× CPU 환경을 추정한 값이라, 체감과 무관하게 전송 바이트와 메인 스레드 long task가 모두 더해진다. 그래서 히어로 튜닝보다 작업 자체를 줄이는 쪽을 택했다.

### 원인

1. HTML: 압축 전 490KB, 그중 335KB가 번역 메시지
2. 메인 스레드: 분석 SDK · 에러 트래킹 · 채팅 위젯의 long task
3. CSS: 다른 라우트 스타일까지 담긴 렌더 블로킹 파일, 홈에서 98–99% 미사용
4. 서버: 함수는 미국, API는 도쿄에서 실행, TTFB 최대 1초

### 번역 메시지

locale 레이아웃이 메시지 파일 전체를 클라이언트 provider에 넘겨서, 모든 페이지의 RSC payload에 직렬화됐다. 영어 파일만 330KB였고 3,952개 키가 한 namespace에 있어 namespace 단위로 고를 수도 없었다.

빌드 단계에서 소스를 스캔해 클라이언트 코드가 접근할 수 있는 키(리터럴 키, 문자열 상수, 템플릿 패턴) 1,764개를 JSON 목록으로 만들고, 레이아웃은 그 키만 보낸다. 서버 컴포넌트는 전체 파일을 읽고, 개발 빌드는 목록 재생성 전에도 새 키가 동작하도록 전부 보낸다.

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

### 서드파티 스크립트

blocking time 대부분이 서드파티 스크립트에서 나왔다.

- **제품 분석 SDK:** 기본 빌드에 쓰지 않는 세션 녹화가 번들돼 있었다. dynamic import로 core 빌드(105KB → 42KB gzip)를 불러오고, 준비될 때까지 호출을 큐에 쌓는다.
- **에러 트래킹 SDK:** trace sample rate가 0인데도 tracing 코드가 로드·초기화됐다. 빌드 타임 플래그로 컴파일에서 뺐다.
- **고객 지원 채팅:** 약 440KB를 매 페이지 로드 후 불러왔다. 런처에 hover하거나 열 때 로드한다.

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

### 렌더 블로킹 CSS

기본 chunking이 다른 라우트 CSS를 공유 파일에 합쳐서, 홈은 첫 페인트 전에 서비스 소개(84KB), 리뷰(27KB), 계산기(23KB) CSS까지 받아야 했다. Turbopack graph chunking은 라우트가 실제로 import하는 단위로 CSS를 묶는다. 파일 수가 늘어나므로 request cost는 50,000으로 했다. 더 높이면 파일이 다시 합쳐져 절감 효과가 대부분 사라졌다.

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

| 라우트 | 기본값 | Graph | 변화 |
| --- | --- | --- | --- |
| 홈 | 64.6KB | 46.1KB | −29% |
| 로그인 | 55.7KB | 40.1KB | −28% |
| 서비스 소개 | 58.9KB | 47.0KB | −20% |
| 이벤트 | 45.0KB | 37.7KB | −16% |
| 거래소 목록 | 56.5KB | 53.7KB | −5% |

### 서버 리전

요청은 싱가포르 엣지로 들어와 미국 동부에서 실행됐고, API는 도쿄에 있어 렌더링 중 서버 fetch가 매번 태평양을 두 번 건넜다. TTFB는 0.4~1.2초를 오갔다. `vercel.json`에서 함수 리전을 도쿄로 고정하자 서버 응답 시간이 1,010ms에서 324ms가 됐다.

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

### 결과

각 행은 이전 행에 배포 하나를 더한 결과다. 두 번째 단계는 변경 없이 두 번 측정해 89점과 91점이 나왔으므로, 몇 점 차이는 노이즈다.

| 단계 | 점수 | FCP | LCP | TBT | 용량 |
| --- | --- | --- | --- | --- | --- |
| Before | 79 | 1.8s | 3.2s | 390ms | 2.08MB |
| + 메시지, 스크립트 | 89 – 91 | 1.8s | 2.6 – 2.7s | 200 – 240ms | 1.61MB |
| + 채팅 지연 로드 | 92 | 1.8s | 2.6s | 180ms | 1.17MB |
| + CSS, 리전 | 93 | 1.7s | 2.7s | 170ms | 1.15MB |
| 릴리스 | **96** | **1.5s** | **1.8s** | **190ms** | **1.03MB** |

남은 항목:

- 아이콘 80개를 전부 내보내는 공용 아이콘 모듈(28KB, 94% 미사용)
- 헤더에서 전체 번들을 불러오는 애니메이션 라이브러리(42KB, 74% 미사용)
