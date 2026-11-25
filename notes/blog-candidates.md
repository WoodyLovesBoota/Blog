# 블로그 글감 후보 (개인 레포 히스토리 기반)

조사일: 2026-11-25 · 대상: 이 컴퓨터의 개인 레포 17개 (회사 레포 tethermax-*, paybacks-web 제외)
날짜 = 관련 커밋이 일단락된 시점 기준 제안. ★ = 레포에서 가장 강한 후보. 수준: 입=입문 / 중=중급 / 심=심화. ? = 근거가 애매하거나 추정 포함.
"겹침" = 이미 블로그에 있는 글과 주제가 겹침.

현재 블로그 타임라인: velog 23개 (2022-08 ~ 2024-02-16 CORS) → case study 5개 (2024-10-18 image-pipeline ~ 2026-10-23 rn-audit)

---

## 1. 2024년 — CORS(02-16)와 image-pipeline(10-18) 사이를 채울 후보

### jobterviewee — AI 면접·자소서 코칭 서비스, 12일 해커톤 (2024-03-20 ~ 03-31, 68커밋, FE 전담)
커밋은 전부 본인. BE/AI 는 팀원(`api.jobterviewee.site`). 팀 구성·역할은 기억으로 보충 필요.

| ID | 날짜 | 가제 | 요약 | 수준 |
| --- | --- | --- | --- | --- |
| J1 ★ | 2024-03-31 | 브라우저에서 OpenAI 를 직접 부르던 챗봇을 백엔드 API 로 옮기기까지 | `NEXT_PUBLIC_OPENAI_KEY` 로 클라이언트에서 gpt-3.5 직접 호출 → 마감일에 BE 엔드포인트 5개를 react-query mutation 으로 연결, 키 노출 제거. FE/BE 책임 분리 회고 | 중 |
| J2 ★ | 2024-03-31 | 12일 만에 AI 면접·자소서 코칭 서비스 런칭한 해커톤 회고 | 초기 세팅 → 소셜 로그인 → 모의면접 → 자소서 → API 연동 → 반응형. 아래 후보들을 묶는 글 | 입~중 |
| J3 | 2024-03-31 | 채팅 UI 로 AI 모의면접 흐름 만들기: 질문 → 답변 → 피드백 → 계속/종료 | loading 플레이스홀더 후 교체(낙관적 UI), 3개씩 묶어 Q/A/결과 저장, recoil-persist | 중 |
| J4 ★ | 2024-03-23 | NextAuth 로 카카오·네이버·구글 로그인 붙이고 Vercel 배포에서 막힌 이야기 | 새벽 50분간 빌드/배포 에러 연쇄. 시크릿까지 NEXT_PUBLIC 으로 바꾼 해결 → "지금 보면 안티패턴" 회고 | 중 |
| J5 ? | 2024-03-28 | AI 자소서 코칭: 첨삭 요청과 결과 저장을 연쇄 mutation 으로 | onSuccess 연쇄, 기업별 자소서 문항 JSON. J1 에 합치는 게 나음 | 입~중 |
| J6 ? | 2024-03-29 | 소셜 세션·백엔드 토큰·Recoil 상태 맞추기 | 서버 layout 에서 쿠키로 isLogin → Recoil, recoil-persist, 로그아웃 불일치 수정 | 중 |
| J7 ? | 2024-03-31 | 마감 당일 배포 삽질: rewrites 프록시, http→https, CORS | rewrites 를 켰다 껐다 반복. **겹침: nextjs-cors-error** | 입~중 |
| J8 ? | 2024-03-30 | App Router 에서 OG 이미지가 안 뜰 때: next/head 는 왜 안 먹히나 | generateMetadata 경로 수정 vs `<Head>` 무시. 짧은 TIL | 입 |
| J9 ? | 2024-03-30 | 외부 채용 API(사람인)를 클라이언트에서 서버 컴포넌트로 | useEffect 호출 → page.tsx 서버 fetch (이유 추정) | 입 |
| J10 ? | 2024-03-31 | 해커톤 이미지 다이어트: 배너 63KB → 4.6KB | 이미지 10장 재압축 수치. 단독은 얇음, J2 의 한 섹션 | 입 |

### 예전 Blog 레포 — 블로그 v1/v2 (2024-01 ~ 2025-01, 40커밋, 메시지 빈약·수치 없음)

| ID | 날짜 | 가제 | 요약 | 수준 |
| --- | --- | --- | --- | --- |
| B1 ? | 2024-11-10 | Pages Router + styled-components 를 App Router + SCSS Modules 로 옮기기 | route group 레이아웃, classnames/bind. 일부 겹침: react-styling | 입 |
| B2 ★ | 2025-01-07 | App Router 에서 exit 애니메이션 살리기: FrozenRouter + AnimatePresence | LayoutRouterContext 고정, `key={pathname}`. P10(TransitionLink)과 비교 글로 좋음 | 중 |
| B3 ? | 2025-01-10 | 블로그 글 저장소를 세 번 바꾼 이야기: GitHub raw → Firestore → 정적 JSON | 전환 이유는 커밋에 없음(추정). 지금 마크다운 블로그로 이어지는 회고로 쓸 수 있음 | 입~중 |
| B4 ? | 2025-01-09 | react-markdown + remark-gfm + Prism 본문 렌더러 | 흔한 주제 | 입 |

