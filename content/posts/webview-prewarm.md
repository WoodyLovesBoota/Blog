---
title: "React Native WebView 최적화: 탭 프리로딩"
description: WebView 안의 Next.js 페이지인 혜택 탭이 열리는 데 2.4초쯤 걸렸다. WebView 전용 레이아웃으로 페이지를 가볍게 하고, 탭을 앱 시작 시 미리 로드해 0.3초로 줄였다.
date: 2026-06-21
tags: [performance, react-native, webview, nextjs, case-study]
keywords: [WebView 프리웜, WebView 미리 로드, 리액트 네이티브 웹뷰, 탭 로딩 속도, WebView pre-warm, React Native WebView, React Navigation lazy, freezeOnBlur, detachInactiveScreens, Next.js route group, tab loading time]
translatedFrom: en
---

앱의 메인 탭 대부분은 WebView 안의 Next.js 페이지다. 혜택 탭을 열면 로컬 서버에 붙인 시뮬레이터에서도 스켈레톤이 2.4초쯤 떠 있었다.

| 지표 | 이전 | 이후 | 비고 |
| --- | --- | --- | --- |
| 혜택 탭 | 2.37s | 0.27s | 탭부터 완전히 그려질 때까지, 3회 중앙값 |
| 웹 페이지만 개선 | 2.37s | 1.70s | 가벼워진 페이지, 프리웜 없음 |
| 혜택 페이지 JS | 583KB | 412KB | Next.js First Load JS |

## 배경

홈은 네이티브 화면이고 이벤트, 혜택, 포인트는 WebView 페이지다. 웹 탭을 누르면 탭 바는 바로 전환되지만 회색 스켈레톤이 한참 남았다.

![혜택 탭 필름스트립: 세 가지 버전을 여덟 개 시점에 걸쳐 비교](/images/webview-prewarm/benefit-strip.webp)

_FIG 1 — 탭 후 0–3s 동안의 혜택 탭. A: 원본 · B: 가벼워진 웹 페이지 · C: 가벼워진 페이지 + 탭 프리웜. 금액, 제휴사 이름과 로고는 블러 처리했다._

## 측정

- A/B/C는 같은 네이티브 바이너리이고 JavaScript bundle과 웹 서버만 다르다. 테스트 훅이 홈 마운트 6초 뒤 혜택 탭으로 전환한다.
- "완전히 그려짐": 콘텐츠 영역이 더 이상 바뀌지 않는 첫 프레임
- iPhone 17 Pro 시뮬레이터, 릴리스 빌드, Hermes / 같은 Mac에서 `next start` / 매 실행 전 WebView 데이터 삭제
- `simctl io recordVideo` 30fps, 버전마다 3회, 중앙값

## 원인

1. 사용자가 탭을 누른다 — _← 대기는 여기서 시작된다_
2. React Navigation이 화면을 마운트한다 — _lazy: true_
3. WebView가 페이지를 요청하고, 서버 레이아웃이 API 다섯 개를 await한다
4. 페이지 JavaScript를 내려받고 하이드레이션한다
5. 스켈레톤이 조금 더 남아 있다 — _onLoadEnd 이후 iOS 500ms · Android 2s_

특별히 느린 단계는 없다. 모든 단계가 탭한 뒤에야 시작되어 순차로 쌓였다. 줄이는 방법은 페이지를 가볍게 하는 것과 탭 전에 로딩을 시작하는 것이다.

## 1 · 웹 페이지

모든 WebView 페이지가 사이트 전체 레이아웃을 공유했다. 이 레이아웃은 렌더링 전에 제휴사 목록, 사용자 UID, 프로필, 푸시 내역, 환율을 await하고 데스크톱용 provider 트리로 감쌌다.

메인 탭을 `(optimize)` route group으로 옮겨 작은 provider를 쓰고 서버 쪽 대기를 없앴다. 각 페이지는 자기가 보여주는 데이터만 가져온다. 이것만으로 2.37s → 1.70s(그림 1의 B).

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

## 2 · 프리웜

`lazy: false`면 React Navigation이 탭 내비게이터를 처음 렌더링할 때 모든 탭 화면을 마운트하므로, 사용자가 홈에 있는 동안 각 WebView가 페이지를 로드한다.

- `detachInactiveScreens={false}`: 네이티브 뷰를 붙여둬 로드된 페이지가 해제되지 않는다.
- `freezeOnBlur`: 숨겨진 탭이 리렌더링되지 않는다.
- 테마를 기다렸다가 WebView를 렌더링하지 않는다. 토큰과 테마는 페이지 로드 전에 주입한다.

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

## 결과

탭 이후 초 단위, 3회 중앙값과 범위. C는 탭 시점에 페이지 로드가 끝나 있어 남은 시간은 탭 전환 시간이다.

| 탭 | _A_ 원본 | _B_ 웹 페이지 | _C_ + 프리웜 |
| --- | --- | --- | --- |
| 혜택, 중앙값 | 2.37 | 1.70 | **0.27** |
| 혜택, 범위 | 2.33 – 2.47 | 1.67 – 2.00 | **0.17 – 0.30** |

같은 기간에 혜택 외 탭 페이지와 공용 chunk는 커졌다. 그 탭들이 빨라진 건 프리웜 덕분이다.

| First Load JS | _A_ 이전 | _C_ 이후 |
| --- | --- | --- |
| 혜택 | 583KB | **412KB** |
| 이벤트 | 630KB | 708KB |
| 포인트 | 588KB | 709KB |
| 포인트 소개 | 583KB | 696KB |
| 모든 페이지 공용 | 195KB | 317KB |

## 남은 것들

- 500ms 스켈레톤 유지와 User-Agent가 늦게 설정돼 생기는 두 번째 페이지 로드는 남아 있다. C에서는 탭이 숨겨진 동안 일어날 뿐, 프리로드 완료 전에 탭하면 그대로 보인다.
- 모든 웹 탭이 실행 시점에 로드되어 세션 초반 네트워크·메모리 사용이 늘었다. 측정하지 않았다.
- `lazy: true`는 회원가입 중 포인트 소개 페이지가 딥링크를 발생시키지 않도록 추가된 것이었다. 끄면 그 페이지가 다시 앱 시작 시 마운트된다. 그 흐름은 재테스트하지 않았다.
- 시뮬레이터와 로컬 서버라 네트워크 지연이 빠져 있다. 실기기에서는 A와 B가 더 오래 걸릴 것이고, C는 프리로드가 탭 전에 끝나면 거의 0에 가깝게 유지될 것이다.
