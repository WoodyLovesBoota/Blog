---
# 파일명이 URL 이 된다: content/posts/my-post.md → /posts/my-post
# "_" 로 시작하는 파일은 무시된다 (이 템플릿처럼).
# 영어판은 같은 이름에 .en.md (my-post.en.md → /en/posts/my-post). date·tags·image 는 한국어 파일 값을 공유.
title: 글 제목
description: 검색 결과와 공유 카드에 보일 한두 문장 요약
date: 2026-11-25
# updated: 2026-11-30
tags: [nextjs, react]
keywords: [검색에 걸렸으면 하는 단어, 영문 표기]
# image: /images/my-post/cover.png   # 없으면 OG 이미지 자동 생성
# draft: true                        # 개발 서버에서만 보임
# translatedFrom: ko                 # 번역본이면 원문 언어
# aiDraft: true                      # 하단에 "Claude가 초안을 쓰고 … 검수" 표기
---

본문은 `##` 부터 쓴다 (`#` 제목은 frontmatter title 이 h1 으로 들어감).

## 코드블록

```ts title="src/lib/example.ts" showLineNumbers {3}
export function add(a: number, b: number) {
  // 하이라이트할 줄은 {3}, 범위는 {3-5}
  return a + b;
}
```

이미지는 `public/images/` 아래 두고 `![설명](/images/파일.png)` 로 쓴다.