### Boota 포트폴리오 초기 (2024-06 첫 버전)
2024년 커밋에서 뽑을 만한 단독 후보는 없음 → P20(세 번 갈아엎은 회고)에 포함.

---

## 2. 2025년

| ID | 날짜 | 가제 | 레포 | 요약 | 수준 |
| --- | --- | --- | --- | --- | --- |
| P9 ? | 2025-05-13 | R3F 로 스크롤 따라 모양이 바뀌는 파티클 홈 (GLSL grain, 마우스 회피) | Boota | 포메이션·카메라 lerp, noise grain shader, Raycaster 로 점 밀어내기. 2026 리빌드 때 사라진 버전 | 중 |
| P10 ? | 2025-05-09 | App Router 페이지 전환: TransitionLink 방식 | Boota | 클릭 가로채기 → 1000ms 후 push. B2 와 묶기 | 입~중 |

(2025년은 개인 레포 활동이 적음. B2·B3·B4 도 2025-01)

---

## 3. 2026년 상반기 (~06)

| ID | 날짜 | 가제 | 레포 | 요약 | 수준 |
| --- | --- | --- | --- | --- | --- |
| P11 | 2026-02-02 | Next 14→16, React 18→19 마이그레이션과 레거시 걷어내기 | Boota | params Promise, remotePatterns, eslint flat config, recoil·locomotive·next-pwa·storybook·emotion 제거 | 중 |
| S1 | 2026-05-19 ? | 커플 가계부의 '싱크 점수'와 'Money DNA' 설계 | TongTong BE | DESIGN.md 983줄. 기능은 이후 제거된 듯 | 중 |
| S2 ? | 2026-05-21 | 데모 계정과 이메일 로그인, 로그인 rate limit | TongTong BE | 스토어 심사용 추정 | 입~중 |
| S3 ★ | 2026-05-30 | PgBouncer 트랜잭션 풀링에서 다중통화 이체가 멈춘 이유 | TongTong BE | interactive `$transaction` 안 별도 커넥션 쿼리 → 교착. 환율을 트랜잭션 밖에서 먼저 계산 | 중 |
| A1 ? | 2026-05-24 | Fabric 'child already has a parent' 크래시와 enableScreens(false) 우회 | TongTong App | **겹침: react-native-audit** | 심 |
| A2 | 2026-06-16 | AI 에이전트에게 리팩토링 루프를 맡기고 멈출 때를 정한 기록 | TongTong App | tsc+lint 게이트, 경고 35→0, "안전한 자동 변경이 0 으로 수렴하면 종료", −418줄 | 중 |
| W1 | 2026-06-19 | size-limit 번들 예산 CI 게이트 + Web Vitals 실측 | TongTong Web | 셸 청크 10KB·전체 500KB 예산, 셸 11.13→9.66kB, INP 리포터 | 중 |
| W2 | 2026-06-19 | 5,580줄 지우고 React.memo 가 실제로 먹히게 만든 리팩터링 | TongTong Web | 배럴 컴포넌트 삭제, 인라인 onClick 때문에 memo 무효 → useCallback, 자산 4.3MB 제거 | 중 |
| P12 | 2026-06-22 | 인터랙티브 포트폴리오 렌더링 최적화: rAF 묶기, 시계 격리, 가시성 게이트 | Boota | 5초마다 전체 리렌더하던 시계 분리, useActiveInView | 중 |
| P13 | 2026-06-23 | CSS Modules 에서 전역 @keyframes 참조하면 애니메이션이 멈추는 이유 | Boota | css-loader 가 animation 이름을 해시 스코프 | 입~중 |
| P14 ? | 2026-06-23 | AI 에이전트 10명으로 포트폴리오 만들기: AGENTS.md·역할 문서·handoff | Boota | 회고형 | 입 |
| P15 ? | 2026-06-23 | 크롬 데스크톱 전체화면에서 100vh 가 잘리는 문제 | Boota | 원인 미검증, 지금은 사라진 코드 | 입 |
| F1 ★ | 2026-06-30 | GPS 튐을 거르는 H3 헥사곤 체류 판정: 20초 누적 dwell reducer | Fog | 싱가포르 H3 res10 42,530셀, prevCell 귀속, 정확도 50m 컷, Vitest | 심 |
| F2 ★ | 2026-06-30 | Expo 백그라운드 위치 추적: 포그라운드 watcher 와 OS task 이중 집계 막기 | Fog | 단일 ingest, promise 큐 직렬화, headless 재실행 대비 영속화, 1,453→458줄 | 심 |
| F3 ? | 2026-06-29 | 지도 첫 화면 즉시 띄우기: 캐시 위치 먼저, 정확한 위치로 보정 | Fog | 수치 없음 | 중 |

