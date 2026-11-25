---
title: "React Native 성능 개선: 리렌더, 화면 전환"
description: React Native 가계부 앱에서 리스트 행의 구독 범위를 좁혀 무관한 업데이트당 렌더 200번을 0번으로, native stack 전환으로 janky frame을 10.0%에서 6.5%로 줄이고, 오프라인 상태 처리와 알림 권한 사전 안내를 넣었다.
date: 2026-10-23
tags: [performance, react-native, react, case-study]
keywords: [리액트 네이티브 성능, React Native 성능 최적화, 리렌더링 줄이기, 화면 전환 애니메이션, 오프라인 처리, 콜드 스타트, React Native performance, TanStack Query select, react-native-screens, Fabric, NetInfo onlineManager, React Compiler, cold start, janky frames]
translatedFrom: en
---

| 지표 | 이전 | 이후 | 비고 |
| --- | --- | --- | --- |
| 리스트 행 렌더 | 200 | 0 | 무관한 프로필 업데이트 1회당, 행 100개 기준 |
| Janky frame, push/pop | 10.0% | 6.5% | Native stack, 아직 플래그 뒤에 있음 |
| 콜드 스타트 | 496ms | 461ms | 20회 중앙값, 에뮬레이터 오차 범위 안 |

## 배경

가계부 앱 TongTong(React Native, New Architecture)의 문제는 다음과 같았다.

- 모든 리스트 행이 프로필 응답 전체를 구독했다.
- 크래시 회피로 native screen을 꺼 둬서 스택 전환이 JS에서 돌았다.
- 오프라인을 감지하지 못하고 캐시된 금액을 최신처럼 보여줬다.
- OS 알림 권한 프롬프트가 설명 없이 로그인 직후에 떴다.
- React Compiler가 설치만 되고 켜져 있지 않았다.

## 측정

같은 네이티브 프로젝트에서 release APK 세 개를 빌드했다. A는 작업 전, B는 수정 반영, C는 B + native screen. 스크립트가 설치, 콜드 스타트, 거래 리스트 플링, 화면 push/pop 후 프레임 통계를 읽는다. 에뮬레이터가 배터리 구동 노트북에서 빠른 상태와 느린 상태를 오가서(B의 콜드 스타트가 3.1초로 A의 0.5초보다 여섯 배 느리게 나왔지만, A를 재설치하자 A도 3.3초) 빌드를 번갈아 돌리고 중앙값을 썼다.

- **기기**: Android 에뮬레이터, API 36, arm64, release 빌드, Hermes
- **콜드 스타트**: force stop 후 `am start -W`, 라운드당 4회
- **프레임**: `dumpsys gfxinfo`, 스크립트 제스처 실행 전마다 초기화
- **렌더/실행**: 실제 행 100개를 마운트해 hook 호출을 세는 Jest 테스트 / 빌드당 다섯 라운드, A·B·C 번갈아, 중앙값

## 1 · 구독 범위

거래 행은 결제자 표시를 위해 가구 구성원 두 명을 읽는데, 이 데이터가 오는 `/me` 응답에는 읽지 않은 알림 개수도 있다. 행의 hook이 응답 전체를 구독했고 행 안의 색깔 점도 같은 hook을 호출해서, 알림 개수가 바뀌면 마운트된 모든 행이 두 번씩 렌더됐다. 리스트·홈 탭은 마운트된 채로 남아 있어, 알림을 읽음 처리하면 보이지 않는 행까지 렌더됐다.

쿼리에 `select`를 넘겼다. TanStack Query는 선택된 값을 구조적으로 비교해 바뀔 때만 구독자에게 알린다. 테스트는 행 100개를 마운트한 뒤 알림 개수 변경 시 렌더 0회, 파트너 이름 변경 시 전체 행 렌더를 확인한다.

```ts title="Before · data/index.ts" {3}
export function usePeople(): People {
  // every row re-renders when anything in /me changes
  const { data: me } = useMeQuery();
  return useMemo(() => peopleOf(me), [me]);
}
```

```ts title="After · data/index.ts" {8}
// module constant: a new function each render would re-run it
const selectPeople = (me: V2Me) => ({
  me: { id: me.me.id },
  household: me.household ? { members: me.household.members } : null,
});

function usePeople(): People {
  const { data } = useMeQuery(selectPeople);
  return useMemo(() => peopleOf(data), [data]);
}
```

## 2 · 스택 전환

무거운 화면을 pop하면 Fabric에서 "child already has a parent" 크래시가 나서 `enableScreens(false)`로 우회했다. 스택 화면이 일반 view가 되어 push 전환은 Reanimated entering 애니메이션으로 그렸고, 아래 화면이 계속 그려지도록 모든 화면을 transparent modal로 띄웠다.

360ms짜리 슬라이드인데, 행 51개를 마운트하는 지출 화면에서 새 화면은 애니메이션 진행 28%~100% 시점에야 처음 나타났고 슬라이드가 보인 시간은 녹화 세 번에서 0~120ms였다. UI 스레드가 view를 붙이는 동안 애니메이션 시계가 이미 돌았기 때문이다. native screen을 켜면 native stack이 전환을 실행하고, push/pop janky frame이 10.0%에서 6.5%로 줄며 그린 프레임은 299에서 337이 된다.

