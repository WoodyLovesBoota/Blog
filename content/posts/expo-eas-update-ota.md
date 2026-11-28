---
title: "React Native EAS OTA 적용"
description: bare React Native 앱에 expo-updates 를 붙여 OTA 업데이트를 받게 한 기록. 네이티브 설정 직접 맞추기, runtimeVersion·채널 관리, 업데이트 적용 시점, iOS 콜드 스타트 반영 버그와 핫픽스 리로드 크래시.
date: 2025-08-28
updated: 2026-11-04
tags: [react-native, expo, eas-update, ota]
keywords: [EAS Update, expo-updates, OTA 업데이트, 코드푸시, CodePush 대체, bare React Native, runtimeVersion, expo-channel-name, reloadAsync]
---

`ios/`, `android/` 를 직접 관리하는 bare React Native 앱에 EAS Update 로 OTA 업데이트를 붙였다. Expo 문서의 "설정 한 줄 추가" 안내는 대부분 그대로 적용되지 않는다.

## 배경

RN 0.79 앱에 Firebase 메시징, Facebook SDK, AppsFlyer, 이미지 알림용 Notification Service Extension 이 이미 붙어 있었고, 여기에 `expo`(53)와 `expo-updates`(0.28)를 추가했다.

Expo 관리형(CNG) 프로젝트는 `app.json` 의 `updates` 설정을 `expo prebuild` 가 네이티브 파일로 옮긴다. bare 프로젝트는 같은 설정을 네이티브 파일에 직접 써야 한다.

| 설정 | Expo 설정 (`app.config.js`) | iOS | Android |
| --- | --- | --- | --- |
| 업데이트 서버 URL | `updates.url` | `Expo.plist` `EXUpdatesURL` | `AndroidManifest.xml` meta-data |
| 런타임 버전 | `runtimeVersion` | `EXUpdatesRuntimeVersion` | `strings.xml` → meta-data |
| 시작 시 자동 체크 | `updates.checkAutomatically` | `EXUpdatesCheckOnLaunch` | `EXPO_UPDATES_CHECK_ON_LAUNCH` |
| 채널 | (EAS Build 프로필) | `EXUpdatesRequestHeaders` | `UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY` |

앱이 실제로 읽는 값은 오른쪽 두 열이고, `app.config.js` 는 `eas update` CLI 가 프로젝트 정보와 런타임 버전을 읽는 데 쓴다. 세 곳이 어긋나면 업데이트를 올려도 앱이 받지 못한다.

## 세팅

### JS 빌드 체인

`eas update` 는 Metro 로 번들을 만들며 Expo serializer 가 필요하다. `metro.config.js` 는 `expo/metro-config` 의 `getDefaultConfig` 에 기존 설정을 `mergeConfig` 로 합치고, Babel 프리셋은 `module:@react-native/babel-preset` 에서 `babel-preset-expo` 로 바꿨다(`module-resolver` 는 유지).

설정은 환경 변수를 읽기 위해 `app.config.js` 에 둔다. `index.js` 가 `app.json` 에서 앱 이름을 import 하던 부분은 `AppRegistry.registerComponent('MyApp', ...)` 처럼 문자열로 바꿨다.

### iOS: Podfile 과 AppDelegate

Podfile 에 `use_expo_modules!` 를 넣고 `use_native_modules!` 가 Expo autolinking 으로 RN 모듈 설정을 읽게 했다. 메인 타깃 안에 중첩되어 `inherit! :search_paths` 를 쓰던 Notification Service Extension 은 밖으로 빼서 Expo/RN pod 과 분리하고 Firebase Messaging 만 갖게 했다.

```ruby title="ios/Podfile"
target 'MyApp' do
  use_expo_modules!
  # ...
end

target 'ImageNotification' do
  # Keep the notification service extension isolated
  # from Expo/React Native pods.
  pod 'Firebase/Messaging'
end
```

AppDelegate 에서는 `AppController` 를 초기화하고, 릴리스 빌드의 번들 URL 을 OTA 번들 우선, 없으면 내장 `main.jsbundle` 로 했다.

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
  // EAS Updates: OTA 번들 URL 우선, 없으면 내장 번들로 폴백
  if AppController.isInitialized(),
     let otaURL = AppController.sharedInstance.launchAssetUrl() {
    return otaURL
  }
  return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
}
```

이 코드에는 순서 문제가 있다. 아래 "이후 개선"에서 다룬다.

### Android: Gradle 과 MainApplication

`settings.gradle` 에서 `useExpoModules()`, `app/build.gradle` 에서 `addExpoModulesDependencies` 를 호출한다. `MainApplication.kt` 는 `DefaultReactNativeHost` 를 `ReactNativeHostWrapper` 로 감싸야 expo-updates 가 번들 경로를 바꿔 끼울 수 있고, 생명주기 이벤트도 Expo 에 전달해야 한다.

```kotlin title="android/app/src/main/java/.../MainApplication.kt" {2,9,18-19}
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
  get() = ReactNativeHostWrapper.createReactHost(
    applicationContext,
    reactNativeHost,
  )

