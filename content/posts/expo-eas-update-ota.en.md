---
title: "Adopting EAS Update for OTA updates in React Native"
description: Notes on wiring expo-updates into a bare React Native app for OTA updates. Matching native config by hand, managing runtimeVersion and channels, choosing when updates apply, an iOS cold-start bug, and a hotfix reload crash.
keywords: [EAS Update, expo-updates, OTA update, CodePush, CodePush alternative, bare React Native, runtimeVersion, expo-channel-name, reloadAsync]
translatedFrom: ko
---

I added OTA updates through EAS Update to a bare React Native app that manages `ios/` and `android/` directly. Most of the "just add one line of config" instructions in the Expo docs don't apply as written.

## Background

The app was on RN 0.79 and already had Firebase Messaging, the Facebook SDK, AppsFlyer, and a Notification Service Extension for image notifications. On top of that I added `expo` (53) and `expo-updates` (0.28).

In an Expo managed (CNG) project, `expo prebuild` copies the `updates` config from `app.json` into the native files. In a bare project you write the same settings into the native files yourself.

| Setting | Expo config (`app.config.js`) | iOS | Android |
| --- | --- | --- | --- |
| Update server URL | `updates.url` | `Expo.plist` `EXUpdatesURL` | `AndroidManifest.xml` meta-data |
| Runtime version | `runtimeVersion` | `EXUpdatesRuntimeVersion` | `strings.xml` → meta-data |
| Check on launch | `updates.checkAutomatically` | `EXUpdatesCheckOnLaunch` | `EXPO_UPDATES_CHECK_ON_LAUNCH` |
| Channel | (EAS Build profile) | `EXUpdatesRequestHeaders` | `UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY` |

The app reads the two right-hand columns. `app.config.js` is what the `eas update` CLI uses to read project info and the runtime version. If the three disagree, you can publish an update and the app will never receive it.

## Setup

### JS build chain

`eas update` builds the bundle with Metro and needs the Expo serializer. `metro.config.js` takes `getDefaultConfig` from `expo/metro-config` and merges the existing config in with `mergeConfig`. The Babel preset changed from `module:@react-native/babel-preset` to `babel-preset-expo` (`module-resolver` stays).

The config lives in `app.config.js` so it can read environment variables. `index.js` used to import the app name from `app.json`; that became a string, as in `AppRegistry.registerComponent('MyApp', ...)`.

### iOS: Podfile and AppDelegate

I added `use_expo_modules!` to the Podfile so that `use_native_modules!` reads RN module config through Expo autolinking. The Notification Service Extension had been nested inside the main target with `inherit! :search_paths`; I moved it out, separated it from the Expo/RN pods, and left it with only Firebase Messaging.

```ruby title="ios/Podfile"
target 'MyApp' do
  use_expo_modules!
  # ...
end

target 'ImageNotification' do
  # Keep the notification service extension isolated from Expo/React Native pods.
  pod 'Firebase/Messaging'
end
```

In AppDelegate I initialize `AppController`, and in release builds the bundle URL prefers the OTA bundle, falling back to the embedded `main.jsbundle`.

```swift title="ios/MyApp/AppDelegate.swift" {2,10-13}
// application(_:didFinishLaunchingWithOptions:)
AppController.initializeWithoutStarting()
if AppController.sharedInstance.isActiveController {
  AppController.sharedInstance.start()
}

// ReactNativeDelegate
override func bundleURL() -> URL? {
#if DEBUG
  // ...
#else
  // EAS Updates: prefer the OTA bundle URL, fall back to the embedded bundle
  if AppController.isInitialized(),
     let otaURL = AppController.sharedInstance.launchAssetUrl() {
    return otaURL
  }
  return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
}
```

This code has an ordering problem, covered below under "Later fixes".

### Android: Gradle and MainApplication

`settings.gradle` calls `useExpoModules()` and `app/build.gradle` calls `addExpoModulesDependencies`. In `MainApplication.kt`, `DefaultReactNativeHost` has to be wrapped in `ReactNativeHostWrapper` so expo-updates can swap the bundle path, and lifecycle events have to be forwarded to Expo.

