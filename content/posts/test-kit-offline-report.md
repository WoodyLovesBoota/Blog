---
title: "Jest 와 Playwright 결과를 한 장의 오프라인 HTML 로: 첫 npm 패키지"
description: Jest 와 Playwright 결과를 공통 JSON 하나로 모으고, 스크린샷까지 넣은 HTML 한 파일로 만드는 npm 패키지 test-kit 을 만들었다. reporter·preset 설계, tsup 듀얼 빌드, 설정 파일을 고치는 init, Changesets 자동 배포까지의 기록.
date: 2026-11-19
tags: [testing, jest, playwright, npm, typescript, case-study]
keywords: [Jest Playwright 통합 리포트, Playwright HTML 리포트, Jest HTML 리포트, 커스텀 reporter, npm 패키지 배포, tsup ESM CJS, package.json exports, Changesets, GitHub Actions npm publish, test report offline]
draft: true
aiDraft: true
---

[`@woodylovesboota/test-kit`](https://github.com/WoodyLovesBoota/test-kit) 은 Jest 와 Playwright 결과를 HTML 한 장에 모아 주는 패키지다. preset, reporter, CLI 로 이루어져 있고 둘 중 하나만 써도 된다.

| 항목 | 내용 |
| --- | --- |
| 진입점 | `.` · `/jest` · `/playwright` · `/reporters/jest` · `/reporters/playwright` · `/helpers` |
| 빌드 | tsup, ESM + CJS + `.d.ts` |
| CLI | `testkit init` · `testkit run` · `testkit report` |
| 버전 | 0.1.0 → 0.2.0 (첫 배포) → 0.3.0 (`init`), 모두 하루 안에 |

## 배경

Jest 와 Playwright 는 리포트를 따로 만든다. Playwright HTML 리포트는 좋지만 Jest 결과는 없고, 둘을 같이 쓰는 프로젝트에서는 "이번 실행에서 뭐가 깨졌나"를 보려면 터미널 로그와 리포트 두 곳을 오가야 했다.

원한 것은 세 가지다.

- 두 도구 결과가 한 페이지에, 실패가 먼저 보인다.
- 파일 하나로 끝난다. 메신저로 보내거나 CI artifact 로 받아도 오프라인에서 열린다.
- 기존 설정을 거의 안 건드린다. 설정 한 줄을 감싸는 정도.

## 1 · 공통 결과 형식부터

리포트가 Jest 나 Playwright 를 직접 알면 도구가 늘 때마다 리포트를 고쳐야 한다. 그래서 reporter 는 공통 형식 `ToolResultFile` 을 `<resultsDir>/<tool>.json` 으로 쓰고, 리포트 생성기는 이 형식만 읽는다.

```ts title="src/types.ts · simplified"
export interface TestRecord {
  id: string;
  tool: ToolName;          // "jest" | "playwright" | 그 밖의 문자열
  file: string;            // 프로젝트 루트 기준, "/" 구분
  suite: string;           // describe 체인을 " › " 로 이은 것
  title: string;
  status: "passed" | "failed" | "skipped" | "flaky";
  durationMs: number;
  retries: number;
  error?: { message: string; stack?: string };
  attachments: { name: string; path: string; contentType: string }[];
  project?: string;
}

export interface ToolResultFile {
  schemaVersion: 1;
  tool: ToolName;
  startedAt: string;
  finishedAt: string;
  counts: ToolCounts;
  records: TestRecord[];
}
```

`ToolName` 을 `KnownTool | (string & {})` 로 열어 둔 것이 요점이다. Vitest reporter 가 `vitest.json` 만 쓰면 리포트에 탭이 하나 더 생기고, 리포트 코드는 그대로다. 로더는 `schemaVersion === 1` 이고 `records` 가 배열인 파일만 받고, 나머지는 경고로 넘긴다.

## 2 · reporter 두 개

### Jest: 타입 의존 없이

Jest reporter 는 `onRunComplete` 에서 집계 결과를 `TestRecord` 로 바꾼다. Jest 내부 타입을 import 하지 않고, 쓰는 필드만 구조적 타입(`AssertionLike`, `FileResultLike`)으로 선언했다. 그래서 Jest 는 런타임에도 타입에도 필요 없는 optional peer dependency 로 남는다.

놓치기 쉬운 경우가 하나 있다. import 에러나 문법 에러로 파일 자체가 못 돈 경우 `testResults` 가 비어 있어서, 그대로 두면 리포트에서 조용히 사라진다.

```ts title="src/reporters/jest.ts" {2}
// A file that could not run (syntax error, failing import) has no test entries — keep it visible.
if (fileResult.testExecError && fileResult.testResults.length === 0) {
  records.push({
    id: `jest:${file}:exec`,
    title: "Test file failed to run",
    status: "failed",
    error: splitError(stripAnsi(text), this.rootDir),
    // ...
  });
}
```

### Playwright: 재시도와 첨부 파일

Playwright reporter 는 `onTestEnd` 가 시도(attempt)마다 불린다. 리포트에는 마지막 시도만 남기고, 이전 시도 때 복사한 파일은 지운다. 스크린샷·trace·video 는 `assets/playwright/` 로 복사한다. 원본이 `test-results/` 안에 있어서 다음 실행 때 사라지기 때문이다.

```ts title="src/reporters/playwright.ts · simplified" {2-3}
onTestEnd(test: TestCase, result: TestResult): void {
  const prev = this.latest.get(test.id);
  for (const file of prev?.copied ?? []) fs.rmSync(file, { force: true });

  result.attachments.forEach((a, i) => {
    const target = path.join(this.assetDir, `${base}-${i}-${slug(a.name)}${ext}`);
    if (a.path && fs.existsSync(a.path)) fs.copyFileSync(a.path, target);
    else if (a.body) fs.writeFileSync(target, new Uint8Array(a.body));
    // ...
  });
  this.latest.set(test.id, { test, result, attachments, copied });
}
```

`onEnd` 에서는 `rootSuite.allTests()` 와 대조해 한 번도 안 돈 테스트(max failures, 중단)를 `skipped` 로 채운다. 상태는 `test.outcome()` 을 그대로 매핑해서 `flaky` 도 Playwright 판정을 따른다.

에러 메시지는 ANSI 색 코드를 지우고 프로젝트 루트 절대 경로를 상대 경로로 바꾼다. CI 에서 만든 리포트와 로컬 리포트가 같은 모양으로 읽힌다.

## 3 · preset: 사용자 값이 이긴다

`createJestConfig()` 와 `definePlaywrightConfig()` 는 기본값 위에 사용자 설정을 deep merge 한다. 규칙은 단순하게 잡았다.

- plain object 는 키별로 합친다.
- 배열(`projects`, `testPathIgnorePatterns`)은 합치지 않고 통째로 바꾼다. 합치면 기본값을 뺄 방법이 없다.
- `reporter` 만 예외다. 사용자 reporter 는 그대로 두고 testkit reporter 를 뒤에 붙인다. 이미 있으면 다시 붙이지 않는다.

Playwright 기본값은 `testDir: "e2e"`, `screenshot: "on"`, `trace: "retain-on-failure"` 다. 스크린샷을 항상 찍어야 리포트에 통과한 테스트의 마지막 화면도 보인다. Jest 쪽은 `<rootDir>/e2e/` 를 무시해서 Playwright spec 을 Jest 가 집어 가지 않게 한다.

preset 은 그냥 객체를 돌려주므로 `next/jest` 같은 다른 래퍼 안에 넣어도 된다.

```ts title="jest.config.ts"
import nextJest from "next/jest.js";
import { createJestConfig as withTestkit } from "@woodylovesboota/test-kit/jest";

export default nextJest({ dir: "./" })(withTestkit({ testEnvironment: "jsdom" }));
```

### reporter 경로 찾기

Jest 와 Playwright 는 reporter 를 경로 문자열로 받아서 직접 `require` 한다. preset 은 자기 옆의 빌드 결과물을 절대 경로로 넘겨야 한다.

```ts title="src/core/locate.ts"
export function builtReporter(name: "jest" | "playwright"): string {
  const here = __dirname;
  const candidates = [
    path.join(here, "..", "reporters", `${name}.cjs`),
    path.join(here, "..", "reporters", `${name}.js`),
    path.join(here, "..", "reporters", `${name}.ts`), // running from source
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
}
```

`.cjs` 를 먼저 고르는 건 사용자 config 가 ESM 이든 CJS 든 두 러너 모두 `require` 할 수 있기 때문이다. 이 코드가 동작하려면 빌드 설정 두 가지가 필요했다(아래 5절).

## 4 · HTML 한 장

`testkit run` 은 Jest, Playwright 를 차례로 돌리고 리포트를 만든다. 하나가 실패해도 다음 것은 돈다. 두 명령에 `TESTKIT_RESULTS_DIR` 을 넘겨서 reporter 가 쓰는 곳과 리포트가 읽는 곳을 맞춘다. 패키지 매니저는 lockfile 을 위로 찾아 올라가며 정한다(`pnpm exec`, `yarn`, `bunx`, `npx`).

리포트는 화면 두 개다.

- **목록**: 통과·실패·flaky·skip 수, 실행 시간, git 브랜치와 커밋, 그리고 도구 → 파일 → 테스트. 실패가 있는 파일이 먼저, 파일 안에서도 실패가 먼저 온다.
- **상세**: `#/t/<id>`. 에러 전문, 스택은 한 번 더 눌러야 펼쳐진다. 스크린샷은 큰 이미지 하나 + 단계 썸네일이고, 실패한 테스트는 마지막 스크린샷에서 열린다.

해시 라우팅이라 서버 없이 `file://` 로 열어도 뒤로 가기와 테스트 링크가 동작한다. 목록으로 돌아오면 스크롤 위치를 복원한다. 스크립트는 ES2017 문자열로 HTML 안에 넣었고, CDN 이나 웹폰트는 하나도 없다.

### 스크린샷은 파일 안에, trace 는 밖에

기본값은 스크린샷을 base64 data URI 로 `index.html` 에 넣는다. trace zip 과 video 는 너무 커서 `assets/` 에 두고, 상세 화면에 복사할 수 있는 `npx playwright show-trace <path>` 명령을 보여 준다.

같은 이미지가 썸네일과 큰 화면에 두 번 쓰이므로, `<img>` 마다 data URI 를 박으면 파일이 두 배가 된다. 이미지는 `<script type="application/json" id="testkit-images">` 에 한 번만 넣고, 태그에는 `data-img="<id>"` 만 둔 뒤 페이지 스크립트가 `src` 를 채운다.

```js title="src/report/client.ts · simplified"
var images = JSON.parse($("#testkit-images").textContent || "{}");
function srcOf(el) {
  var id = el.getAttribute("data-img");
  return id ? images[id] : el.getAttribute("data-url"); // --no-inline: relative path
}
```

스크린샷이 60장쯤이면 약 5MB 다. 큰 스위트나 GitHub Pages 용으로는 `--no-inline` 으로 `assets/` 를 상대 경로로 링크한다.

### 스택 트레이스 줄이기

Jest 와 Playwright 모두 스택 맨 앞에 메시지를 한 번 더 붙인다. 이 중복을 떼고, `node_modules` 와 Node 내부 프레임은 숨긴 뒤 "… 12 frames in node_modules / node internals hidden" 한 줄로 남긴다. 내 코드 프레임이 하나도 없으면 전부 보여 준다.

## 5 · 패키지로 만들기: tsup 듀얼 빌드

진입점이 일곱 개(CLI 포함)이고, 각각 ESM 과 CJS 둘 다 내보낸다.

```ts title="tsup.config.ts" {12,14}
export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
    "presets/jest": "src/presets/jest.ts",
    "presets/playwright": "src/presets/playwright.ts",
    "reporters/jest": "src/reporters/jest.ts",
    "reporters/playwright": "src/reporters/playwright.ts",
    "helpers/playwright": "src/helpers/playwright.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  shims: true,
  target: "node18",
  external: ["jest", "@playwright/test"],
});
```

- `splitting: false`: 진입점마다 혼자 서는 파일이 된다. 공통 chunk 로 쪼개지면 `dist/presets/jest.js` 옆에 `../reporters/jest.cjs` 가 있다는 가정이 깨질 수 있다.
- `shims: true`: ESM 빌드에서도 `__dirname` 을 쓸 수 있게 tsup 이 `import.meta.url` 로 채워 준다. `builtReporter()` 가 여기에 기댄다.
- `external`: 두 러너는 번들에 넣지 않고 optional peer dependency 로 둔다.

`package.json` 의 `exports` 는 진입점마다 `import` / `require` 조건 아래 `types` 를 따로 둔다. CJS 쪽 타입은 `.d.cts` 다. `types` 를 조건 밖에 하나만 두면 TypeScript 가 `require` 로 들어온 사용자에게 ESM 타입을 보여 준다.

```json title="package.json · exports 하나"
"./jest": {
  "import": { "types": "./dist/presets/jest.d.ts", "default": "./dist/presets/jest.js" },
  "require": { "types": "./dist/presets/jest.d.cts", "default": "./dist/presets/jest.cjs" }
}
```

배포 전에는 `pnpm pack` 으로 만든 tarball 을 다른 프로젝트에 설치해서 확인했다. `file:../test-kit` 링크로는 `files` 필드에서 빠진 파일 같은 배포 문제를 못 잡는다.

## 6 · `testkit init`: 모르는 모양이면 건드리지 않기

첫 배포 뒤 같은 날 `init` 을 붙였다(0.3.0). 설치하고 설정 파일을 손으로 고치는 단계를 명령 하나로 줄이는 것이다.

| 파일 | 변경 |
| --- | --- |
| `package.json` | `test:report`, `test:report:open` 스크립트 추가 |
| `.gitignore` | `/.testkit/` 추가 |
| `playwright.config.*` | `defineConfig(…)` → `definePlaywrightConfig(…)`, 또는 export 를 감싼다 |
| `jest.config.*` | `X(config)` → `X(withTestkit(config))`, `config` → `withTestkit(config)` |

남의 설정 파일을 고치는 일이라 원칙을 정했다.

- AST 파서를 넣지 않고, 흔한 모양 몇 가지만 정규식으로 알아본다: `export default defineConfig(`, `export default config`, 맨 끝의 `export default { … }`, 그리고 각각의 `module.exports` 판.
- 모르는 모양이면 파일을 그대로 두고 `!` 표시와 함께 손으로 넣을 코드를 출력한다. 틀리게 고치는 것보다 안 고치는 것이 낫다.
- 이미 testkit preset 을 import 하고 있으면 `unchanged`. 두 번 돌려도 아무것도 안 바뀐다.
- `package.json` 의 들여쓰기와 마지막 줄바꿈을 원본대로 유지한다.
- `package.json` 에 없는 도구는 건너뛰고, Jest 설정이 `package.json#jest` 에 있으면 옮기라고 안내만 한다.
- `--dry-run` 으로 미리 본다.

Playwright 설정에서 `defineConfig` 를 바꾸고 나면 `import { defineConfig } from "@playwright/test"` 가 안 쓰이는 import 로 남는다. 다른 곳에서 안 쓸 때만 그 이름을 import 에서 뺀다.

```text title="testkit init --dry-run"
testkit init (dry run — nothing written)

  ~ package.json          updated   added scripts test:report, test:report:open
  ~ .gitignore            updated   added /.testkit/
  ~ playwright.config.ts  updated   defineConfig(…) → definePlaywrightConfig(…)
  + jest.config.ts        created   new config with testkit defaults

Next: pnpm test:report
```

## 7 · Changesets + GitHub Actions 배포

버전과 CHANGELOG 는 Changesets 로 관리한다. `main` 에 push 할 때마다 workflow 가 돈다.

1. `.changeset/*.md` 가 남아 있으면 버전을 올리고 CHANGELOG 를 쓴 "Version Packages" PR 을 연다.
2. 그 PR 이 머지되어 남은 changeset 이 없으면 빌드해서 npm 에 publish 한다.

```yaml title=".github/workflows/release.yml · simplified"
- run: pnpm install --frozen-lockfile
- run: pnpm typecheck
- uses: changesets/action@v1
  with:
    version: pnpm version-packages
    publish: pnpm release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

설정하면서 걸린 것들:

- 저장소 설정에서 "Allow GitHub Actions to create and approve pull requests" 를 켜야 Version Packages PR 이 열린다.
- scope 패키지(`@woodylovesboota/…`)는 기본이 비공개라 `publishConfig.access: "public"` 과 changeset config 의 `access: "public"` 이 필요하다.
- pnpm 버전을 lockfile 버전(v6, pnpm 8)에 맞춰야 `--frozen-lockfile` 이 통과한다.
- 첫 changeset 을 `minor` 로 적었더니 `package.json` 의 0.1.0 이 0.2.0 이 되어 나갔다. 첫 배포 버전을 그대로 쓰고 싶으면 처음부터 원하는 버전 바로 아래로 두거나 첫 publish 는 손으로 하는 편이 낫다.

## 한계

- Jest 의 `flaky` 는 `jest.retryTimes()` 를 써야만 나온다.
- 리포트 UI 는 영어다. 테스트 제목은 쓴 그대로 나온다.
- 모든 테스트와 스크린샷이 HTML 하나에 들어가므로 큰 스위트는 `--no-inline` 이 필요하다.
- `init` 은 정규식 기반이라 흔한 모양만 고친다. 의도한 제약이다.
