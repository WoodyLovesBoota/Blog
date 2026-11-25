import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" }, // /search 는 페이지 meta 로 noindex
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
