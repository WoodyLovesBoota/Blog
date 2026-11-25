---
title: "Background location tracking in Expo"
description: An Expo location tracking design that filters GPS jitter with H3 cell dwell detection and joins a background OS task and a foreground watcher into one serialized ingest pipeline.
keywords: [Expo background location, expo-task-manager, expo-location, H3, h3-js, GPS jitter, dwell detection, fog of war, MapLibre, location tracking, background location]
translatedFrom: ko
---

Fog is an app that clears the fog over the places in Singapore you have actually walked (Expo SDK 56, MapLibre, h3-js; location data never leaves the device).

The problem is recording "I walked here" reliably. GPS jumps to the next block even when you are standing still, in the background the OS delivers locations in bursts or not at all for a long time, and the app can be woken up again headless.

## What counts as a "visit"

The unit of coloring is an H3 hexagon cell (`H3_RESOLUTION = 10`, about 125m per edge), and a cell counts as visited only after 20 seconds of accumulated time in it (`DWELL_THRESHOLD_MS`). 20 seconds is the minimum needed to filter jitter, so a single stray coordinate never colors a cell.

The progress denominator is the constant `TOTAL_LAND_CELLS = 42530`, precomputed by `scripts/buildLandCells.ts`, which fills Singapore's land polygon with res 10 cells. Because it excludes the sea, "X% of Singapore" is meaningful, and it costs nothing at runtime. Converting a coordinate to a cell is one line: `latLngToCell(lat, lng, H3_RESOLUTION)`.

## First filter: 50m accuracy

Fixes with `coords.accuracy` worse than 50m are dropped. With a cell edge of about 125m, an error radius above 50m easily crosses a cell boundary.

Before dropping, the raw fix event is emitted first. A plain `continue` would leave the UI unable to tell "GPS is alive but inaccurate" from "no GPS". The signal indicator on the map (`LiveSignal`) subscribes to this event.

```ts title="src/background/ingest.ts"
const acc = loc.coords.accuracy ?? 9999;
// Surface the raw fix to any live HUD *before* filtering, so "GPS alive but
// too noisy" is visibly distinct from "no GPS at all".
const accepted = acc <= MAX_ACCURACY_M;
locationEvents.emitRawFix({ accuracy: acc, accepted, timestamp: loc.timestamp });
if (!accepted) continue; // drop noisy fixes
```

## Second filter: credit time to the cell you were in

Even fixes within 50m bounce back and forth to a neighboring cell near a boundary. So the time elapsed since the previous fix (`dt`) is added not to the cell that just arrived but to the cell you were in during that interval (`prevCell`). A fix that hops to a neighbor once credits that cell only the short time until the next fix, so it never reaches 20 seconds.

```ts title="src/core/exploration/dwellReducer.test.ts"
it('defends against jitter: a brief hop to a neighbor never marks it visited', () => {
  const { fired, visited } = run([
    ['A', 0],
    ['A', 5_000], //  A += 5000
    ['B', 5_500], //  A += 500  (interval was spent in A)
    ['A', 6_000], //  B += 500  (the only time ever credited to B)
    ['A', 26_000], // A += 20000 -> crosses threshold
  ]);
  expect(fired).toEqual(['A']);
  expect(visited.has('B')).toBe(false); // B only ever got 500ms
});
```

This assumes fixes keep arriving while you stand still. So the foreground watcher uses `distanceInterval: 0` and a `timeInterval` of 3 seconds (the config comment says "MUST be 0"). With anything other than 0, Android withholds locations until you move that distance, and stationary dwell never accumulates.

## Problems that came with background tracking

Recording only while the app was open was inconvenient, so I added background tracking based on `expo-task-manager`. That raised three problems.

### 1. State cannot live in memory

If the app has been terminated, the OS launches it headless to deliver a location batch, and the JS context disappears when the task finishes. So I dropped the `DwellTracker` class that held an in-memory `Map`/`Set`, made the dwell state a JSON-serializable value, and turned the logic into a pure reducer that does load → fold → save on every call.

```ts title="src/core/exploration/dwellReducer.ts" {18,23}
export interface DwellState {
  accumByCell: Record<string, number>; // only cells not yet confirmed as visited
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
        delete next.accumByCell[state.prevCell]; // remove confirmed cells from the accumulator
      }
    }
  }

  next.lastTime = timestamp;
  next.prevCell = cellId;
  return { state: next, newlyVisited };
}
```

