---
title: "Next.js에서 CORS 에러 해결하기"
description: Next.js의 Client side에서 Open API를 호출할 때 생기는 CORS 에러를 next.config.js의 rewrites로 우회하는 방법.
date: 2024-02-16
tags: [nextjs]
keywords: [CORS, Next.js, rewrites, next.config.js, Access-Control-Allow-Origin, proxy, 프록시, Open API, 네이버 API]
---

## 백엔드에서 수정하기

CORS는 원래 서버에서 해결할 문제다. 서버가 응답의 `Access-Control-Allow-Origin` 헤더에 유효한 값을 넣어 주면 된다.

## 프론트에서 수정하기

외부 Open API는 서버를 수정할 수 없으므로 프론트에서 우회한다. `next.config.js`에 `rewrites`를 추가하면 Next.js 서버가 요청을 대신 전달하므로, 브라우저 입장에서는 같은 origin 요청이 된다.

```js title="next.config.js"
const nextConfig = {
  ...

  async rewrites() {
    return [
      {
        source: "/api/:path*", /** 내가 새롭게 부를 API 주소 */
        destination: "https://openapi.naver.com/:path*", /** 기존에 CORS가 발생한 API 주소 */
      },
    ];
  },
};
```

클라이언트에서는 원래 주소 대신 rewrite한 경로로 호출한다.

```ts
const API_URL = {
  GET_LIST: () => "/api/v1/search/book.json",
};

async getList(req: GetListRequest, options?: AjaxOptions) {
  const { data } = await axios.get<GetListResponse>(
    options?.url ?? API_URL.GET_LIST(),
    {
      headers: {
        "X-Naver-Client-Id": process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET,
      },
      params: {
        ...req.query,
      },
    }
  );

  return data;
}
```

> **주의**: `NEXT_PUBLIC_` 으로 시작하는 환경 변수는 브라우저 번들에 그대로 포함된다. 위 코드처럼 Client Secret 을 `NEXT_PUBLIC_` 변수로 두면 누구나 개발자 도구에서 값을 볼 수 있다. Secret 이 필요한 API 라면 rewrites 대신 Route Handler(`app/api/.../route.ts`) 같은 서버 코드에서 `process.env.NAVER_CLIENT_SECRET` 처럼 서버 전용 변수로 헤더를 붙여 호출하는 편이 안전하다.