```kotlin title="android/app/src/main/java/.../MainApplication.kt" {2,9,15-16}
override val reactNativeHost: ReactNativeHost =
    ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> =
              PackageList(this).packages.apply {
                // ...
                add(ExpoModulesPackage())
              }
          // ...
        })

override val reactHost: ReactHost
  get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

override fun onCreate() {
  // ...
  ApplicationLifecycleDispatcher.onApplicationCreate(this)
  UpdatesController.initialize(this)
  logOtaState("application_on_create")
}
```

`logOtaState` logs the channel, runtime version, running update ID, embedded update ID, and `isEmbeddedLaunch` from `UpdatesController` to logcat on a background thread. When an update doesn't show up, it tells you whether the problem is the channel, the runtime version, or an update that was downloaded but not yet applied.

## runtimeVersion

The app only accepts updates whose runtime version exactly matches its own. If you change native modules and ship only JS under the same runtime version, the new JS can call a native function that doesn't exist and crash.

In a bare project the app doesn't evaluate policies like `{ "policy": "appVersion" }`; it uses the literal string baked into `Expo.plist` and `strings.xml`. So I manage the string by hand.

```js title="app.config.js"
module.exports = {
  expo: {
    updates: {
      checkAutomatically: 'NEVER',
      url: 'https://u.expo.dev/<project-id>',
      // ...
    },
    runtimeVersion: '1.0.0',
    extra: {
      // ...
      isHotfix: process.env.IS_HOTFIX === 'true',
    },
  },
};
```

From the first store release on, the runtime version equals `versionName`, and all three files are bumped together on every native build.

```text
app.config.js                          runtimeVersion: '1.019.020'
ios/Expo.plist                         EXUpdatesRuntimeVersion = 1.019.020
android/app/src/main/res/values/strings.xml   expo_runtime_version = 1.019.020
```

- Each store version maps to one OTA line.
- The runtime version changes even on releases with no native changes, so users on the previous store version don't receive new OTA updates.
- I didn't go with bumping only on native changes, because it requires someone to judge on every release whether native code changed.

## Channels: separating STG and PROD

The app sends an `expo-channel-name` header with each update request, and the server returns the latest update on the branch linked to that channel. The channel in an `eas.json` build profile is only injected into the native config when building with EAS Build, so this app, built directly with Xcode/Gradle, has to set it itself.

I added `OTA_CHANNEL` to the `react-native-config` env files. PROD is `production`; STG has no value and falls back to `development`. On iOS, a Build Phase after `[Expo] Configure project` and before source compilation edits `Expo.plist`.

```bash title="ios/scripts/sync-expo-channel.sh"
#!/bin/bash
# Update expo-channel-name in Expo.plist from the OTA_CHANNEL env var
EXPO_PLIST="${SRCROOT}/Expo.plist"
CHANNEL="${OTA_CHANNEL:-development}"

if [ -f "$EXPO_PLIST" ]; then
  /usr/libexec/PlistBuddy -c "Set :EXUpdatesRequestHeaders:expo-channel-name $CHANNEL" "$EXPO_PLIST"
fi
```

There were two copies, `ios/Expo.plist` and `ios/MyApp/Supporting/Expo.plist`. I kept only `ios/Expo.plist` so the values can't drift apart.

On Android, `build.gradle` uses the same variable to build a `{"expo-channel-name":"..."}` JSON string and puts it into an `expo_updates_request_headers` resource with `resValue`. However, `UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY` in `AndroidManifest.xml` currently holds the JSON string directly instead of referencing that resource, so Android requests the manifest's channel regardless of the env var.

Publishing specifies the channel, as in `eas update --channel production`.

## When to download and when to apply

### Turning off the default and doing it in JS