override fun onCreate() {
  // ...
  ApplicationLifecycleDispatcher.onApplicationCreate(this)
  UpdatesController.initialize(this)
  logOtaState("application_on_create")
}
```

`logOtaState` 는 백그라운드 스레드에서 `UpdatesController` 의 채널, 런타임 버전, 실행 중인 업데이트 ID, 내장 업데이트 ID, `isEmbeddedLaunch` 를 logcat 에 찍는다. 업데이트가 반영되지 않을 때 채널 문제인지, 런타임 버전 문제인지, 받았지만 적용 전인지를 구분하는 용도다.

## runtimeVersion

앱은 자기 런타임 버전과 정확히 같은 업데이트만 받는다. 네이티브 모듈을 바꾼 뒤 같은 런타임 버전으로 JS 만 배포하면 새 JS 가 없는 네이티브 함수를 부르다 죽을 수 있다.

bare 프로젝트에서는 `{ "policy": "appVersion" }` 같은 정책을 앱이 계산하지 않고 `Expo.plist`·`strings.xml` 에 박힌 문자열을 그대로 쓴다. 그래서 문자열을 직접 관리한다.

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

첫 스토어 릴리스부터는 런타임 버전을 `versionName` 과 같게 두고, 네이티브 빌드마다 세 파일을 같이 올린다.

```text
app.config.js                          runtimeVersion: '1.019.020'
ios/Expo.plist                         EXUpdatesRuntimeVersion = 1.019.020
android/app/src/main/res/values/strings.xml   expo_runtime_version = 1.019.020
```

- 스토어 버전 하나에 OTA 줄기 하나가 대응한다.
- 네이티브 변경이 없는 릴리스에서도 런타임 버전이 바뀌어, 이전 스토어 버전 사용자는 새 OTA 를 받지 못한다.
- 네이티브 변경 시에만 올리는 방식은 매 릴리스마다 사람이 네이티브 변경 여부를 판단해야 해서 택하지 않았다.

## 채널: STG 와 PROD 분리

앱은 업데이트 요청에 `expo-channel-name` 헤더를 싣고, 서버는 그 채널에 연결된 브랜치의 최신 업데이트를 준다. `eas.json` 빌드 프로필의 채널은 EAS Build 로 빌드할 때만 네이티브 설정에 주입되므로, Xcode/Gradle 로 직접 빌드하는 이 앱은 직접 넣어야 한다.

`react-native-config` 환경 파일에 `OTA_CHANNEL` 을 추가했다. PROD 는 `production`, STG 는 값이 없어 기본값 `development` 가 된다. iOS 는 `[Expo] Configure project` 다음, 소스 컴파일 전 Build Phase 에서 `Expo.plist` 를 고친다.

```bash title="ios/scripts/sync-expo-channel.sh"
#!/bin/bash
# Expo.plist의 expo-channel-name을 OTA_CHANNEL 환경변수로 자동 갱신
EXPO_PLIST="${SRCROOT}/Expo.plist"
CHANNEL="${OTA_CHANNEL:-development}"

if [ -f "$EXPO_PLIST" ]; then
  /usr/libexec/PlistBuddy \
    -c "Set :EXUpdatesRequestHeaders:expo-channel-name $CHANNEL" \
    "$EXPO_PLIST"
