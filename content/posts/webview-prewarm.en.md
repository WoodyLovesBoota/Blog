---
title: "Preloading WebView tabs in React Native"
description: The Benefits tab, a Next.js page inside a WebView, took about 2.4 seconds to open. A separate WebView layout made the page lighter, and loading the tabs at app startup brought it down to 0.3 seconds.
date: 2026-06-21
tags: [performance, react-native, webview, nextjs, case-study]
keywords: [WebView pre-warm, React Native WebView, React Navigation lazy, freezeOnBlur, detachInactiveScreens, Next.js route group, tab loading time]
---

Most of the app's main tabs are Next.js pages inside WebViews. Opening the Benefits tab showed a skeleton for about 2.4 seconds, even on a simulator connected to a local server.

| Metric | Before | After | Note |
| --- | --- | --- | --- |
| Benefits tab | 2.37s | 0.27s | Tap to fully drawn, median of 3 |
| Web page alone | 2.37s | 1.70s | Lighter page, no pre-warm |
| Benefits page JS | 583KB | 412KB | Next.js First Load JS |

## Background

Home is a native screen; Events, Benefits and Point are WebView pages. Tapping a web tab switched the tab bar immediately, but a grey skeleton stayed on screen.

![Filmstrip of the Benefits tab: three versions across eight timestamps](/images/webview-prewarm/benefit-strip.webp)

_FIG 1 — Benefits tab, 0–3s after the tap. A: original · B: lighter web page · C: lighter page + pre-warmed tabs. Amounts, partner names and logos are blurred._

## Measurement

- A/B/C run on the same native binary; only the JavaScript bundle and the web server differ. A test hook switches to the Benefits tab six seconds after Home mounts.
- "Fully drawn": the first frame after which the content area stops changing
- iPhone 17 Pro simulator, release build, Hermes / `next start` on the same Mac / WebView data cleared before each run
- `simctl io recordVideo` at 30fps, three runs per version, median reported

## Cause

1. User taps the tab — _← the wait starts here_
2. React Navigation mounts the screen — _lazy: true_
3. WebView requests the page; the server layout awaits five APIs
4. Page JavaScript downloads and hydrates
5. Skeleton stays up a little longer — _500ms on iOS · 2s on Android, after onLoadEnd_

No single step is slow. Every step started only after the tap, so they added up in sequence. The two levers: make the page cheaper to load, and start loading before the tap.

## 1 · Web page

Every WebView page shared the site's full layout. Before rendering, it awaited the partner list, the user's UIDs, profile, push history and an exchange rate, and wrapped the page in the desktop provider tree.

The main tabs moved to an `(optimize)` route group with a smaller provider and no server-side waits. Each page fetches only the data it shows. This alone took the Benefits tab from 2.37s to 1.70s (Fig 1, row B).

```tsx title="Before · webview/layout.tsx" {3-5,7}
export default async function Commonlayout({ children, params }) {
  const token = cookies().get(ACCESS_TOKEN);
  const [calcValue] = await getCodeData();
  const [exchangeList, myUid, myInfo, myAlarm] =
    await getData(langType, isLogin);
  return (
    <RootProvider>
      {/* ... ThemeProvider, StateClientLayout */}
    </RootProvider>
  );
}
```

```tsx title="After · webview/(optimize)/layout.tsx" {5}
const OptimizeWebviewLayout = ({ children }) => {
  // theme comes from the app's cookie, no API call
  const theme = cookies().get("appTheme")?.value || "light";
  return (
    <OptimizeWebviewProvider>
      {/* ... ThemeProvider, StateClientLayoutWebview */}
    </OptimizeWebviewProvider>
  );
};
// OptimizeWebviewProvider: React Query + Recoil + popups
```

## 2 · Pre-warm

With `lazy: false`, React Navigation mounts all tab screens when the tab navigator first renders, so each WebView loads its page while the user is still on Home.

- `detachInactiveScreens={false}`: native views stay attached, so a loaded page isn't torn down.
- `freezeOnBlur`: hidden tabs don't re-render.
- Screens no longer wait for the theme before rendering the WebView. The token and theme are injected before the page loads.

```tsx title="After · Main.route.tsx" {2,4-5}
<Navigator
  detachInactiveScreens={false}
  screenOptions={{
    lazy: false,
    freezeOnBlur: true,
    animation: "shift",
    tabBarShowLabel: true,
  }}
>
```

```tsx title="After · Benefit.view.tsx" {6-9}
<View style={{ flex: 1 }}>
  <WebView
    key={appTheme}
    uri={WEB_URL.BENEFIT(isPartner)}
    token={token}
    injectedJavaScriptBeforeContentLoaded={
      token
        ? `document.cookie="accessToken=${token};path=/"; true;`
        : undefined
    }
  />
</View>
```

## Results

Seconds after the tap, median of three runs with the range. In C the page has already loaded at the tap, so the remaining time is the tab transition.

| Tab | _A_ Original | _B_ Web page | _C_ + Pre-warm |
| --- | --- | --- | --- |
| Benefits, median | 2.37 | 1.70 | **0.27** |
| Benefits, range | 2.33 – 2.47 | 1.67 – 2.00 | **0.17 – 0.30** |

Over the same period the other tab pages and the shared chunk grew. Those tabs are faster because of pre-warming, not smaller pages.

| First Load JS | _A_ Before | _C_ After |
| --- | --- | --- |
| Benefits | 583KB | **412KB** |
| Events | 630KB | 708KB |
| Point | 588KB | 709KB |
| Point intro | 583KB | 696KB |
| Shared by all pages | 195KB | 317KB |

## Open issues

- The 500ms skeleton hold and a second page load caused by the late User-Agent are still in the WebView component. In C they happen while the tab is hidden; a user who taps before preloading finishes still sees them.
- Every web tab now loads at launch whether or not it is opened, using more network and memory early in the session. Not measured.
- `lazy: true` was originally added so the Point intro page wouldn't fire a deep link during sign-up. With it off, that page mounts at startup again. That flow was not retested.
- Simulator and local server, so network latency is missing. On a real phone A and B would take longer; C should stay near zero as long as preloading finishes before the tap.