The default (`ON_LOAD`/`ALWAYS`) has native code check and download in the background at launch, then apply on the next launch. This app runs a version check, login restore, and language setup behind the splash screen, so the update check has to join that flow for one place to decide when to hide the splash and whether to restart. So I turned it off with `checkAutomatically: 'NEVER'` and check from JS.

- Regular update: only check and download during the splash; apply on the next cold start
- Hotfix: `reloadAsync()` as soon as it arrives

Whether it's a hotfix is carried in the manifest as `extra.isHotfix` when published with `IS_HOTFIX=true eas update --channel production`.

```ts title="src/utils/otaUpdate.ts"
// withTimeout: rejects on timeout via Promise.race
const isHotfixUpdate = (manifest: any): boolean =>
  (manifest?.extra?.expoClient?.extra?.isHotfix ??
    manifest?.extra?.isHotfix ??
    manifest?.metadata?.isHotfix ??
    false) === true;

/** Called during the splash. If true, a reload is coming, so keep the splash up */
export const checkForOTAUpdate = async (): Promise<boolean> => {
  try {
    const Updates = require('expo-updates');
    const update = await withTimeout(Updates.checkForUpdateAsync(), 8000);
    if (!update.isAvailable) return false;

    const result = await withTimeout(Updates.fetchUpdateAsync(), 30000);
    if (!result.isNew) return false;

    if (isHotfixUpdate(update.manifest)) {
      Updates.reloadAsync().catch(e => console.warn('[OTA] reloadAsync failed:', e));
      return true;
    }
    return false; // applied on the next cold start
  } catch (error) {
    console.warn('[OTA] Update check failed:', error);
    return false;
  }
};
```

- `isHotfix` is looked up in three places because the location of `extra` depends on the manifest format.
- Every failure ends in `false`. A failed check must not block app startup, so the check has an 8-second timeout and the download 30 seconds.
- On returning to the foreground, only hotfixes are checked (`checkHotfixOnForeground`). This is for users who keep the app open for a long time.

### Tying it to the splash

```tsx title="src/routes/Root.route.tsx"
const didStartReloadRef = React.useRef(false);

// Hide the splash after 8 seconds no matter what
React.useEffect(() => {
  const timeout = setTimeout(() => hideSplashOnce(), 8000);
  return () => clearTimeout(timeout);
}, [hideSplashOnce]);

React.useEffect(() => {
  if (!hasInitialized) return;
  checkForOTAUpdate()
    .then(willReload => {
      if (willReload) {
        didStartReloadRef.current = true; // about to reload, keep the splash
        return;
      }
      hideSplashOnce();
    })
    .catch(() => hideSplashOnce());
}, [hasInitialized, hideSplashOnce]);
```

If a reload is coming, the splash stays up so the main screen doesn't flash and then reload; even if the check hasn't finished, the splash closes after 8 seconds. Later, since `init()` (session restore) and `checkForOTAUpdate()` don't depend on each other, I ran them in parallel with `Promise.all` to overlap the network round trips.

## When things fail

If the app crashes with a fatal error right after launching a new update, expo-updates marks that update as failed and rolls back to the previous update or the embedded bundle. Unhandled render errors can also be counted as an "app failure" through the same path, so a top-level ErrorBoundary catches render errors into a "Try again" screen and keeps them from turning into a native crash.

The rollback mechanisms in code are this error recovery and the "embedded bundle if there's no update" fallback. Pulling a bad update in production is done on the EAS side.

## Later fixes: cold-start apply bug and hotfix reload

### Downloaded updates not applied on iOS

On iOS, a cold start still launched the embedded bundle instead of the downloaded update. `AppController.start()` is asynchronous, and `launchAssetUrl()` only has a value after it picks the update to run from the local DB. Starting RN on the very next line meant it was still `nil` when `bundleURL()` ran.

I made it wait for the `AppControllerDelegate` callback before starting RN. With `checkOnLaunch` set to `NEVER`, this step only reads the local DB and finishes quickly, but there's a 5-second cap in case the callback never arrives.