fi
```

`ios/Expo.plist` 와 `ios/MyApp/Supporting/Expo.plist` 가 둘 다 생겨 있었는데, 값이 어긋나지 않게 `ios/Expo.plist` 하나만 남겼다.

Android 는 `build.gradle` 에서 같은 변수로 `{"expo-channel-name":"..."}` JSON 을 만들어 `resValue` 로 `expo_updates_request_headers` 리소스에 넣는다. 다만 현재 `AndroidManifest.xml` 의 `UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY` 는 이 리소스를 참조하지 않고 JSON 문자열을 직접 갖고 있어, Android 는 환경 변수와 무관하게 매니페스트의 채널로 요청한다.

배포는 `eas update --channel production` 처럼 채널을 지정한다.

## 업데이트를 언제 받고 언제 적용할까

### 기본 동작을 끄고 JS 에서 직접

기본값(`ON_LOAD`/`ALWAYS`)은 시작 시 네이티브가 백그라운드로 확인·다운로드하고 다음 실행에 적용한다. 이 앱은 스플래시 뒤에서 버전 체크, 로그인 복구, 언어 설정을 하므로, 업데이트 확인도 그 흐름에 넣어야 스플래시를 닫을 시점과 재시작 여부를 한 곳에서 정할 수 있다. 그래서 `checkAutomatically: 'NEVER'` 로 끄고 JS 에서 확인한다.

- 일반 업데이트: 스플래시 중 확인·다운로드만 하고 다음 콜드 스타트에 적용
- 핫픽스: 받자마자 `reloadAsync()`

핫픽스 여부는 `IS_HOTFIX=true eas update --channel production` 으로 올릴 때 `extra.isHotfix` 로 매니페스트에 담긴다.

```ts title="src/utils/otaUpdate.ts"
// withTimeout: Promise.race 로 타임아웃 시 reject
const isHotfixUpdate = (manifest: any): boolean =>
  (manifest?.extra?.expoClient?.extra?.isHotfix ??
    manifest?.extra?.isHotfix ??
    manifest?.metadata?.isHotfix ??
    false) === true;

/** 스플래시 중 호출. true 면 곧 리로드하므로 스플래시를 닫지 않는다 */
export const checkForOTAUpdate = async (): Promise<boolean> => {
  try {
    const Updates = require('expo-updates');
    const update = await withTimeout(Updates.checkForUpdateAsync(), 8000);
    if (!update.isAvailable) return false;

    const result = await withTimeout(Updates.fetchUpdateAsync(), 30000);
    if (!result.isNew) return false;

    if (isHotfixUpdate(update.manifest)) {
      Updates.reloadAsync().catch(e =>
        console.warn('[OTA] reloadAsync failed:', e),
      );
      return true;
    }
    return false; // 다음 콜드 스타트에 반영
  } catch (error) {
    console.warn('[OTA] Update check failed:', error);
    return false;
  }
};
```

- `isHotfix` 를 세 경로에서 찾는 건 매니페스트 형식에 따라 `extra` 위치가 달라서다.
- 모든 실패는 `false` 로 끝난다. 확인 실패가 앱 시작을 막으면 안 되므로 확인 8초, 다운로드 30초 타임아웃을 건다.
- 포그라운드 복귀 시에는 핫픽스만 확인한다(`checkHotfixOnForeground`). 앱을 오래 띄워 두는 사용자용이다.

### 스플래시와 묶기

```tsx title="src/routes/Root.route.tsx"
const didStartReloadRef = React.useRef(false);

// 무슨 일이 있어도 8초 뒤에는 스플래시를 닫는다
React.useEffect(() => {
  const timeout = setTimeout(() => hideSplashOnce(), 8000);
  return () => clearTimeout(timeout);
}, [hideSplashOnce]);

React.useEffect(() => {
  if (!hasInitialized) return;
  checkForOTAUpdate()
    .then(willReload => {
      if (willReload) {
        didStartReloadRef.current = true; // 리로드 직전이면 스플래시 유지
        return;
      }
      hideSplashOnce();
    })
    .catch(() => hideSplashOnce());
}, [hasInitialized, hideSplashOnce]);
```

리로드 예정이면 스플래시를 유지해 메인 화면이 잠깐 보였다 다시 뜨는 걸 막고, 확인이 끝나지 않아도 8초 뒤에는 닫는다. 이후 `init()`(세션 복구)과 `checkForOTAUpdate()` 는 서로 의존하지 않으므로 `Promise.all` 로 병렬 실행해 네트워크 왕복을 겹쳤다.

## 실패했을 때

expo-updates 는 새 업데이트로 실행한 직후 치명적 오류로 죽으면 그 업데이트를 실패로 표시하고 이전 업데이트나 내장 번들로 되돌린다. 처리되지 않은 렌더 에러도 같은 경로로 "앱 실패"로 집계될 수 있어서, 최상단 ErrorBoundary 가 렌더 에러를 "다시 시도" 화면으로 받아 네이티브 크래시로 번지지 않게 한다.

코드 수준의 롤백 장치는 이 에러 복구와 "업데이트가 없으면 내장 번들" 폴백 두 가지다. 운영 중 잘못된 업데이트를 내리는 일은 EAS 쪽에서 한다.

## 이후 개선: 콜드 스타트 반영 문제와 핫픽스 리로드

### iOS 에서 받은 업데이트가 적용되지 않던 문제

iOS 에서는 콜드 스타트를 해도 다운로드한 업데이트 대신 내장 번들로 떴다. `AppController.start()` 는 비동기라 로컬 DB 에서 실행할 업데이트를 고른 뒤에야 `launchAssetUrl()` 이 값을 갖는데, 바로 다음 줄에서 RN 을 시작하면 `bundleURL()` 시점에 아직 `nil` 이다.

`AppControllerDelegate` 콜백을 기다린 뒤 RN 을 시작하게 했다. `checkOnLaunch` 가 `NEVER` 라 이 단계는 로컬 DB 만 읽어 금방 끝나지만, 콜백이 안 올 경우를 대비해 5초 상한을 뒀다.

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
factory.startReactNative(
  withModuleName: "MyApp",
  in: window,
  launchOptions: launchOptions
)
RNSplashScreen.show()

// AppControllerDelegate
func appController(
  _ appController: AppControllerInterface,
  didStartWithSuccess success: Bool
) {
  // 실패해도 bundleURL() 이 내장 번들로 폴백한다
  updatesDidStart = true
}
```

