"use client";

import React from "react";
import cn from "classnames/bind";
import styles from "./Detail.view.module.scss";
import MarkDownConverter from "@/components/MarkdownConverter/MarkdownConverter";

const cx = cn.bind(styles);

const Dummy =
  '#### indroduction\n\nNext JS 의 Client side 에서 API 호출할때 CORS 에러가 발생한다면\n\n---\n\n### 백엔드에서 수정하기\n\n원래대로라면 백엔드에서 해결해야 하는 문제이다. \n서버에서 Access-Control-Allow-Origin 헤더에 유효한 값을 포함하여 응답을 보내주면 해결할 수 있다.\n\n### 프론트에서 수정하기\n\nOpen API 를 사용하는 과정에서 CORS가 발생하게 되면 백엔드에서 수정할수가 없기 때문에 프론트 단에서 임시로 수정해야 한다. \n\n`next.config.js` 에 `rewrites` 함수 추가\n```tsx\nconst nextConfig = {\n  \n  ...\n  \n async rewrites() {\n    return [\n      {\n        source: "/api/:path*",   /** 내가 새롭게 부를 API 주소 */\n                 destination: "https://openapi.naver.com/:path*",   /** 기존에 CORS가 발생한 API 주소 */\n      },\n    ];\n  },\n};\n```\n\nAPI 호출 주소 변경\n\n```tsx\n\nconst GET_LIST: () => "/api/v1/search/book.json",\n\n\nasync getList(req: GetListRequest, options?: AjaxOptions) {\n    const { data } = await axios.get<GetListResponse>(\n      options?.url ?? API_URL.GET_LIST(),\n      {\n        headers: {\n          "X-Naver-Client-Id": process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,\n          "X-Naver-Client-Secret": process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET,\n        },\n        params: {\n          ...req.query,\n        },\n      }\n    );\n\n    return data;\n  }\n```';

const getCategories = (text: string) => {
  const categories: string[] = [];
  const lines = text.split("\n");

  lines.forEach((line) => {
    if (line.startsWith("####") || line.startsWith("###")) {
      categories.push(line.replace(/^[#]+\s/, "").trim());
    }
  });

  return categories;
};

const categories = getCategories(Dummy);

const DetailView = () => {
  return (
    <div className={cx("Wrapper")}>
      <header className={cx("Header")}>
        <h1 className={cx("Title")}>Next.js에서 CORS 에러 해결하기</h1>
      </header>
      <div className={cx("Content")}>
        <div className={cx("MarkDownWrapper")}>
          <MarkDownConverter text={Dummy} />
        </div>
        <div className={cx("TagWrapper")}>
          <section className={cx("TagSection")}></section>
          <section className={cx("ContentSection")}>
            {categories.map((category) => (
              <div className={cx("Tag")}>{category}</div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DetailView;