```swift title="ios/MyApp/AppDelegate.swift" {4-8}
AppController.initializeWithoutStarting()
if AppController.sharedInstance.isActiveController {
  AppController.sharedInstance.delegate = self
  AppController.sharedInstance.start()
  let deadline = Date().addingTimeInterval(5)
  while !updatesDidStart && Date() < deadline {
    RunLoop.main.run(mode: .default, before: Date().addingTimeInterval(0.01))
  }
}
factory.startReactNative(withModuleName: "MyApp", in: window, launchOptions: launchOptions)
RNSplashScreen.show()

// AppControllerDelegate
func appController(_ appController: AppControllerInterface, didStartWithSuccess success: Bool) {
  // Even on failure, bundleURL() falls back to the embedded bundle
  updatesDidStart = true
}
```

- The callback arrives via `DispatchQueue.main.async`, so simply blocking the main thread means it never comes. That's why it waits by spinning the run loop.
- If RN startup moves into the callback, `RNSplashScreen.show()` spins the run loop inside a main-queue block waiting for `hide()` from JS. No other main-queue work runs inside that block, so it deadlocks and the screen freezes black. So both the wait and the RN startup stay in `didFinishLaunching`.

### Why immediate hotfix reload is turned off

Calling `reloadAsync()` right after boot on iOS crashes with SIGSEGV. The crash is in `ReanimatedModuleProxy.cpp` in react-native-reanimated 3.19.0, where the worklets module proxy is null during the reload. A comment in the Reanimated source also mentions a race with back-to-back reloads right after an OTA update. After this crash, error recovery kicks in, discards the update that was just downloaded, and goes back to the embedded bundle.

So I disabled immediate reload with `ENABLE_HOTFIX_RELOAD = false`. Both the splash check and the foreground check look at this switch first; while it's off, even `IS_HOTFIX=true` updates are only downloaded and applied on the next cold start.

### API domain fallback shipped via OTA

On some carriers' LTE networks the API domain was blocked by SNI, and connections dropped during the TLS handshake (iOS `NSURLErrorDomain -1200 / -9816`, `ERR_NETWORK` with no response in axios). Only on a no-response network error does it retry the backup domains in order, and the domain that connects is kept until the app exits. It doesn't move on for 4xx/5xx or timeouts.

```ts title="src/api/nativeInstance.ts"
const SERVER_BASE_URL_CHAIN = [
  PRIMARY_SERVER_BASE_URL,
  'https://api.example.co',
  'https://api.example.net',
  'https://api.example.org',
];

const getNextServerBaseURL = (baseURL?: string) => {
  const index = SERVER_BASE_URL_CHAIN.indexOf(baseURL);
  return index < 0 ? undefined : SERVER_BASE_URL_CHAIN[index + 1];
};

// response interceptor (error)
const failedBaseURL = config?.baseURL ?? instance.defaults.baseURL;
const nextBaseURL = getNextServerBaseURL(failedBaseURL);
if (IS_PROD && isNoResponseNetworkError(error) && config && nextBaseURL) {
  // The retry goes through this interceptor again, so it walks down the chain in order
  return instance.request({...config, baseURL: nextBaseURL}).then(
    response => {
      switchToFallbackDomain(response?.config?.baseURL);
      return response;
    },
    fallbackError => {
      if (fallbackError?.response) switchToFallbackDomain(fallbackError.config?.baseURL);
      return Promise.reject(fallbackError);
    },
  );
}
```

- The backup domains are code constants, not env vars. Env vars go into the native build and need a store release; constants live in the JS bundle, so the list can change via OTA.
- The fallback is only for the production server, so it runs only in PROD builds. This keeps the STG app from connecting to the production server.

## Remaining work

- Generate the runtime version from one place instead of syncing three files by hand
- Clean up the manifest so the Android channel header follows `OTA_CHANNEL` (`android:value="@string/expo_updates_request_headers"`)
- Fix the Reanimated reload crash, verify on real devices, and turn immediate hotfix reload back on
