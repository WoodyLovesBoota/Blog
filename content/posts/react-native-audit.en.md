---
title: "React Native performance: re-renders and screen transitions"
description: In a React Native budgeting app, narrowing what list rows subscribe to took renders per unrelated update from 200 to 0, native stack transitions cut janky frames from 10.0% to 6.5%, and the app gained offline handling and a pre-prompt for notification permission.
date: 2026-10-23
tags: [performance, react-native, react, case-study]
keywords: [React Native performance, TanStack Query select, react-native-screens, Fabric, NetInfo onlineManager, React Compiler, cold start, janky frames]
---

| Metric | Before | After | Note |
| --- | --- | --- | --- |
| List row renders | 200 | 0 | Per unrelated profile update, 100 rows |
| Janky frames, push/pop | 10.0% | 6.5% | Native stack, still behind a flag |
| Cold start | 496ms | 461ms | Median of 20, within emulator noise |

## Background

Problems in TongTong, a budgeting app (React Native, New Architecture):

- Every list row subscribed to the whole profile response.
- Native screens were off to avoid a crash, so stack transitions ran in JS.
- The app didn't detect offline and showed cached amounts as current.
- The OS notification prompt appeared right after login, with no explanation.
- React Compiler was installed but not enabled.

## Measurement

Three release APKs from the same native project: A before the work, B with the fixes, C is B with native screens on. A script installs a build, cold-starts it, flings the transaction list, pushes and pops a screen, then reads frame statistics. The emulator, on a laptop running on battery, switched between fast and slow states (B's cold start came out at 3.1s against A's 0.5s, but reinstalling A gave 3.3s as well), so builds ran in turns and medians are reported.

- **Device**: Android emulator, API 36, arm64, release build, Hermes
- **Cold start**: `am start -W` after a force stop, 4 per round
- **Frames**: `dumpsys gfxinfo`, reset before each scripted gesture run
- **Renders/runs**: A Jest test that mounts 100 real rows and counts hook calls / five rounds per build, A·B·C in turns, median

## 1 · Subscription scope

A transaction row reads the two household members to show who paid. That data comes from `/me`, which also carries the unread notification count. The row's hook subscribed to the whole response and the coloured dot in the row called the same hook, so a change in the unread count rendered every mounted row twice. The list and home tabs stay mounted, so marking notifications as read re-rendered rows the user couldn't see.

The fix passes `select` to the query. TanStack Query compares the selected value structurally and notifies subscribers only when it changes. A test mounts 100 rows and expects no render when the unread count changes and a render of every row when the partner is renamed.

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

## 2 · Stack transitions

Popping a heavy screen crashed on Fabric with "child already has a parent", and the workaround was `enableScreens(false)`. Stack screens became plain views, so the push transition was drawn with a Reanimated entering animation, and every screen was presented as a transparent modal to keep the screen below painted.

The slide is 360ms. On the expenses screen, which mounts 51 rows, the new screen first appeared between 28% and 100% of the way in, and the visible slide lasted 0 to 120ms across three recordings: the animation clock started while the UI thread was still attaching views. With native screens on, the native stack runs the transition, push/pop janky frames fall from 10.0% to 6.5%, and frames drawn rise from 299 to 337.

The default is unchanged. About 150 transitions on the emulator, including back presses mid-push, didn't reproduce the crash, but the library versions are the ones that crashed and an emulator is not a low-end phone. Native screens are enabled only by a build-time switch.

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

## 3 · Offline

React Native has no browser online/offline events, so TanStack Query assumed it was always online. Offline, each query showed an error card, and nothing refetched on reconnect. Since the last successful responses are persisted, an offline cold start showed yesterday's balance with no sign it was old.

NetInfo now feeds `onlineManager`, so queries pause offline and resume on reconnect. When the home screen couldn't refresh an amount, a line under it says so with the response time. Writes still fail immediately offline, so a save never hangs.

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

## 4 · Permission prompt

The OS shows its notification prompt once; after a refusal the only way back is the settings app. Push registration no longer requests permission. After the user's first entry or once they have a partner, a home-screen sheet appears once listing what the app sends (partner entries, fixed costs on the day, budget warnings), and the OS prompt follows only if they choose to turn notifications on.

## 5 · What I left alone

- **Embedding fonts:** runtime font loading took about 50ms of a 218ms start. Embedding would change how font families resolve on Android, so I didn't.
- **Moving the counting animation to the UI thread:** the amount is nested text with mixed sizes that shrinks to fit, which a UI-thread text value can't draw. It re-renders one text node for half a second, so I kept it.
- **React Compiler:** on, compiling about 190 components and hooks. A hook that returns before calling other hooks is skipped, so I moved a development-only early return out of fifteen data hooks. Row components were already memoized by hand, and scroll and start-up numbers didn't move.

## Results

Two rows changed; the rest are within round-to-round emulator variance (B's push/pop alone ranged from 9.0% to 14.7%). The bundle grew 3% from the compiler's memoization code and the new screens.

| Metric | A · Before | B · After | C · + Native screens |
| --- | --- | --- | --- |
| Row renders after an unrelated /me update | 200 | **0** | 0 |
| Stack push/pop, janky frames | 10.0% | 9.7% | **6.5%** |
| Stack push/pop, frames drawn | 299 | 299 | **337** |
| List scroll, janky frames | 2.6% | 2.2% | 2.0% |
| Cold start, launch to first frame | 496ms | 461ms | 466ms |
| Cold start, JS start to interactive | 218ms | 209ms | 208ms |
| JS bundle in the APK | 3.47MB | 3.58MB | 3.58MB |

## Open items

- Native screens sit behind a build-time flag, off by default, until a preview build has run on real devices.
- The Fabric pop crash didn't reproduce on the emulator, and its cause is unknown.
