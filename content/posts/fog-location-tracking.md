---
title: "Expo 백그라운드 위치 추적"
description: GPS 튐을 H3 셀 체류 판정으로 거르고, 백그라운드 OS task 와 포그라운드 watcher 를 하나의 직렬화된 ingest 파이프라인으로 묶은 Expo 위치 추적 설계.
date: 2026-07-09
tags: [react-native, expo, location, h3, case-study]
keywords: [Expo background location, expo-task-manager, expo-location, H3, h3-js, GPS jitter, dwell detection, fog of war, MapLibre, 위치 추적, 백그라운드 위치]
---

Fog 는 싱가포르에서 실제로 걸은 곳의 안개가 걷히는 앱이다(Expo SDK 56, MapLibre, h3-js, 위치 데이터는 기기 밖으로 나가지 않음).

문제는 "여기를 걸었다"를 믿을 만하게 기록하는 것이다. GPS 는 정지 상태에서도 옆 블록으로 튀고, 백그라운드에서는 OS 가 위치를 몰아서 주거나 한참 안 주며, 앱이 headless 로 다시 깨어나기도 한다.

## 무엇을 "방문"으로 볼 것인가

색칠 단위는 H3 헥사곤 셀(`H3_RESOLUTION = 10`, 한 변 약 125m)이고, 같은 셀에 누적 20초(`DWELL_THRESHOLD_MS`)를 머물러야 방문으로 인정한다. 20초는 jitter 를 거르기 위한 최소값으로, 한 번 튄 좌표로 셀이 칠해지지 않게 한다.

진행률 분모는 `scripts/buildLandCells.ts` 가 싱가포르 육지 폴리곤을 res 10 셀로 채워 미리 계산한 `TOTAL_LAND_CELLS = 42530` 상수다. 바다를 뺀 값이라 "싱가포르의 몇 %"가 의미 있고, 런타임 비용이 없다. 좌표→셀 변환은 `latLngToCell(lat, lng, H3_RESOLUTION)` 한 줄이다.

## 첫 번째 필터: 정확도 50m

`coords.accuracy` 가 50m 보다 나쁜 fix 는 버린다. 셀 한 변이 125m 정도라 반경 50m 를 넘는 오차는 셀 경계를 쉽게 넘는다.

버리기 전에 raw fix 이벤트를 먼저 내보낸다. 그냥 `continue` 하면 UI 가 "GPS 는 살아 있지만 부정확"과 "GPS 없음"을 구분할 수 없다. 지도 위 신호 표시(`LiveSignal`)가 이 이벤트를 구독한다.

```ts title="src/background/ingest.ts"
const acc = loc.coords.accuracy ?? 9999;
// Surface the raw fix to any live HUD *before* filtering, so "GPS alive but
// too noisy" is visibly distinct from "no GPS at all".
const accepted = acc <= MAX_ACCURACY_M;
locationEvents.emitRawFix({
  accuracy: acc,
  accepted,
  timestamp: loc.timestamp,
});
if (!accepted) continue; // drop noisy fixes
```

## 두 번째 필터: 시간을 "있던 셀"에 귀속시키기

50m 안쪽 fix 도 셀 경계 근처에서는 옆 셀로 왔다 갔다 한다. 그래서 직전 fix 이후 흐른 시간(`dt`)을 방금 도착한 셀이 아니라 그 구간 동안 있던 셀(`prevCell`)에 더한다. 옆 셀로 한 번 튄 fix 는 그 셀에 다음 fix 까지의 짧은 시간만 적립하므로 20초에 닿지 못한다.

```ts title="src/core/exploration/dwellReducer.test.ts"
it(
  'defends against jitter: a brief hop to a neighbor never marks it visited',
  () => {
    const { fired, visited } = run([
      ['A', 0],
      ['A', 5_000], //  A += 5000
      ['B', 5_500], //  A += 500  (interval was spent in A)
      ['A', 6_000], //  B += 500  (the only time ever credited to B)
      ['A', 26_000], // A += 20000 -> crosses threshold
    ]);
    expect(fired).toEqual(['A']);
    expect(visited.has('B')).toBe(false); // B only ever got 500ms
  },
);
```

전제는 정지 중에도 fix 가 계속 들어오는 것이다. 그래서 포그라운드 watcher 는 `distanceInterval: 0`, `timeInterval` 3초로 받는다(설정 주석에 "MUST be 0"). 0 이 아니면 Android 는 그 거리를 움직이기 전까지 위치를 주지 않아 정지 체류가 쌓이지 않는다.

