import Seo from "@/components/Seo";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { firestore } from "../../firebase/firebaseAdmin";
import { useRouter } from "next/router";
import { IBlogData } from "@/atoms";
import ReactMarkdown, { Components } from "react-markdown";
import Image from "next/image";
import gfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useEffect, useState } from "react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const snapshot = await firestore.collection("posts").get();

  const data = snapshot.docs.map((doc) => {
    const docData = doc.data();

    return Object.assign(docData, { id: doc.id });
  });

  return {
    props: {
      data,
    },
  };
};

const ClientOnlySyntaxHighlighter: React.FC<{ language: string; value: string }> = ({
  language,
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
    <SyntaxHighlighter style={vs} language={language}>
      {value}
    </SyntaxHighlighter>
  );
};

const customRenderers: Components = {
  code: ({ node, className, children, ...props }) => {
    const codeString = String(children).replace(/\\n/g, "\n").replace(/\n$/, "");

    return <ClientOnlySyntaxHighlighter language={"tsx"} value={codeString} />;
  },

  img: ({ src, alt }) => {
    if (src) {
      return <Image src={src} alt={alt || ""} width={500} height={300} />;
    }
    return null;
  },
};

const Detail = ({ data }: { data: IBlogData[] }) => {
  const router = useRouter();
  const [title] = router.query.params || [];

  return (
    <Wrapper>
      <Seo title={title} />
      <Container></Container>
      <Subject>{data[0].works[0]["202401"][0].title}</Subject>
      <Date>{data[0].works[0]["202401"][0].date}</Date>
      <Main>
        <MarkDownContainer>
          <ReactMarkdown remarkPlugins={[gfm]} components={customRenderers}>
            {data[0].works[0]["202401"][0].content.replace(/\\y/g, "\n")}
          </ReactMarkdown>
        </MarkDownContainer>
      </Main>
    </Wrapper>
  );
};

export default Detail;

const Wrapper = styled.div`
  width: 100vw;
`;

const Container = styled.div``;

const Subject = styled.h2``;

const Date = styled.h2``;

const Main = styled.div``;

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

  code {
    white-space: pre-wrap;
  }
`;
