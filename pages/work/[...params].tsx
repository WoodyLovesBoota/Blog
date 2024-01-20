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
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
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

const ClientOnlySyntaxHighlighter: React.FC<{ value: string }> = ({ value }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <SyntaxHighlighter style={dracula} language="tsx">
      {value}
    </SyntaxHighlighter>
  );
};

const customRenderers: Components = {
  code: ({ node, className, children, ...props }) => {
    const codeString = String(children).replace(/\\n/g, "\n").replace(/\n$/, "");

    return <ClientOnlySyntaxHighlighter value={codeString} />;
  },

  img: ({ src, alt }) => {
    if (src) {
      return (
        <ImageWrapper>
          <Image
            src={src}
            alt={alt || ""}
            width={700}
            height={400}
            style={{ width: "100%", height: "100%" }}
          />
        </ImageWrapper>
      );
    }
    return null;
  },
};

const Detail = ({ data }: { data: IBlogData[] }) => {
  const router = useRouter();
  const [date, key] = router.query.params || [];

  return (
    <Wrapper>
      <Seo title={key} />
      <Container>
        <Subject>{data[0].works[0][date][Number(key)].title}</Subject>
        <Date>{data[0].works[0][date][Number(key)].date}</Date>
        <Main>
          <MarkDownContainer>
            <ReactMarkdown remarkPlugins={[gfm]} components={customRenderers}>
              {data[0].works[0][date][Number(key)].content.replace(/\\y/g, "\n")}
            </ReactMarkdown>
          </MarkDownContainer>
        </Main>
      </Container>
    </Wrapper>
  );
};

export default Detail;

const Wrapper = styled.div`
  width: 100vw;
`;

const Container = styled.div`
  padding: 150px 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Subject = styled.h2`
  font-size: 36px;
  font-weight: 400;
  text-align: center;
  letter-spacing: 2px;
`;

const Date = styled.h2`
  font-size: 12px;
  font-weight: 300;
  color: lightgray;
  margin-top: 10px;
  text-align: center;
  margin-bottom: 50px;
  letter-spacing: 1px;
`;

const Main = styled.div`
  padding-top: 50px;
  width: 1080px;
`;

const MarkDownContainer = styled.div`
  * {
    margin: 15px 0;
  }
  h1 {
    font-size: 36px;
    font-weight: 200;
  }

  h2 {
    font-size: 24px;
    font-weight: 400;
    margin: 15px 0;
    margin-top: 50px;
  }

  p {
    font-size: 14px;
    font-weight: 300;
    line-height: 2;
    letter-spacing: 0.8px;
    color: #666666;
  }

  a {
  }

  ul {
  }

  li {
    font-size: 14px;
    font-weight: 300;
    line-height: 2;
    letter-spacing: 0.8px;
    margin: 15px 0;
    color: #666666;
  }

  code {
    box-shadow: 2px 25px 40px 0 rgba(0, 0, 0, 0.15);
    span {
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5;
      letter-spacing: 1px;
      word-spacing: 3px;
      color: white;
      display: inline;
    }
    white-space: pre-wrap;
  }

  img {
    display: block;
    box-shadow: 2px 25px 40px 0 rgba(0, 0, 0, 0.15);
  }
`;

const ImageWrapper = styled.span`
  width: 100%;
  height: 607px;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.03);

  display: flex;
  justify-content: center;
  align-items: center;
`;