---

## 4. 2026년 7월

| ID | 날짜 | 가제 | 레포 | 요약 | 수준 |
| --- | --- | --- | --- | --- | --- |
| S4 ★ | 2026-07-07 | 환율 N+1 없애서 159ms → 19ms: 집계 API 최적화 | TongTong BE | buildRateConverter, 160케이스 parity 테스트, JWT 사용자 TTL 캐시, EXPLAIN 스크립트 | 중~심 |
| S5 | 2026-07-04 | db push 에서 prisma migrate 로: 배포를 막은 P3009 사고 | TongTong BE | 베이스라인 후 초안 DDL 중복 → 42710/P3009, 멱등 재작성 | 중 |
| S6 | 2026-07-06 | 고정지출 D-1 리마인더: 받는 사람 현지시간 밤 9시에 한 번만 | TongTong BE (+App A9) | Actions cron + CRON_SECRET, 타임존별 21시, 20시간 dedupe | 중 |
| S7 ? | 2026-07-11 | APM 없이 API 지연 보기: 요청 단위 JSON 로그·readiness·벤치 | TongTong BE | 수치 없음 | 중 |
| S8 ? | 2026-07-01 | 기능을 덜어내는 리팩터: 자산·스냅샷·OCR·목표를 지운 스키마 개편 | TongTong BE | 이유 추정 필요 | 중 |
| S9 ? | 2026-07-03 | 환율 수집 스케줄러와 외부 API rate limit 대응 | TongTong BE | 세부 미확인 | 중 |
| W3 | 2026-07-04 | 대시보드 요청 10개를 3개로: 집계 API 와 환율 계산을 서버로 | TongTong Web (+BE) | /reports/overview, useInfiniteQuery, v2 에서 클라 환율 제거 | 중 |
| W4 ? | 2026-07-07 | TanStack Query 낙관적 업데이트: 무한 스크롤 캐시까지 직접 패치 | TongTong Web | pages 순회 패치 헬퍼 | 중 |
| W5 | 2026-07-10 | i18n 라이브러리 없이 "한국어 원문이 곧 키" + en.json lazy-load | TongTong Web (+App A12) | 64KB en.json 을 en 일 때만 async 청크로 | 중 |
| W6 ? | 2026-07-10 | SPA 흰 화면 없애기: error boundary·포커스 트랩·스켈레톤 | TongTong Web | global-error 인라인 스타일, ₩0 깜빡임 → 동일 치수 스켈레톤 | 중 |
| A3 | 2026-07-07 | 오프라인 캐시부터 낙관적 업데이트까지: 앱의 React Query 운용기 | TongTong App | MMKV 영속화, /reports/home 단일 호출. 일부 **겹침: react-native-audit** | 중 |
| A4 | 2026-07-07 | 3.88 을 입력했는데 388 로 저장됐다: 통화별 소수 자리 | TongTong App | currencyDecimals, 통화별 키패드 | 입~중 |
| A5 ? | 2026-07-11 | 네이티브 의존성 0개 온디바이스 성능 HUD | TongTong App | JS FPS 118, 탭 전환 21–80ms. 인접: react-native-audit | 중 |
| A6 ? | 2026-07-02 | ScrollView 를 FlashList 로 | TongTong App | 수치 없음. 인접: react-native-audit | 중 |
| A7 ? | 2026-07-16 | 가계부 앱 로컬 데이터 지키기: 암호화 MMKV, allowBackup=false config plugin | TongTong App | | 중 |
| A8 ? | 2026-07-04 | 웹과 같은 공식으로: 고정지출을 걷어낸 예산 페이스 계산 | TongTong App | | 중 |
| A9 ? | 2026-07-06 | Expo 푸시: 등록, 탭 라우팅, D-1 리마인더 | TongTong App | S6 과 묶기 | 중 |
| F4 ? | 2026-07-07 | RN 지도 앱 리렌더 최적화: memo 마커, 배열 identity 로 GeoJSON 재업로드 막기 | Fog | 수치 없음 | 중 |
| F5 ★ | 2026-07-18 | MapLibre 로 로우폴리 아이소메트릭 지도: fill-extrusion 건물과 OSM 데이터 굽기 | Fog | pitch 60 고정, 높이 보간, OSM 토지이용 프리베이크 | 심 |
| F6 | 2026-07-08 | 위치 기반 탐험 앱 PRD 부터 출시 준비까지: 1인 + AI 페어 개발 회고 | Fog | 헥사고날 구조, 오프라인 타일, 랜드마크 100개 | 중 |
| H1 ★ | 2026-07-08 | 화면 7개를 지우고 스키마 기반 동적 렌더러 하나로 | Hermes | +1,134/−4,220, `/c/[name]`, 타입 화이트리스트 폴백 | 심 |
| H2 ★ | 2026-07-26 | 필드 타입 순서만으로 레이아웃 정하기: 체크리스트·보드·대시보드 자동 매핑 | Hermes | roles.ts 역할 규약 ↔ 에이전트 SKILL.md | 심 |
| H3 ★ | 2026-07-08 | SSE 실시간 반영: EventSource 헤더 문제를 Route Handler 프록시로, 재연결은 지수 백오프 | Hermes (+BE H7) | | 중~심 |
| H4 ? | 2026-07-08 | Next 16 React Compiler 켜기 + Pretendard Variable dynamic-subset | Hermes | 수치 없음 | 중 |
| H5 ? | 2026-06-16 | `'use cache'` + revalidateTag 로 read-your-writes | Hermes | diff 미확인 | 중 |
| H6 ★ | 2026-07-08 | LLM 에이전트가 스스로 고쳐 재시도하는 API 에러 설계: 허용값을 담은 400 | Hermes_BE | `details.allowed_types` + 재시도 안내, smoke 14케이스 | 심 |
| H7 | 2026-07-08 | 외부 pub/sub 없이 NestJS 인메모리 SSE 브로드캐스터 | Hermes_BE | 15초 ping, `?key=` 인증. H3 과 합치기 | 중 |
| H8 ? | 2026-06-13 | 출력 계약을 코드로: 브리핑 스냅샷 normalize 레이어 | Hermes_BE | | 중 |
| H9 ? | 2026-06-10 | items 템플릿 복제로 API 찍어내기 + CLAUDE.md 로 문서 동기화 강제 | Hermes_BE | | 중 |
| JS1 ★ | 2026-07-18 | 초당 400 이벤트를 메인 스레드 0ms 로: 워커 + 10Hz 고정 스냅샷 | Jetstream | long task 0, 4× 감속에서 frame p95 ≤ 10.1ms | 심 |
| JS2 ★ | 2026-07-18 | 백프레셔 없는 WebSocket 에서 스스로 부하 줄이기 | Jetstream | 투영 이용률 판정, parse 앞 샘플링 게이트, 28배 과부하에도 p95 < 10ms | 심 |
| JS3 | 2026-07-18 | 성능 숫자를 눈으로 받아 적지 않기: 앱 내장 측정 모드 | Jetstream | 60초 창 통계 JSON | 중 |
| JS9 ? | 2026-07-18 | 품질 감사 12건을 배치 5개로 고치기 | Jetstream | | 중 |
| JS10 ? | 2026-07-18 | 색 대비를 실측으로: 빈 상태·장애 상태 디자인 | Jetstream | 2.54:1 → 3.55:1 | 입 |
| P16 | 2026-07-08 | framer-motion 다이어트: LazyMotion strict + `m` + features 비동기 로드 | Boota | 초기 JS 약 15KB gz 감소 | 중 |
| P17 | 2026-07-16 | next/font/google 대신 가변 폰트 직접 서브셋 (+ satori OG 용 정적 TTF) | Boota | 66→46KB, latin-ext 16KB 제거. **인접: nextjs-web-performance 폰트 파트** | 중 |
| P18 | 2026-07-25 | useMediaQuery 하이드레이션 함정: JS 레이아웃 분기를 CSS 미디어쿼리로 | Boota | 데스크톱 전원이 카드 5장 마운트→언마운트, dynamic 청크 5개 낭비 | 중 |
| P19 | 2026-07-25 | JS 가 죽으면 본문이 안 보인다: framer `initial="hidden"` 과 noscript 폴백 | Boota | 홈에 opacity:0 40개 | 중 |
| P21 | 2026-07-25 | 내 포트폴리오를 감사했더니: F-01~F-16 수정기 | Boota | og:image localhost, HSTS, 미참조 477KB, 감사 수치 자기 정정 | 중 |
| P22 ? | 2026-07-10 | 목업 PNG 를 WebP 로: 834KB → 68KB | Boota | 단독은 얇음. 인접: image-pipeline | 입 |
| P23 ? | 2026-07-21 | 토큰 없이는 값도 없다: 포트폴리오의 작은 디자인 시스템 | Boota | | 입~중 |
| D1 ? | 2026-07-12 | 형태를 생성하지 않고 조립한다: 에셋 54종 × 슬롯 30개 3D 책상 디오라마 | desk | **커밋 히스토리 없음(작업 트리만)** | 중 |
| D2 ? | 2026-07-12 | 깨진 JSON 에도 죽지 않는 렌더러: 필드 단위 오류 보고 스키마 | desk | 〃 | 중 |
| D3 ? | 2026-07-12 | 사용자 사진 EXIF/GPS 제거와 검수 플로우 | desk | 〃 | 입~중 |

