import { ogSize, siteOgImage } from "@/views/og";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return siteOgImage("en");
}