기본값은 바꾸지 않았다. 에뮬레이터에서 push 도중 뒤로 가기를 포함해 약 150번 전환해도 크래시는 재현되지 않았지만, 라이브러리 버전은 크래시가 났던 그대로이고 에뮬레이터는 저사양 폰이 아니다. 빌드 타임 스위치로만 켠다.

```ts title="After · v3/nativeScreens.ts" {3}
// off by default: the Fabric pop crash was never explained
export const NATIVE_SCREENS =
  process.env.EXPO_PUBLIC_NATIVE_SCREENS === "1";
```

```tsx title="After · app/(app)/_layout.tsx · simplified" {6}
const OVER = { presentation: "transparentModal", animation: "none" };
const NATIVE_PUSH = { animation: "slide_from_right" };

// sheets keep drawing themselves; pushed screens go native
const optionsOf = (name: string) =>
  NATIVE_SCREENS && MOTION[name] ? NATIVE_PUSH : OVER;
```

## 3 · 오프라인

React Native에는 브라우저의 online/offline 이벤트가 없어 TanStack Query가 항상 온라인이라고 가정했다. 오프라인이면 쿼리마다 에러 카드가 떴고, 재연결돼도 다시 불러오지 않았다. 마지막 성공 응답을 저장하므로 오프라인 콜드 스타트에서는 어제 잔액을 오래됐다는 표시 없이 보여줬다.

NetInfo가 `onlineManager`에 상태를 넘겨, 쿼리는 오프라인에서 멈췄다가 재연결 시 재개한다. 홈 화면이 금액을 새로 고치지 못했으면 금액 아래에 그 사실과 응답 시각을 표시한다. 쓰기 요청은 이전처럼 오프라인에서 즉시 실패해 저장이 걸려 있지 않는다.

```ts title="After · lib/network.ts · simplified" {3}
onlineManager.setEventListener((setOnline) =>
  // null means "not known yet": treat it as online
  NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)),
);
```

```ts title="After · data/index.ts · simplified" {5}
function useStaleSince() {
  const q = useMonthQuery(monthKeyOf());
  const online = useSyncExternalStore(subscribeOnline, isOnline);
  // cached data on screen, and no way to refresh it right now
  const stale = q.data !== undefined && (!online || q.isError);
  return stale ? { at: q.dataUpdatedAt, offline: !online } : null;
}
```

## 4 · 권한 프롬프트

OS 알림 프롬프트는 한 번만 뜨고, 거절하면 설정 앱으로만 되돌릴 수 있다. 이제 푸시 등록 단계에서 권한을 요청하지 않는다. 사용자가 첫 내역을 입력했거나 파트너가 생긴 뒤 홈 화면 시트가 한 번 떠서 보낼 알림(파트너 입력 내역, 당일 고정비, 예산 경고)을 나열하고, 사용자가 켜기를 선택할 때만 OS 프롬프트가 뜬다.

## 5 · 손대지 않은 것

- **폰트 내장:** 런타임 폰트 로드는 218ms 시작 시간 중 약 50ms였다. 내장하면 Android의 폰트 패밀리 해석 방식이 바뀌어 하지 않았다.
- **카운팅 애니메이션을 UI 스레드로:** 금액은 크기가 섞인 중첩 텍스트이고 공간에 맞게 줄어들어 UI 스레드 텍스트 값으로 그릴 수 없다. 텍스트 노드 하나를 0.5초 다시 렌더할 뿐이라 두었다.
- **React Compiler:** 켰고, 컴포넌트·hook 약 190개를 컴파일한다. 다른 hook 호출 전에 return하는 hook은 컴파일에서 빠지므로 데이터 hook 15개의 개발 전용 early return을 밖으로 옮겼다. 행 컴포넌트가 이미 수동 memoize돼 있어 스크롤·시작 수치는 변화가 없었다.

## 결과

바뀐 건 두 행이고 나머지는 에뮬레이터 라운드 간 편차 안이다(B의 push/pop만 9.0%~14.7%). 번들은 컴파일러 memoization 코드와 새 화면들로 3% 늘었다.

| 지표 | A · 이전 | B · 이후 | C · + Native screen |
| --- | --- | --- | --- |
| 무관한 /me 업데이트 후 행 렌더 | 200 | **0** | 0 |
| 스택 push/pop, janky frame | 10.0% | 9.7% | **6.5%** |
| 스택 push/pop, 그린 프레임 수 | 299 | 299 | **337** |
| 리스트 스크롤, janky frame | 2.6% | 2.2% | 2.0% |
| 콜드 스타트, 실행부터 첫 프레임까지 | 496ms | 461ms | 466ms |
| 콜드 스타트, JS 시작부터 인터랙티브까지 | 218ms | 209ms | 208ms |
| APK 안의 JS 번들 | 3.47MB | 3.58MB | 3.58MB |

## 남은 과제

- native screen은 빌드 타임 플래그 뒤에 있고 기본값은 꺼져 있다. 실기기 프리뷰 빌드 전까지 유지한다.
- Fabric pop 크래시는 에뮬레이터에서 재현되지 않았고 원인은 모른다.