---

## 5. 2026년 8 ~ 10월

| ID | 날짜 | 가제 | 레포 | 요약 | 수준 |
| --- | --- | --- | --- | --- | --- |
| P24 ★ | 2026-08-03 | 상세 페이지 영상 미리 데우기: detached video + requestIdleCallback 순차 큐 | Boota | 7MB 일괄 → 하나씩 idle, 8초 상한, saveData 게이트 | 심 |
| AS1 ★ | 2026-09-24 | 숫자는 서버가, 문장만 LLM 이: 환각을 걸러내는 AI 자산 브리핑 | Asset | facts.ts 분해 + verify.ts 가 없는 금액·권유·한자 제거 → 재시도 → 규칙 fallback | 심 |
| AS2 ★ | 2026-09-29 | 거래소 키가 주문을 못 하게: 허용목록 HTTP 클라이언트 | Asset | (METHOD, path) 허용목록, 연결 실패만 재시도 | 중 |
| AS3 ★ | 2026-09-23 | IP 허용목록 거래소와 Vercel: 잔고는 로컬, 시세만 서버리스 | Asset | Upbit IP 제한, Hobby cron 제약 | 중 |
| AS4 | 2026-09-23 | REST API 없는 moomoo 를 OpenD + Python 브리지 + launchd 로 | Asset | 주문 메서드 차단, 3초 fail-fast | 중 |
| AS5 | 2026-10-19 | API 로 1년치 자산 그래프 백필: 거래내역 역산과 내 계좌 간 이체 매칭 | Asset | | 중 |
| AS6 | 2026-10-20 | 핀테크 대시보드 UI/UX 감사 16건과 3계층 디자인 토큰·다크 테마 | Asset | 대비 2.6→4.5:1, 터치 34→40px, 원시 색 130개 토큰화 | 중 |
| AS7 | 2026-10-22 | 24시간 손익이 틀렸던 이유: 입출금 수량 변화 빼기 | Asset | | 입~중 |
| AS8 ? | 2026-09-24 | DB 에 안 쓰는 실시간 시세 오버레이 | Asset | | 입~중 |
| P25 ★ | 2026-10-01 | `?v=콘텐츠해시` 로 public 정적 파일에 1년 immutable 캐시 | Boota | hash.mjs, has-query 규칙에만 immutable | 중 |
| P26 ★ | 2026-10-01 | Next.js `experimental.inlineCss` 를 켰다가 끈 이유 | Boota | FCP −110ms 였지만 RSC 에 CSS 80KB 중복, 프리페치 5→80KB ×11. 끈 뒤 LCP 2913→2412ms | 심 |
| P27 | 2026-10-15 | 클라이언트 컴포넌트에 데이터 모듈을 import 하면 생기는 일: RSC 페이로드 다이어트 | Boota | Pick<> 로 필요한 필드만 | 중 |
| S10 ★ | 2026-10-19 | 로컬 thinking LLM 을 서비스에 붙인 세 가지 조건: 스트리밍, 프리필, few-shot | TongTong BE | 터널 100초 524, reasoning 이 4096 토큰 소모 → 프리필로 4분→10초(40배), 중국어 섞임 → few-shot | 심 |
| AQ1 ★ | 2026-10-11 | 털 셸 28겹 상어를 SDF 베이크 + LOD 로: 삼각형 4.7M → 38k | Aqua | draws 49→10, prod long task 0 | 심 |
| AQ2 | 2026-10-11 | 첫 프레임 셰이더 동기 컴파일 150ms 없애기 | Aqua | frameloop never + 12ms 양보 + compileAsync | 중 |
| AQ3 ★ | 2026-10-11 | 링 셰이더 대신 2D 파동방정식으로 '파이는' 물 | Aqua | 256×208 half-float 핑퐁, 90Hz, GPU 6.4→5.13ms | 심 |
| AQ4 | 2026-10-11 | 디오라마를 잡고 흔들면 젤리처럼: 감쇠 스프링과 물 수평 유지 | Aqua | | 중 |
| AQ5 | 2026-10-11 | 실제 1시간 = 라군 하루: 키프레임 13개와 공용 유니폼 낮밤 주기 | Aqua | 재컴파일 없는 라이트 보간 | 중 |
| AQ6 | 2026-10-11 | 수조 생물이 벽 구석에 갇히는 문제와 navsim 재현 | Aqua | | 중 |
| AQ7 | 2026-10-11 | 리조트 손님 커플: 모래 격자 A* + 데크 그래프 + 상태 기계 | Aqua | | 중 |
| AQ8 | 2026-10-11 | Claude Code 스킬로 "목표표 → 10단계 → 캡처·계측" 루프 돌리기 | Aqua | AI 협업 방법론 | 중 |
| AQ12 ? | 2026-10-11 | 산호·열대어 인스턴싱과 alphaMap 밉맵 검정 번짐 | Aqua | | 중 |
| F7 ? | 2026-10-05 | 2D 지도에서 three.js 디오라마로: R3F 싱가포르 미니어처 맵 | Fog | 커밋 1개, 진행 중 실험 | 심 |

