"use client";

import React, { useEffect, useState } from "react";
import styles from "./MarkdownConverter.module.scss";
import cn from "classnames/bind";
import ReactMarkdown, { Components } from "react-markdown";
import gfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Image from "next/image";

const cx = cn.bind(styles);

const MarkDownConverter = ({ text }: { text: string }) => {
  const ClientOnlySyntaxHighlighter: React.FC<{ value: string }> = ({
    value,
  }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    if (!isMounted) {
      return null;
    }

    return (
      <SyntaxHighlighter style={vs} language="tsx">
        {value}
      </SyntaxHighlighter>
    );
  };

  const customRenderers: Components = {
    code: ({ node, className, children, ...props }) => {
      const codeString = String(children);

      return <ClientOnlySyntaxHighlighter value={codeString} />;
    },

    img: ({ src, alt }) => {
      if (src) {
        return (
          <span className={cx("ImageWrapper")}>
            <Image
              src={src}
              alt={alt || ""}
              width={700}
              height={400}
              style={{ width: "800px", height: "auto", margin: "34px auto" }}
            />
          </span>
        );
        return null;
      }
      return null;
    },
  };

  return (
    <div className={cx("MarkDown")}>
      {text && (
        <ReactMarkdown remarkPlugins={[gfm]} components={customRenderers}>
          {text}
        </ReactMarkdown>
      )}
    </div>
  );
};

export default MarkDownConverter;
