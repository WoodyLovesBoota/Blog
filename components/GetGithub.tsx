import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Seo from "@/components/Seo";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { IBlogData } from "@/atoms";
import ReactMarkdown, { Components } from "react-markdown";
import Image from "next/image";
import gfm from "remark-gfm";
import prettier from "prettier/standalone";
import typescriptParser from "prettier/parser-typescript";

const GitHubCodeViewer: React.FC<{ url: string }> = ({ url }) => {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const text = await response.text();
          setCode(text);
        } else {
          throw new Error("Failed to fetch code");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchCode();
  }, [url]);

  const customRenderers: Components = {
    p: ({ children, className }) => {
      return (
        <SyntaxHighlighter style={solarizedlight} language={"typescript"} PreTag="code">
          {String(children) || ""}
        </SyntaxHighlighter>
      );
    },

    img: ({ src, alt }) => {
      if (src) {
        return <Image src={src} alt={alt || ""} width={500} height={300} />;
      }
      return null;
    },
  };

  return (
    <Wrapper>
      <pre>
        <ReactMarkdown remarkPlugins={[gfm]} components={customRenderers}>
          {code}
        </ReactMarkdown>
      </pre>
    </Wrapper>
  );
};

export default GitHubCodeViewer;

const Wrapper = styled.div`
  background-color: yellow;
`;
