---
title: "Vercel 빌드 타임 이미지 변환과 캐싱"
description: Vercel 청구서의 최대 항목이던 이미지 최적화를 빌드 타임 변환으로 옮기고, 원격 이미지는 optimizer에서 빼고, 정적 에셋 캐싱을 바꿔 청구액을 80% 넘게 줄였다.
date: 2024-10-18
tags: [performance, nextjs, images, vercel, case-study]
keywords: [Vercel 이미지 최적화 비용, 이미지 최적화 비용 절감, 빌드 타임 이미지 변환, Vercel image optimization cost, next/image, sharp, AVIF, WebP, Cache-Control immutable]
translatedFrom: en
---

| 지표 | 이전 | 이후 | 비고 |
| --- | --- | --- | --- |
| Vercel 청구액 | — | −80%+ | 변경 후 월 기준 |
| 가장 큰 이미지 | 8.85MB | 2.70MB | 홈 배경, PNG → WebP |
| 원격 이미지 | — | 98 | 최적화에서 제외한 사용처 |

## 배경

Vercel에서 `next/image`는 요청 시점에 이미지를 최적화하고, 원본·너비·품질 조합마다 transformation 한 건으로 과금한다.

- 정적 에셋 상당수가 큰 PNG였고, 몇 MB짜리도 있었다.
- 거래소 로고, 이벤트 배너, 프로필 사진은 S3에 업로드되어 API로 내려왔다. 업로드마다 URL이 새로 생기므로 비용이 트래픽이 아니라 콘텐츠 양에 비례했다.

## 1 · 빌드 타임 변환

배포 전에 `sharp`로 이미지마다 AVIF와 WebP를 만들고 PNG를 fallback으로 남긴다. `<picture>`로 내려주면 브라우저가 지원하는 첫 포맷을 고르고, 요청 시점 변환은 없다.

```js title="After · scripts/images.mjs · simplified" {8-9}
import sharp from "sharp";

// one source in, three files out — once, before deploy
for (const file of sources) {
  const img = sharp(file).resize({ width: MAX_W, withoutEnlargement: true });
  const out = file.replace(/\.png$/, "");

  await img.clone().avif({ quality: 50 }).toFile(`${out}.avif`);
  await img.clone().webp({ quality: 78 }).toFile(`${out}.webp`);
  await img.clone().png({ compressionLevel: 9 }).toFile(`${out}.png`);
}
```

```tsx title="After · OptimizedImage.tsx · simplified" {3-4}
// the browser takes the first format it understands
<picture>
  <source srcSet={`${src}.avif`} type="image/avif" />
  <source srcSet={`${src}.webp`} type="image/webp" />
  <img
    src={`${src}.png`}   // fallback
    // ... width, height, alt, decoding="async"
  />
</picture>
```

## 2 · 원격 이미지

API 이미지는 업로드마다 URL이 새로 생기는데 최적화는 URL 단위로 과금되므로, 비용 대비 이득이 적다. 사이트 전체에 걸던 `unoptimized: true`를 없애고, 원격 이미지를 렌더링하는 98곳에만 `unoptimized`를 붙여 스토리지에서 바로 내려준다.

```tsx title="After · ExchangeList.tsx" {6}
// our assets: optimized at build time
// remote, user-uploaded: served as-is
<Image
  src={item.imagePath}
  // ... width, height, alt
  unoptimized
/>
```

## 3 · 캐싱

- 변환된 파일은 제자리에서 바뀌지 않으므로 `/static/:all*`에 `Cache-Control: public, max-age=31536000, immutable`을 붙였다. 이미지를 바꿀 때는 파일 이름을 바꾼다.
- 공개 데이터는 내장 data cache 대신 인메모리 캐시를 쓰고, 페이지당 API 호출 수를 줄였다. 백엔드가 실패하면 마지막 성공 응답을 돌려준다.

```ts title="After · ssrCache.ts" {6,12}
// public data only — never per-user
const store = new Map<string, { ts: number; data: unknown }>();

export async function ssrCache<T>(key: string, ttl: number, fn: () => Promise<T>) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.ts < ttl) return hit.data as T;
  try {
    const data = await fn();
    store.set(key, { ts: Date.now(), data });
    return data;
  } catch (e) {
    if (hit) return hit.data as T; // stale beats a 500
    throw e;
  }
}
```

## 결과

Vercel 청구액은 80% 넘게 줄었다. 아래는 큰 에셋의 WebP 크기다. AVIF 지원 브라우저는 더 작은 파일을 받는다.

| 에셋 | PNG | WebP | 변화 |
| --- | --- | --- | --- |
| 홈 배경 | 8.85 MB | 2.70 MB | −69% |
| 계산기 일러스트 | 653 KB | 134 KB | −79% |
| 파트너 배너 (EN) | 377 KB | 45 KB | −88% |
| 파트너 배너 (KR) | 363 KB | 37 KB | −90% |
| 로고 코인 | 305 KB | 31 KB | −90% |
| 테이블 배경 | 119 KB | 36 KB | −70% |