- The visited cell set is read from storage and passed in as an argument, so cells already colored do not show up as "new visits" again after a restart. Confirmed cells are removed from `accumByCell` to keep the serialized state small.
- Storage is a single AsyncStorage key (`fog.dwellState.v1`). If a field is corrupted on read, it falls back to an empty state; a failed write is best-effort and loses only part of the dwell progress.

### 2. Long gaps are mistaken for dwell

When the OS sleeps for a few minutes and then delivers locations in a burst, those minutes all pile onto the last cell. So a `dt` over 5 minutes (`MAX_DWELL_GAP_MS`) is treated as a gap and discarded, and `dt <= 0` (out-of-order) is discarded too. Distance stats also skip a step 100m (`MAX_STEP_M`) or more from the previous fix, treating it as a jump or teleport.

### 3. The same steps can be counted twice

There were now two location paths: the background OS task (`startLocationUpdatesAsync`, requires "Always allow", runs even when the app is terminated) and the foreground watcher (`watchPositionAsync`, only while the app is open). If each computed on its own, the same steps would be counted twice and the logic could drift apart.

## One ingest pipeline

Both paths only hand fixes to `ingestLocations()`. Accuracy filtering, cell conversion, dwell accumulation, saving visited cells, summing distance and updating the streak all happen there.

```ts title="src/background/locationTask.ts"
// Must be defined at module top level, not inside a component,
// because on a headless relaunch the OS looks up the task by name in a fresh JS context.
TaskManager.defineTask(BG_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (AppState.currentState === 'active' && isForegroundDriverActive()) return;
  const locations = (data as LocationTaskData | undefined)?.locations ?? [];
  if (!locations.length) return;
  await ingestLocations(locations);
});
```

Ingest reads the state once per batch, folds the fixes, and saves. If the app is alive, it notifies the map immediately via `locationEvents`; if headless, it only saves, and the map redraws from storage on the next activation.

### Serialization queue

The foreground watcher calls `ingestLocations([loc])` for every fix. If the next call starts before the previous one finishes saving, both read the pre-update state and the later save overwrites the earlier one, losing dwell time and distance. So every call is chained onto a single promise chain.

```ts title="src/background/ingest.ts" {6}
let queue: Promise<void> = Promise.resolve();

export function ingestLocations(locations: IngestFix[]): Promise<void> {
  // The .catch must be inside the stored chain. If queue stays rejected,
  // every later .then(onFulfilled) is skipped and all batches are dropped.
  queue = queue.then(() => ingestLocationsSerial(locations)).catch((e) => {
    console.warn('ingest failed', e);
  });
  return queue;
}
```

The regression test delays the AsyncStorage mock's `getItem`/`setItem` by one tick each with `setTimeout(0)` to interleave two calls (`fix(0)`, `fix(25_000)`), then checks for one visited cell and `lastTime === 25_000`. If serialization breaks, the second call reads `lastTime = null` and credits nothing.

### Who is the driver right now

Even with one pipeline, two paths feeding it at the same time would double count. Running only one of them based on permission leaves only the OS task under "Always allow", but the OS task defers batches while the app is open, so the fog does not move in real time when you walk with the app open. So the paths are split by role.

- The OS task stays on for the whole exploration session (handles the background).
- When the app is in the foreground, the watcher is the live driver and sets the `foregroundDriverActive` flag.
- The OS task ignores batches only when the app is `active` and the flag is set. The `AppState.currentState` condition is a safeguard: in the background or headless the state cannot be `active`, so a background walk is not discarded even if the flag is left on (in a headless context the flag also starts as `false`).
- An `AppState` listener turns off the watcher (and the flag) on transition to inactive, and on reactivation redraws the fog from storage and attaches the watcher.

```ts title="src/adapters/location/backgroundTracking.ts"
await Location.startLocationUpdatesAsync(BG_LOCATION_TASK, {
  accuracy: Location.Accuracy.High,
  // Background is distance-based for battery. Stationary dwell still accumulates,
  // because the interval until the next movement fix is credited to prevCell.
  distanceInterval: BG_DISTANCE_M, // 10m
  // no deferredUpdatesInterval (see below)
  pausesUpdatesAutomatically: false,
  // ...
  foregroundService: {
    // ...
    killServiceOnDestroy: true,
  },
});
```