- 콜백은 `DispatchQueue.main.async` 로 오므로 메인 스레드를 그냥 막으면 오지 않는다. 그래서 run loop 를 돌리며 기다린다.
- RN 시작을 콜백 안으로 옮기면 `RNSplashScreen.show()` 가 메인 큐 블록 안에서 run loop 를 돌며 JS 의 `hide()` 를 기다린다. 그 블록 안에서는 다른 메인 큐 작업이 실행되지 않아 교착 상태가 되고 화면이 검게 멈춘다. 그래서 대기와 RN 시작을 모두 `didFinishLaunching` 에 둔다.

### 핫픽스 즉시 리로드를 꺼 둔 이유

iOS 에서 부팅 직후 `reloadAsync()` 를 호출하면 SIGSEGV 로 죽는다. 위치는 react-native-reanimated 3.19.0 의 `ReanimatedModuleProxy.cpp` 이고, 리로드 중 worklets 모듈 프록시가 null 이다. Reanimated 소스 주석에도 OTA 업데이트 직후 연속 리로드의 race 가 언급되어 있다. 이 크래시 뒤 에러 복구가 동작해 방금 받은 업데이트를 버리고 내장 번들로 돌아간다.

그래서 `ENABLE_HOTFIX_RELOAD = false` 로 즉시 리로드를 껐다. 스플래시 중 확인과 포그라운드 확인 모두 이 스위치를 먼저 보고, 꺼진 동안 `IS_HOTFIX=true` 업데이트도 다운로드만 하고 다음 콜드 스타트에 반영된다.

### OTA 로 함께 배포한 API 도메인 폴백

일부 통신사 LTE 망에서 API 도메인이 SNI 기준으로 차단되어 TLS 핸드셰이크 중 연결이 끊겼다(iOS `NSURLErrorDomain -1200 / -9816`, axios 에서는 응답 없는 `ERR_NETWORK`). 응답 없는 네트워크 에러일 때만 예비 도메인으로 차례로 재시도하고, 연결된 도메인은 앱 종료까지 유지한다. 4xx/5xx 나 타임아웃에서는 넘어가지 않는다.

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
  // 재시도 요청도 이 인터셉터를 다시 타므로 체인을 따라 차례로 넘어간다
  return instance.request({...config, baseURL: nextBaseURL}).then(
    response => {
      switchToFallbackDomain(response?.config?.baseURL);
      return response;
    },
    fallbackError => {
      if (fallbackError?.response) {
        switchToFallbackDomain(fallbackError.config?.baseURL);
      }
      return Promise.reject(fallbackError);
    },
  );
}
```

- 예비 도메인은 환경 변수가 아니라 코드 상수다. 환경 변수는 빌드 때 네이티브에 들어가 스토어 배포가 필요하지만, 상수는 JS 번들에 있어 OTA 로 목록을 바꿀 수 있다.
- 운영 서버용이라 PROD 빌드에서만 폴백한다. STG 앱이 운영 서버에 붙지 않게 하기 위해서다.

## 남은 과제

- 런타임 버전을 세 파일에 손으로 맞추는 대신 한 곳에서 생성하기
- Android 채널 헤더가 `OTA_CHANNEL` 을 따르도록 매니페스트 정리(`android:value="@string/expo_updates_request_headers"`)
- Reanimated 리로드 크래시를 해결하고 실기기 검증 후 핫픽스 즉시 리로드 다시 켜기