---

## 6. 2026년 11월

| ID | 날짜 | 가제 | 레포 | 요약 | 수준 |
| --- | --- | --- | --- | --- | --- |
| W7 ★ | 2026-11-11 | Next.js 정적 export 하나로 웹과 Tauri 2 데스크톱 앱 동시에 내기 | TongTong Web | middleware 제거 → RequireAuth, Supabase PKCE, 딥링크, 트레이, DMG 창 깨짐 수정 | 심 |
| W8 | 2026-11-11 | Tauri 앱 Windows 배포기: NSIS, SmartScreen, 코드 서명 비용 | TongTong Web | Azure 서명 미국·캐나다 한정, OV 연 $150–300 → 무서명 결정 | 중 |
| W9 ★ | 2026-11-17 | Google 로그인 화면에 supabase.co 대신 내 도메인: signInWithIdToken 과 nonce | TongTong Web + App(A11) | 웹·데스크톱·앱 공통 흐름. A11 과 한 글로 | 심 |
| W10 ★ | 2026-11-17 | 한글 웹폰트 삽질기: Google Fonts → next/font → 비동기 CDN → 빌드 타임 서브셋 | TongTong Web | Render Delay ~2.3s, 766KB → 184KB | 중 |
| W11 ★ | 2026-11-22 | "화면은 API 를 모른다": 계약 타입 하나 + fixture/live 이중 데이터 계층 | TongTong Web (+App A10) | ?fx=loading\|error\|empty 미리보기, 하이드레이션 수정 | 심 |
| W12 | 2026-11-19 | "점심 12000 공동" 한 줄로 가계부 쓰기: 순수 함수 파서와 테스트 | TongTong Web | 통화별 소수 자리, 카테고리 추천 | 중 |
| W13 | 2026-11-22 | 테스트 0개 프로젝트에 Jest + Playwright 들이기 (fixture 데이터로 e2e) | TongTong Web | test-kit 리포트 사용 | 중 |
| W14 | 2026-11-17 | 로그인 SPA 에 SEO 붙이기: 공개 페이지 분리, JSON-LD, satori OG | TongTong Web | 크롤러 robots.txt 307 버그, 가이드 8편·계산기 정적 생성 | 중 |
| W15 ? | 2026-11-14 | 하루 예산 계산 버그: 아직 안 나간 고정비를 빼야 했다 | TongTong Web (+BE S14) | | 입 |
| W16 ? | 2026-11-21 | 엑셀 내보내기와 무료 가계부 양식: CSV 에서 xlsx 로 | TongTong Web | S12·A13 과 묶기 | 입 |
| W17 ? | 2026-11-14 | AI 에이전트와 디자인 파이프라인으로 프론트 개발: AGENTS.md·핸드오프·체크리스트 | TongTong Web | | 중 |
| W18 ? | 2026-11-25 | 다크 모드: 첫 페인트 깜빡임 막기와 lime 버튼 위 흰 글씨 사고 | TongTong Web | | 입 |
| W19 ★ | 2026-11-25 | 순자산 트래커에서 부부 가계부로: 7개월, 리브랜딩 네 번의 사이드 프로젝트 회고 | TongTong 전체 | A16(다섯 번 리디자인)과 합치기 | 입 |
| A10 | 2026-11-14 | 화면은 어댑터만 본다: 디자인 리빌드와 API v2 이전을 동시에 버틴 데이터 계층 | TongTong App | W11 과 합치기 | 중~심 |
| A11 | 2026-11-17 | Supabase OAuth 대신 Google id_token + nonce 직접 로그인 (앱) | TongTong App | MMKV 10분 TTL 로 프로세스 kill 대비. W9 와 합치기 | 중 |
| A12 | 2026-11-14 | 한국어 원문을 번역 키로: 앱 i18n 과 조사(을/를) 자동화 | TongTong App | W5 와 합치기 | 중 |
| A13 | 2026-11-22 | 앱에서 엑셀 내려받기: 바이너리 응답과 오류 봉투 함께 다루기 | TongTong App | | 중 |
| A14 ★ | 2026-11-24 | 은행 알림으로 가계부 자동 입력: Android NotificationListener + Headless JS | TongTong App | 6개 은행, 이체 쌍 제거·중복 제거·clientId 멱등, 원문은 기기 밖으로 안 나감, jest 64개 | 심 |
| A15 ★ | 2026-11-17 | 알림 리스너가 프로세스를 살려 둬서 생긴 '끝나지 않는 스플래시' | TongTong App | warm start 에서 effect cleanup 이 타이머 삭제. adb UI dump 로 재현 | 중 |
| A16 ? | 2026-11-21 | 반년 동안 다섯 번 리디자인한 사이드 프로젝트 회고 | TongTong App | W19 와 합치기 | 입~중 |
| A17 ? | 2026-11-24 | 앱 번들에서 폰트 10MB 덜어내기 | TongTong App | 합계 추정 | 입 |
| A18 ? | 2026-11-14 | 키 하나로 고친 Android SVG 크기 고착 버그 | TongTong App | | 입 |
| A19 ? | 2026-11-14 | 숫자 슬롯 애니메이션을 만들었다가 지운 이유 | TongTong App | 이유 불명. 겹침: 숫자 롤링 애니메이션 | 입 |
| A20 ? | 2026-11-24 | HTML 로 스토어 스크린샷과 데모 GIF 자동 생성 | TongTong App | | 입 |
| S11 ★ | 2026-11-14 | 스토어 앱을 깨지 않고 API v2 내기: v1 과 같은 테이블 공유 설계 | TongTong BE | v1 문제 11개 표, categoryId, clientId 멱등, 30일 복구 | 심 |
| S12 | 2026-11-21 | 엑셀 '살아 있는 양식': ExcelJS 수식·드롭다운·시트 보호 | TongTong BE | 3개 스프레드시트 앱 호환 함수만, rate limit | 중 |
| S13 ★ | 2026-11-20 | 정리할 내역 AI 자동 분류: LLM 배치 분류와 맥미니 에이전트 pull 구조 | TongTong BE (+App A14) | 프리필 JSON, 할루시네이션 재처리, HERMES_SECRET fail-closed | 심 |
| S14 ? | 2026-11-21 | 하루 쓸 수 있는 돈 계산식의 변천 | TongTong BE | W15 와 합치기 | 중 |
| P28 ★ | 2026-11-15 | 영어 전용 사이트에 숨은 한글 보기: 텍스트 노드 치환 + MutationObserver | Boota | TreeWalker, IME 중에도 `event.code` 로 "한글" 감지, 사전 동적 import | 심 |
| P29 | 2026-11-08 | 히어로 영상 LCP 지키기: poster preload, 누락 poster, 폴드 아래 영상 정책 | Boota | 876KB 영상 버퍼링까지 빈 히어로, VMAF 메모 | 중 |
| P30 | 2026-11-08 | Chrome 에서 mp4 가 안 나온다: SAR 47:1 과 DEMUXER_ERROR | Boota | 재인코딩 없이 SAR 만 1:1 | 입~중 |
| P20 ★ | 2026-11-25 | 포트폴리오를 세 번 갈아엎은 2년 회고 | Boota | 2024 Swiper → 2025 R3F → SplitText → 2026 handoff 리빌드 | 입 |
| JS4 ★ | 2026-11-11 | 브라우저에서 도는 트렌드 판별 엔진: CMS·Space-Saving·EWMA | Jetstream | 1.4M 이벤트 리플레이 131K ev/s, 점수 p50 3.2ms, 메모리 27MB | 심 |
| JS5 ★ | 2026-11-11 | 상시어가 트렌드로 뜨는 걸 막은 실패 사례 모음 | Jetstream | 포르투갈어 급등, 30계정 복붙, p: 이벤트 독점 | 심 |
| JS6 | 2026-11-11 | 실스트림 녹화·리플레이·합성 주입으로 탐지 알고리즘 검증 | Jetstream | 분당 6건 목표 미달도 기록 | 중 |
| JS7 | 2026-11-13 | 리포스트 증폭 계수 R: ρ 의 모집단을 맞춰야 했던 이유 | Jetstream | 0.90 → 0.181 | 심 |
| JS8 | 2026-11-13 | React 는 마운트만: 커서 150개가 카드를 그리는 스웜 UI | Jetstream | translate3d, clip-path | 중 |
| JS11 ? | 2026-11-14 | 핫패스 할당 줄이기: postMessage 복사·IDB 트랜잭션 쪼개기 | Jetstream | | 중 |
| AQ9 ★ | 2026-11-14 | 전시 4곳으로 늘리기: 디오라마 공용 셸과 정적 병합으로 draws 5229 → 312 | Aqua | | 심 |
| AQ10 ★ | 2026-11-15 | 렌더 예산 안에서 화질 올리기: MSAA HDR 블룸 한 패스 + 자동 해상도 | Aqua | 파리 밤 9.07 → 5.6ms | 심 |
| AQ11 | 2026-11-15 | three.js 없이 넘기는 전시 목록: 포스터에서 실제 장면으로 | Aqua | | 중 |
| AQ13 ? | 2026-11-03 | 수상기 스플라인 경로와 뱅킹·착수 물보라 | Aqua | | 중 |
| O1 ★ | 2026-11-03 | Claude Code hooks 로 에이전트 상태를 3D 사무실에 실시간 표시 | Office | async curl hook, 절대 Claude 를 늦추지 않기 | 중 |
| O2 ★ | 2026-11-08 | hook 에는 토큰 수가 없다: 트랜스크립트로 세션 토큰·비용 집계 | Office | message.id 중복 제거, 스냅샷 전송 | 중 |
| O3 | 2026-11-08 | 같은 리듀서로 라이브와 하루 리플레이: 통계 벽·레벨·가구 해금 | Office | | 중 |
| O4 | 2026-11-03 | 맥미니를 개인 서버로: launchd + Tailscale serve | Office | | 입 |
| ST1 ★ | 2026-11-10 | 모델 API 비용 0원으로 AI 요약 사이트: Actions 수집 → 맥미니 Codex CLI → Deploy Hook | stars | | 중 |
| ST2 ★ | 2026-11-10 | Postgres `for update skip locked` 로 만든 AI 작업 큐 | stars | | 중 |
| ST3 ★ | 2026-11-15 | LLM 요약이 설치 명령을 지어내지 못하게: zod 재검증 + README 원문 대조 | stars | | 중 |
| ST4 ? | 2026-11-15 | 분류 기준을 바꾼 뒤 과거 판정 다시 돌리기 | stars | | 중 |
| ST5 ? | 2026-11-10 | GitHub GraphQL 배치 줄이기와 5xx/429 재시도 | stars | | 입 |
| ST6 ? | 2026-11-10 | 스타 급상승 점수 설계 | stars | | 입 |
| ST7 ? | 2026-11-10 | 맥미니 에이전트(Hermes)에게 주는 인프라 세팅 프롬프트 | stars | | 입 |
| TK1 ★ | 2026-11-19 | Jest 와 Playwright 결과를 한 장의 오프라인 HTML 로: 첫 npm 패키지 | test-kit | tsup 듀얼 빌드, exports 6개 | 중 |
| TK2 | 2026-11-19 | Changesets + GitHub Actions 로 npm 자동 배포 | test-kit | | 입 |
| TK3 ? | 2026-11-19 | 사용자 설정 파일을 고치는 `init`: 모르는 모양이면 건드리지 않기 | test-kit | | 중 |
| M1 ★ | 2026-11-25 | 프론트엔드 개발자가 AI 강의로 4일 만에 다이내믹 NFT 게임 만들기 | Mochimals | 진도표·오답 기록 포함, 테스트 33+176 | 입 |
| M2 | 2026-11-24 | Solidity 첫 테스트: storage 를 memory 로 바꾸면 생기는 버그 | Mochimals | | 입 |
| M3 | 2026-11-24 | 지갑 쓰기 파이프라인: 시뮬레이션 → 서명 → 확정 → 이벤트 → 무효화 | Mochimals | | 중 |
| M4 ★ | 2026-11-25 | 트랜잭션 확정을 기다리다 새로고침하면? | Mochimals | 업계 방식 3가지 비교 | 중 |
| M5 ★ | 2026-11-25 | 인덱서 없이 '내 NFT' 찾기: Transfer 로그 + ownerOf, getLogs 범위 반으로 | Mochimals | anvil multicall3 함정 | 중 |
| M6 | 2026-11-25 | next/og 로 NFT 메타데이터 PNG: SSRF 차단과 data URI | Mochimals | | 중 |
| M7 | 2026-11-25 | 쿠키 읽는 layout 때문에 ISR 이 안 걸릴 때: unstable_cache | Mochimals | | 중 |
| M8 | 2026-11-24 | Python 아트 생성기를 TS 로 포팅하고 기준 SVG 102개와 비교 테스트 | Mochimals | | 중 |
| M9 | 2026-11-25 | 체인 영수증 이벤트를 연출로: XP·레벨업·진화 오버레이 | Mochimals | | 중 |
| M10 ? | 2026-11-24 | wagmi SSR 쿠키 복원과 설정 파일 3개로 나누기 | Mochimals | | 중 |
| M11 ? | 2026-11-24 | Tailwind 를 걷어내고 CSS Modules + SCSS 로 | Mochimals | | 입 |
| M12 ? | 2026-11-25 | baseURI 는 바꿀 수 없다: Base Sepolia 배포 가이드 | Mochimals | 실제 배포 전 | 입 |

---

## 참고

- Boota 포트폴리오에 이미 프로젝트 소개 페이지가 있는 것: work(tethermax, tongtong, jetstream, audit), lab(test-kit, fog, office, charlos=Hermes, island, agent-trends=stars, album, beer-can). 소개 페이지라 블로그 글과 직접 겹치지는 않지만, 블로그 글에서 링크하기 좋음.
- 제외: TongTong App 9921a39 (/me 구독 축소·onlineManager·React Compiler) — react-native-audit 글의 근거 커밋 그 자체.
- 2024-03 ~ 2024-10 사이는 jobterviewee 외에 개인 레포 활동이 거의 없음 (그 시기 작업은 대부분 회사 레포).
