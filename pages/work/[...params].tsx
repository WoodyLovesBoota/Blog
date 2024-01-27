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
import { motion } from "framer-motion";
import Link from "next/link";

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

const getMonth = (mon: string): string => {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  let month =
    Number(months.indexOf(mon.split(" ")[0]) + 1) < 10
      ? "0" + String(Number(months.indexOf(mon.split(" ")[0]) + 1))
      : String(Number(months.indexOf(mon.split(" ")[0]) + 1));
  let year = mon.slice(8);
  return year.toString() + month.toString();
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
          <Image src={src} alt={alt || ""} width={700} height={400} style={{ width: "100%", height: "100%" }} />
        </ImageWrapper>
      );
    }
    return null;
  },
};

const Detail = ({ data }: { data: IBlogData[] }) => {
  const router = useRouter();
  const [date, key] = router.query.params || [];
  const currentPost = data[0].works[0][date][data[0].works[0][date].findIndex((e) => e.numberDate === Number(key))];

  const nextPost = Object.values(data[0].works[0]).flat()[
    Object.values(data[0].works[0])
      .flat()
      .findIndex((e) => e.order === (Number(currentPost.order) + 1).toString())
  ];

  const prevPost = Object.values(data[0].works[0]).flat()[
    Object.values(data[0].works[0])
      .flat()
      .findIndex((e) => e.order === (Number(currentPost.order) - 1).toString())
  ];

  if (!currentPost) {
    return <Wrapper>현재 페이지를 불러올 수 없습니다.</Wrapper>;
  }

  return (
    <Wrapper variants={fadeVar} initial="initial" animate="animate">
      <Seo title={currentPost.title} />
      <Container>
        <Subject>{currentPost.title}</Subject>
        <Date>{currentPost.date}</Date>
        <Main>
          <MarkDownContainer>
            <ReactMarkdown remarkPlugins={[gfm]} components={customRenderers}>
              {currentPost.content.replace(/\\y/g, "\n")}
            </ReactMarkdown>
          </MarkDownContainer>
        </Main>
        <Footer>
          {nextPost && (
            <PrevButton>
              <Link
                href={{
                  pathname: `/work/${getMonth(nextPost.date)}/${nextPost.numberDate}`,
                  query: {
                    date: getMonth(nextPost.date),
                    key: nextPost.numberDate,
                  },
                }}
              >
                PREV
              </Link>
            </PrevButton>
          )}
          {prevPost && (
            <NextButton>
              <Link
                href={{
                  pathname: `/work/${getMonth(prevPost.date)}/${prevPost.numberDate}`,
                  query: {
                    date: getMonth(prevPost.date),
                    key: prevPost.numberDate,
                  },
                }}
              >
                NEXT
              </Link>
            </NextButton>
          )}
        </Footer>
      </Container>
    </Wrapper>
  );
};

export default Detail;

const Wrapper = styled(motion.div)`
  width: 100vw;
`;

const Container = styled.div`
  padding: 150px 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-bottom: 100px;
`;

const Subject = styled.h2`
  font-size: 36px;
  font-weight: 400;
  text-align: center;
  letter-spacing: 2px;
  color: black;
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
  padding-bottom: 150px;
`;

const Footer = styled.div`
  width: 1080px;
  margin-top: auto;
  display: flex;
  justify-content: space-between;
`;

const NextButton = styled.button`
  margin-left: auto;
  background-color: transparent;
  a {
    font-size: 16px;
    font-weight: 400;
  }
  &:hover {
    color: #ff0000;
  }
  transition: color 0.3s ease-in-out;
`;

const PrevButton = styled.button`
  margin-right: auto;
  background-color: transparent;
  a {
    font-size: 16px;
    font-weight: 400;
  }
  &:hover {
    color: #ff0000;
  }
  transition: color 0.3s ease-in-out;
`;

const MarkDownContainer = styled.div`
  * {
    margin: 15px 0;
  }

  h1 {
    color: black;
    font-size: 32px;
    font-weight: 400;
    margin: 20px 0;
  }

  h2 {
    color: black;
    font-size: 24px;
    font-weight: 400;
    margin: 15px 0;
  }

  h3 {
    color: black;
    font-size: 18px;
    font-weight: 300;
  }

  strong {
    color: black;
    font-size: 14px;
    font-weight: 400;
  }

  p {
    font-size: 14px;
    font-weight: 300;
    line-height: 2;
    letter-spacing: 0.8px;
    color: #666666;
  }

  a {
    font-size: 14px;
    font-weight: 500;
    line-height: 2;
    letter-spacing: 0.8px;
    color: #6363f1;
  }

  ul {
    background-color: #f2f2f2;
  }

  ol {
    background-color: #f2f2f2;
  }

  li {
    font-size: 14px;
    font-weight: 300;
    line-height: 2;
    letter-spacing: 0.8px;
    margin: 15px 0;
    font-style: italic;
    margin-left: 20px;
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
    border-radius: 6px;
  }
`;

const ImageWrapper = styled.span`
  width: 100%;
  height: auto;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.03);

  display: flex;
  justify-content: center;
  align-items: center;
`;

const fadeVar = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1, delay: 0.5 } },
};
