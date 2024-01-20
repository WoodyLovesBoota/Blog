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

const Work = ({ data }: { data: IBlogData[] }) => {
  const [sorted, setSorted] =
    useState<[string, { content: string; title: string; date: string; numberDate: number }[]][]>();

  useEffect(() => {
    const temp = Object.entries(data[0].works[0]);
    temp.sort((a, b) => {
      if (Number(a[0]) - Number(b[0]) > 0) return 1;
      else if (Number(a[0]) - Number(b[0]) < 0) return -1;
      else {
        if (a[1][0].numberDate > b[1][0].numberDate) return -1;
        else return 1;
      }
    });
    setSorted(temp);
  }, [data]);

  return (
    <Wrapper>
      <Title>Works</Title>
      <List>
        {sorted &&
          sorted.map((e) => (
            <MonthList key={e[1][0].title}>
              <MonthColumn>{e[0]}</MonthColumn>
              <MainColumn>
                {e[1].map((ele, ind) => (
                  <Link
                    key={ele.date}
                    href={{
                      pathname: `/work/${e[0]}/${ind}`,
                      query: {
                        date: e[0],
                        key: ind,
                      },
                    }}
                  >
                    <BlogContent>
                      <BlogDate>{ele.date}</BlogDate>
                      <BlogName>{ele.title}</BlogName>
                    </BlogContent>
                  </Link>
                ))}
              </MainColumn>
            </MonthList>
          ))}
      </List>
    </Wrapper>
  );
};

export default Work;

const Wrapper = styled.div`
  padding-top: 70px;
  padding-left: 100px;
`;

const Title = styled.h2`
  font-size: 28px;
  font-weight: 300;
`;

const List = styled.div`
  margin-top: 160px;
`;

const MonthList = styled.div`
  display: flex;
`;

const MonthColumn = styled.h2`
  margin-right: 100px;
`;

const MainColumn = styled.div``;

const BlogContent = styled.div`
  margin-bottom: 50px;
`;

const BlogDate = styled.h2`
  font-weight: 200;
  font-size: 14px;
`;

const BlogName = styled.h2`
  font-size: 21px;
  font-weight: 300;
  margin-left: 10px;
`;