- In the background a fix arrives only after moving 10m, but the first fix after you start walking again credits the entire time you stood still to `prevCell` (within the 5-minute cap). So frequent fixes are not needed.
- Deferred batching was removed. Android flushes deferred batches all at once the next time the app becomes visible, and at that moment the foreground gate was on, so the entire background record was ignored. With each fix delivered immediately, cells get colored while you walk.

### Session boundaries

- The previous coordinate for distance (`lastCoord`) lives in module memory. On a headless relaunch it becomes `null`, so only the one step at the boundary is lost. It is also reset on driver switches so coordinates from the two paths are not joined.
- `startLocationUpdatesAsync` persists at the OS level, so a task from a previous session can survive app termination. It is cleaned up on cold start, and recording happens only when Start was pressed in the current session.
- A foreground service cannot be started from the background, so the OS task starts at Start time (in the foreground) and stays for the whole session. Only the watcher changes on transitions. When the app is swiped away, `killServiceOnDestroy` takes down the service and its notification.
- On Android 13+ the service notification is not shown without `POST_NOTIFICATIONS`, so it is requested before starting, but denial does not block tracking.

## Separate from recording: the map's first screen

The camera position can be wrong as long as it is corrected soon, so the recording rules do not apply. Waiting for a high-accuracy fix leaves the map stuck at the default location until the first GPS lock, so it is split into two steps.

```ts title="app/map.tsx" {5,10}
useEffect(() => {
  if (dl.status !== "done" || !mapReady) return;
  let cancelled = false;
  (async () => {
    const last = await getLastKnownPosition(); // OS cache, returns immediately
    if (!cancelled && last) {
      cameraRef.current?.jumpTo({ center: [last.lng, last.lat], zoom: 15 });
    }
    try {
      const pos = await getCurrentPosition(); // correct with a fresh fix
      if (!cancelled) {
        cameraRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 16, duration: 500 });
      }
    } catch (e) {
      // ...
    }
  })();
  return () => { cancelled = true; };
}, [dl.status, mapReady]);
```

- `getLastKnownPositionAsync` returns the OS cached location (or `null`) without waiting for a new lock. The camera does `jumpTo` to that location, then `flyTo` when `getCurrentPosition` arrives.
- MapLibre silently ignores camera commands issued before the style has loaded. Waiting only for the offline pack download (`dl.status === "done"`) left the camera at the default location, so `mapReady`, set in `onDidFinishLoadingMap`, was added to the condition.
- The "My location" button follows the same pattern. If the fresh fix is within 25m of the cached location, the second `flyTo` is skipped (restarting the animation to the same point looks like a stutter). With repeated taps, overlapping `getCurrentPosition` calls arrived late and kept restarting the animation, so a ref ignores taps while one is in progress.
- The cached location does not go through ingest, so it does not clear fog.

## Results

| Stage | Rule | Purpose |
| --- | --- | --- |
| Driver selection | Watcher in foreground, otherwise OS task | Prevent double counting |
| Serialization queue | One call at a time: load → fold → save | Prevent races between concurrent calls |
| Accuracy cut | Drop above 50m (still reported to HUD) | Remove large errors |
| Cell conversion | H3 res 10 | Per-cell decisions |
| Dwell credit | `dt` to `prevCell`, drop gaps over 5 min | Defend against jitter and sleep |
| Visit confirmation | 20 s accumulated | Record the visit |
| Distance | Exclude steps of 100m or more | Remove teleports |

The core logic is pure TypeScript with no RN dependency, so it is tested with Vitest (reducer: threshold, neighbor-cell hops, no re-firing, long gaps and cap boundary values, cleanup of confirmed cells, JSON round trip / ingest: saving visits, accuracy cut, concurrent call races, distance accumulation).

## Open issues

- Dwell state, visited cells and stats are saved separately, so if the process dies in between, the three can get out of sync (currently best-effort).
- `timeInterval` is used only on Android; iOS looks only at distance (per the code comments). It still needs checking whether iOS has a trap like Android's deferred batching.