## 백그라운드가 들어오면서 생긴 문제

앱을 켜 놓고 걸어야만 기록되는 건 불편해서 `expo-task-manager` 기반 백그라운드 추적을 붙였다. 이때 문제가 세 가지 생겼다.

### 1. 상태를 메모리에 둘 수 없다

앱이 종료된 상태면 OS 가 위치 배치를 전달하려고 앱을 headless 로 띄우고, task 가 끝나면 JS 컨텍스트가 사라진다. 그래서 인메모리 `Map`/`Set` 을 들던 `DwellTracker` 클래스를 버리고, 체류 상태를 JSON 직렬화 가능한 값으로 만들어 호출마다 load → fold → save 하는 순수 리듀서로 바꿨다.

```ts title="src/core/exploration/dwellReducer.ts" {18,23}
export interface DwellState {
  accumByCell: Record<string, number>; // 아직 방문 확정 전인 셀만
  prevCell: string | null;
  lastTime: number | null;
}

export function applyFix(
  state: DwellState,
  cellId: string,
  timestamp: number,
  visited: Set<string>,
): { state: DwellState; newlyVisited: string | null } {
  let newlyVisited: string | null = null;
  const next: DwellState = { ...state, accumByCell: { ...state.accumByCell } };

  if (state.lastTime != null && state.prevCell != null) {
    const dt = timestamp - state.lastTime;
    if (dt > 0 && dt <= MAX_DWELL_GAP_MS) {
      const accum = (state.accumByCell[state.prevCell] ?? 0) + dt;
      next.accumByCell[state.prevCell] = accum;
      if (accum >= DWELL_THRESHOLD_MS && !visited.has(state.prevCell)) {
        newlyVisited = state.prevCell;
        delete next.accumByCell[state.prevCell]; // 확정된 셀은 누적기에서 뺀다
      }
    }
  }

  next.lastTime = timestamp;
  next.prevCell = cellId;
  return { state: next, newlyVisited };
}
```

- 방문 셀 집합은 저장소에서 읽어 인자로 받아, 재시작 후 이미 칠한 셀이 다시 "새 방문"으로 뜨지 않는다. 확정된 셀은 `accumByCell` 에서 지워 직렬화 상태를 작게 유지한다.
- 저장은 AsyncStorage 키 하나(`fog.dwellState.v1`). 읽을 때 필드가 깨져 있으면 빈 상태로 되돌리고, 쓰기 실패는 체류 진행분 일부만 잃는 best-effort 다.

### 2. 긴 공백을 체류로 착각한다

OS 가 몇 분 잠들었다가 위치를 몰아서 주면, 그 몇 분이 마지막 셀에 통째로 쌓인다. 그래서 `dt` 가 5분(`MAX_DWELL_GAP_MS`)을 넘으면 공백으로 보고 버리고, `dt <= 0`(순서 뒤집힘)도 버린다. 거리 통계도 직전 fix 와 100m(`MAX_STEP_M`) 이상 떨어지면 튐이나 순간이동으로 보고 더하지 않는다.

### 3. 같은 걸음이 두 번 집계될 수 있다

위치 경로가 백그라운드 OS task(`startLocationUpdatesAsync`, "항상 허용" 필요, 앱 종료 상태에서도 동작)와 포그라운드 watcher(`watchPositionAsync`, 앱이 열려 있는 동안만) 둘이 됐다. 각자 계산하면 같은 걸음이 두 번 세어지고 로직도 어긋날 수 있다.

## 하나의 ingest 파이프라인

두 경로는 fix 를 `ingestLocations()` 에 넘기기만 한다. 정확도 필터, 셀 변환, 체류 누적, 방문 셀 저장, 거리 합산, streak 갱신은 전부 여기서 한다.

```ts title="src/background/locationTask.ts"
// 컴포넌트 안이 아니라 모듈 최상단에서 정의해야 한다.
// headless 재실행 시 OS 가 새 JS 컨텍스트에서 이름으로 task 를 찾기 때문이다.
TaskManager.defineTask(BG_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (AppState.currentState === 'active' && isForegroundDriverActive()) return;
  const locations = (data as LocationTaskData | undefined)?.locations ?? [];
  if (!locations.length) return;
  await ingestLocations(locations);
});
```

