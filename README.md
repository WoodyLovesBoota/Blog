# woody.dev

Next.js 16 · 정적 생성 마크다운 블로그

## 글 쓰기

`content/posts/<slug>.md` 파일 하나 = 글 하나. 파일명이 URL(`/posts/<slug>`)이 된다.

### 다국어 (한국어 기본 + 영어)

| 파일 | URL |
| --- | --- |
| `content/posts/<slug>.md` | `/ko/posts/<slug>` (한국어) |
| `content/posts/<slug>.en.md` | `/posts/<slug>` (영어, 기본 언어) |

- 두 언어가 같은 slug 를 쓴다. 한쪽만 있어도 된다 (없는 언어의 목록·RSS·sitemap 에는 안 나온다).
- `date`, `updated`, `tags`, `image` 는 글 단위로 공유한다. 한국어 파일 값이 우선이고, `.en.md` 에는 생략해도 된다.
- `title`, `description`, `keywords`, `draft`, `aiDraft` 는 언어별.
- 번역본에는 `translatedFrom: ko` (또는 `en`) 를 넣으면 글 하단에 번역 표기가 붙는다.
- UI 문구는 `src/lib/i18n.ts` 의 `dict`. 라우트는 `src/app/(en)` 과 `src/app/(ko)/ko` 가 같은 `src/views/*` 를 언어만 바꿔 쓴다.
- hreflang·canonical·sitemap alternates·언어별 RSS(`/rss.xml` 영어, `/ko/rss.xml` 한국어). 예전 `/en/*` 주소는 `/*` 로 영구 리다이렉트는 자동.
frontmatter 형식은 [`content/posts/_template.md`](content/posts/_template.md) 참고.

| 필드 | 필수 | 용도 |
| --- | --- | --- |
| `title` | ✓ | h1, `<title>`, OG |
| `description` | ✓ | meta description, OG, RSS |
| `date` | ✓ | 발행일, 정렬 |
| `updated` | | 수정일 (article:modified_time, sitemap) |
| `tags` | | 태그 페이지, 검색 |
| `keywords` | | meta keywords, 검색 보조 |
| `image` | | OG 이미지 직접 지정 (없으면 자동 생성) |
| `draft` | | `true` 면 프로덕션 빌드에서 제외 |
| `aiDraft` | | 글 하단 "AI 초안 + 검수" 표기 |
| `translatedFrom` | | 번역본이면 원문 언어 (`ko`/`en`) |

이미지는 `public/images/` 에 두고 `/images/...` 로 참조.

## 개발

```bash
pnpm dev
pnpm build   # Vercel 밖에서 빌드하면 NEXT_PUBLIC_SITE_URL 을 배포 도메인으로 설정
```
