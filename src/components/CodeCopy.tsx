"use client";

import { useEffect } from "react";

/** 마크다운에 심어진 [data-copy] 버튼의 클릭을 문서 단위로 위임 처리한다. */
export function CodeCopy({ labels }: { labels: { copy: string; copied: string } }) {
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const button = (e.target as Element | null)?.closest<HTMLButtonElement>("button[data-copy]");
      const code = button?.closest("figure")?.querySelector("pre code");
      if (!button || !code) return;
      const text = [...code.querySelectorAll<HTMLElement>("[data-line]")].map((l) => l.textContent ?? "").join("\n");
      try {
        await navigator.clipboard.writeText(text || code.textContent || "");
        button.dataset.copied = "";
        button.setAttribute("aria-label", labels.copied);
        setTimeout(() => {
          delete button.dataset.copied;
          button.setAttribute("aria-label", labels.copy);
        }, 1500);
      } catch {
        /* clipboard 권한 없음: 무시 */
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [labels.copy, labels.copied]);
  return null;
}
