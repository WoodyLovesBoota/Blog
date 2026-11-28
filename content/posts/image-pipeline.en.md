---
title: "Build-time image conversion and caching on Vercel"
description: Image optimization was the largest item on our Vercel bill. Moving conversion to build time, taking remote images out of the optimizer and changing static asset caching cut the bill by more than 80%.
date: 2024-10-18
tags: [performance, nextjs, images, vercel, case-study]
keywords: [Vercel image optimization cost, next/image, sharp, AVIF, WebP, build-time image conversion, Cache-Control immutable]
---

| Metric | Before | After | Note |
| --- | --- | --- | --- |
| Vercel bill | — | −80%+ | Monthly, after the changes |
| Largest image | 8.85MB | 2.70MB | Home background, PNG → WebP |
| Remote images | — | 98 | Call sites excluded from optimization |

## Background

On Vercel, `next/image` optimizes images on request and bills each unique combination of source, width and quality as a transformation.

- Many static assets were large PNGs, some of them several megabytes.
- Exchange logos, event banners and profile photos were uploaded to S3 and returned by the API. Each upload gets a new URL, so the cost grew with the amount of content, not with traffic.

## 1 · Build-time conversion

Before deploy, `sharp` converts each image to AVIF and WebP and keeps the PNG as a fallback. The page serves them through `<picture>`, so the browser picks the first format it supports and nothing is transformed at request time.

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

## 2 · Remote images

API images get a new URL with every upload, and optimization is billed per URL, so the benefit is small for the cost. I removed the site-wide `unoptimized: true` and marked only the 98 places that render remote images with `unoptimized`, so they are served directly from storage.

```tsx title="After · ExchangeList.tsx" {6}
// our assets: optimized at build time
// remote, user-uploaded: served as-is
<Image
  src={item.imagePath}
  // ... width, height, alt
  unoptimized
/>
```

## 3 · Caching

- Converted files don't change in place, so `/static/:all*` is served with `Cache-Control: public, max-age=31536000, immutable`. To update an image, give it a new file name.
- Public data uses an in-memory cache instead of the built-in data cache, with fewer API calls per page. If the backend fails, the cache returns the last successful response.

```ts title="After · ssrCache.ts" {10,16}
// public data only — never per-user
const store = new Map<string, { ts: number; data: unknown }>();

export async function ssrCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
) {
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

## Results

The Vercel bill went down by more than 80%. The table shows WebP sizes for the largest assets. Browsers that support AVIF get smaller files.

| Asset | PNG | WebP | Change |
| --- | --- | --- | --- |
| Home background | 8.85 MB | 2.70 MB | −69% |
| Calculator illustration | 653 KB | 134 KB | −79% |
| Partner banner (EN) | 377 KB | 45 KB | −88% |
| Partner banner (KR) | 363 KB | 37 KB | −90% |
| Logo coin | 305 KB | 31 KB | −90% |
| Table background | 119 KB | 36 KB | −70% |
