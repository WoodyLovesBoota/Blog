import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import { t as dict, type Lang } from "./i18n";

const copyIcon: Element = {
  type: "element",
  tagName: "svg",
  properties: { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", ariaHidden: "true" },
  children: [
    { type: "element", tagName: "rect", properties: { x: "9", y: "9", width: "11", height: "11", rx: "2" }, children: [] },
    { type: "element", tagName: "path", properties: { d: "M5 15V5a2 2 0 0 1 2-2h10" }, children: [] },
  ],
};

/** 코드블록 figure 에 복사 버튼을 심는다. 클릭 처리는 <CodeCopy /> 가 위임으로 담당. */
const rehypeCopyButton = (label: string) => (tree: Root) => {
  visit(tree, "element", (node) => {
    if (node.tagName !== "figure" || !("data-rehype-pretty-code-figure" in node.properties)) return;
    const button: Element = {
      type: "element",
      tagName: "button",
      properties: { type: "button", className: ["code-copy"], ariaLabel: label, dataCopy: "" },
      children: [structuredClone(copyIcon)],
    };
    const caption = node.children.find(
      (c): c is Element => c.type === "element" && c.tagName === "figcaption",
    );
    if (caption) {
      caption.children = [{ type: "element", tagName: "span", properties: { className: ["code-title"] }, children: caption.children }, button];
    } else {
      node.children.unshift(button);
    }
  });
};

/** 외부 링크는 새 탭 + noopener */
const rehypeExternalLinks = () => (tree: Root) => {
  visit(tree, "element", (node) => {
    const href = node.properties.href;
    if (node.tagName === "a" && typeof href === "string" && /^https?:\/\//.test(href)) {
      node.properties.target = "_blank";
      node.properties.rel = ["noopener", "noreferrer"];
    }
  });
};

const makeProcessor = (lang: Lang) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype) // raw HTML 은 렌더링하지 않는다 (allowDangerousHtml: false)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: "material-theme-darker",
      keepBackground: false,
      defaultLang: { block: "plaintext" },
    })
    .use(rehypeCopyButton, dict(lang).copyCode)
    .use(rehypeExternalLinks)
    .use(rehypeStringify);

const processors = new Map<Lang, ReturnType<typeof makeProcessor>>();

export const renderMarkdown = async (md: string, lang: Lang) => {
  if (!processors.has(lang)) processors.set(lang, makeProcessor(lang));
  return String(await processors.get(lang)!.process(md));
};
