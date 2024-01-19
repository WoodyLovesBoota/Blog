import Image from "next/image";
import React, { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import styled from "styled-components";

const MarkdownRenderer = () => {
  const [markdown, setMarkdown] = useState("");

  const customRenderers: Components = {
    img: ({ src, alt }) => {
      if (src) {
        return <Image src={src} alt={alt || ""} width={500} height={300} />;
      }
      return null;
    },
  };

  return (
    <div>
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="Enter Markdown text"
      />
      <MarkDownContainer>
        <ReactMarkdown components={customRenderers}>{markdown}</ReactMarkdown>
      </MarkDownContainer>
    </div>
  );
};

export default MarkdownRenderer;

const MarkDownContainer = styled.div`
  h1 {
    color: #333;
    font-size: 2em;
    margin-bottom: 0.5em;
  }

  h2 {
    color: #666;
    font-size: 1.5em;
    margin-bottom: 0.5em;
  }

  p {
    color: #444;
    margin-bottom: 1em;
  }

  a {
    color: #0066cc;
    text-decoration: none;
  }

  ul {
    padding-left: 20px;
  }

  li {
    margin-bottom: 0.5em;
  }
`;