ingest 는 배치마다 상태를 한 번 읽고, fix 를 접고, 저장한다. 앱이 살아 있으면 `locationEvents` 로 지도에 바로 알리고, headless 면 저장만 하고 지도는 다음 활성화 때 저장소에서 다시 그린다.

### 직렬화 큐

포그라운드 watcher 는 fix 마다 `ingestLocations([loc])` 를 부른다. 이전 호출이 저장을 끝내기 전에 다음 호출이 시작되면 둘 다 갱신 전 상태를 읽고 나중 저장이 앞선 저장을 덮어써 체류 시간과 거리가 사라진다. 그래서 모든 호출을 promise 체인 하나에 잇는다.

```ts title="src/background/ingest.ts" {6}
let queue: Promise<void> = Promise.resolve();

export function ingestLocations(locations: IngestFix[]): Promise<void> {
  // .catch 가 저장되는 체인 안에 있어야 한다. queue 가 reject 상태로 남으면
  // 이후의 .then(onFulfilled) 가 전부 건너뛰어져 모든 배치가 버려진다.
  queue = queue.then(() => ingestLocationsSerial(locations)).catch((e) => {
    console.warn('ingest failed', e);
  });
  return queue;
}
```

회귀 테스트는 AsyncStorage mock 의 `getItem`/`setItem` 을 `setTimeout(0)` 으로 한 틱씩 미뤄 두 호출(`fix(0)`, `fix(25_000)`)을 엇갈리게 만들고, 방문 셀 1개와 `lastTime === 25_000` 을 확인한다. 직렬화가 깨지면 두 번째 호출이 `lastTime = null` 을 읽어 아무것도 적립하지 못한다.

### 누가 지금 드라이버인가

파이프라인이 하나여도 두 경로가 동시에 넣으면 두 번 세어진다. 권한에 따라 둘 중 하나만 돌리면 "항상 허용"일 때 OS task 만 남는데, OS task 는 앱이 열려 있는 동안 배치를 미뤄서 앱을 켜고 걸어도 안개가 실시간으로 움직이지 않는다. 그래서 역할로 나눴다.

- OS task 는 탐험 세션 내내 켜 둔다(백그라운드 담당).
- 앱이 foreground 면 watcher 가 라이브 드라이버이고 `foregroundDriverActive` 플래그를 켠다.
- OS task 는 앱이 `active` 이고 플래그가 켜져 있을 때만 배치를 무시한다. `AppState.currentState` 조건은 안전장치다. 백그라운드·headless 에서는 `active` 일 수 없으니 플래그가 남아도 백그라운드 산책이 버려지지 않는다(headless 컨텍스트에서는 플래그도 `false` 로 시작).
- `AppState` 리스너가 비활성 전환 시 watcher 를 끄고(플래그도 꺼짐), 재활성 시 저장소에서 안개를 다시 그리고 watcher 를 붙인다.

```ts title="src/adapters/location/backgroundTracking.ts"
await Location.startLocationUpdatesAsync(BG_LOCATION_TASK, {
  accuracy: Location.Accuracy.High,
  // 백그라운드는 배터리 때문에 거리 기반. 정지 중 체류는
  // 다음 이동 fix 까지의 간격이 prevCell 에 귀속되므로 여전히 쌓인다.
  distanceInterval: BG_DISTANCE_M, // 10m
  // deferredUpdatesInterval 없음 (아래 설명)
  pausesUpdatesAutomatically: false,
  // ...
  foregroundService: {
    // ...
    killServiceOnDestroy: true,
  },
});
```

- 백그라운드는 10m 를 움직여야 fix 가 오지만, 다시 걷기 시작한 첫 fix 에서 서 있던 시간 전체가 `prevCell` 에 적립된다(5분 상한 안에서). 그래서 fix 를 자주 받을 필요가 없다.
- deferred 배치는 뺐다. Android 는 미뤄 둔 배치를 앱이 다음에 보일 때 한꺼번에 내보내는데, 그 순간 foreground 게이트가 켜져서 백그라운드 기록 전체가 무시됐다. fix 마다 바로 전달받으니 걷는 동안 셀이 칠해진다.

### 세션 경계

