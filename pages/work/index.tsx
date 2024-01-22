import styled from "styled-components";
import { GetServerSideProps } from "next";
import { firestore } from "../../firebase/firebaseAdmin";
import { IBlogData } from "@/atoms";
import { useEffect, useState } from "react";
import Link from "next/link";
import Seo from "@/components/Seo";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

const processData = (data: IBlogData[]): SortedDataType => {
  return data
    .map((item) => {
      const entries = Object.entries(item.works[0]).map(([date, posts]) => {
        const sortedPosts = posts.sort((a, b) => b.numberDate - a.numberDate);
        return [date, sortedPosts] as [string, typeof sortedPosts];
      });

      entries.sort((a, b) => {
        const dateA = Number(a[0]);
        const dateB = Number(b[0]);
        return dateB - dateA;
      });

      return entries;
    })
    .flat();
};

const changeDate = (date: string) => {
  return Number(date.split(",")[0].split(" ")[1]) > 3
    ? Number(date.split(",")[0].split(" ")[1]) + "th"
    : Number(date.split(",")[0].split(" ")[1]) === 1
      ? date.split(",")[0].split(" ")[1] + "st"
      : Number(date.split(",")[0].split(" ")[1]) === 2
        ? Number(date.split(",")[0].split(" ")[1]) + "nd"
        : Number(date.split(",")[0].split(" ")[1]) + "rd";
};

const Work = ({ data }: { data: IBlogData[] }) => {
  const [sortedData, setSortedData] = useState<SortedDataType>();

  useEffect(() => {
    setSortedData(processData(data));
  }, [data]);

  return (
    <Wrapper>
      <Seo title="Work" />
      <Title>Work</Title>
      <List>
        {sortedData &&
          sortedData.map((e, i) => (
            <MonthList key={i}>
              <MonthColumn>
                {months[Number(e[0].slice(4)) - 1]}, {e[0].slice(0, 4)}
              </MonthColumn>
              <MainColumn>
                {e[1].map((ele, ind) => (
                  <Link
                    key={ele.date}
                    href={{
                      pathname: `/work/${e[0]}/${ele.numberDate}`,
                      query: {
                        date: e[0],
                        key: ele.numberDate,
                      },
                    }}
                  >
                    <BlogContent>
                      <BlogDate>{changeDate(ele.date)}</BlogDate>
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
  padding-top: 200px;
  padding-left: 100px;
  padding-bottom: 100px;
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
  margin-bottom: 80px;
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

type SortedDataType = [
  string,
  {
    title: string;
    date: string;
    content: string;
    numberDate: number;
  }[],
][];