- 거리용 직전 좌표(`lastCoord`)는 모듈 메모리에 둔다. headless 재실행이면 `null` 이 되어 경계의 한 걸음만 빠진다. 드라이버 전환 때도 초기화해 두 경로의 좌표를 잇지 않는다.
- `startLocationUpdatesAsync` 는 OS 수준에서 유지돼 앱 종료 후에도 이전 세션 task 가 남을 수 있다. 콜드 스타트 때 정리하고, 이번 세션에서 Start 를 눌렀을 때만 기록한다.
- foreground service 는 백그라운드에서 시작할 수 없어 OS task 는 Start 시점(foreground)에 시작하고 세션 내내 유지한다. 전환 때는 watcher 만 바뀐다. 앱을 밀어 종료하면 `killServiceOnDestroy` 로 서비스와 알림을 내린다.
- Android 13+ 는 `POST_NOTIFICATIONS` 없이는 서비스 알림이 안 보여 시작 전에 요청하되, 거부해도 추적은 막지 않는다.

## 기록과 별개인 것: 지도 첫 화면

카메라 위치는 틀려도 곧 고쳐지면 되므로 기록 규칙을 적용하지 않는다. 고정밀 fix 를 기다리면 첫 GPS lock 까지 지도가 기본 위치에 멈춰 있어서 두 단계로 나눴다.

```ts title="app/map.tsx" {5,10}
useEffect(() => {
  if (dl.status !== "done" || !mapReady) return;
  let cancelled = false;
  (async () => {
    const last = await getLastKnownPosition(); // OS 캐시, 바로 반환
    if (!cancelled && last) {
      cameraRef.current?.jumpTo({ center: [last.lng, last.lat], zoom: 15 });
    }
    try {
      const pos = await getCurrentPosition(); // 새 fix 로 보정
      if (!cancelled) {
        cameraRef.current?.flyTo({
          center: [pos.lng, pos.lat],
          zoom: 16,
          duration: 500,
        });
      }
    } catch (e) {
      // ...
    }
  })();
  return () => { cancelled = true; };
}, [dl.status, mapReady]);
```

- `getLastKnownPositionAsync` 는 새 lock 을 기다리지 않고 OS 캐시 위치(없으면 `null`)를 돌려준다. 그 위치로 `jumpTo` 하고, `getCurrentPosition` 이 오면 `flyTo` 한다.
- MapLibre 는 스타일 로딩 전의 카메라 명령을 조용히 무시한다. 오프라인 팩 다운로드(`dl.status === "done"`)만 기다리면 기본 위치에 남아서, `onDidFinishLoadingMap` 에서 켜는 `mapReady` 를 조건에 넣었다.
- "내 위치로" 버튼도 같은 패턴이다. 새 fix 가 캐시 위치에서 25m 안쪽이면 두 번째 `flyTo` 를 생략한다(같은 지점으로 애니메이션을 재시작하면 끊겨 보임). 연타 시 겹친 `getCurrentPosition` 이 늦게 도착해 애니메이션을 계속 재시작해서, 진행 중 탭을 무시하는 ref 를 두었다.
- 캐시 위치는 ingest 를 거치지 않으므로 안개를 걷지 않는다.

## 결과

| 단계 | 기준 | 목적 |
| --- | --- | --- |
| 드라이버 선택 | foreground 면 watcher, 아니면 OS task | 이중 집계 방지 |
| 직렬화 큐 | 호출 하나씩 load → fold → save | 동시 호출 경합 방지 |
| 정확도 컷 | 50m 초과 버림 (HUD 에는 알림) | 큰 오차 제거 |
| 셀 변환 | H3 res 10 | 셀 단위 판정 |
| 체류 적립 | `dt` 를 `prevCell` 에, 5분 초과 공백은 버림 | 튐과 슬립 방어 |
| 방문 확정 | 누적 20초 | 방문 기록 |
| 거리 | 한 걸음 100m 이상은 제외 | 순간이동 제거 |

핵심 로직은 RN 의존이 없는 순수 TypeScript 라 Vitest 로 검증한다(리듀서: 임계값, 이웃 셀 튐, 재발화 방지, 긴 공백과 상한 경계값, 확정 셀 정리, JSON 왕복 / ingest: 방문 저장, 정확도 컷, 동시 호출 경합, 거리 누적).

## 남은 과제

- 체류 상태, 방문 셀, 통계를 따로 저장해서 그 사이에 프로세스가 죽으면 셋이 어긋날 수 있다(현재 best-effort).
- `timeInterval` 은 Android 에서만 쓰이고 iOS 는 거리만 본다(코드 주석 기준). Android 의 deferred 배치 같은 함정이 iOS 에도 있는지 확인이 필요하다.
