import styled from "styled-components";
import { GetServerSideProps } from "next";
import { firestore } from "../../firebase/firebaseAdmin";
import { IBlogData } from "@/atoms";
import { useEffect, useState } from "react";
import Link from "next/link";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import styles from "../work/index.module.scss";

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
      const entries = Object.entries(item.life[0]).map(([date, posts]) => {
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
      ? Number(date.split(",")[0].split(" ")[1]) + "st"
      : Number(date.split(",")[0].split(" ")[1]) === 2
        ? Number(date.split(",")[0].split(" ")[1]) + "nd"
        : Number(date.split(",")[0].split(" ")[1]) + "rd";
};

const Life = ({ data }: { data: IBlogData[] }) => {
  const [sortedData, setSortedData] = useState<SortedDataType>();

  useEffect(() => {
    setSortedData(processData(data));
  }, [data]);

  return (
    <div className={styles.wrapper}>
      <Seo title="Life" />
      <div>
        {sortedData &&
          sortedData.map((e, i) => (
            <div className={styles.month_list} key={i}>
              <h2>
                {months[Number(e[0].slice(4)) - 1]}, {e[0].slice(0, 4)}
              </h2>
              <div>
                {e[1].map((ele, ind) => (
                  <Link
                    key={ele.date}
                    href={{
                      pathname: `/life/${e[0]}/${ele.numberDate}`,
                      query: {
                        date: e[0],
                        key: ele.numberDate,
                      },
                    }}
                  >
                    <motion.div
                      className={styles.blog}
                      variants={defaultVar}
                      initial="initial"
                      animate="animate"
                      whileHover={"hover"}
                    >
                      <h3>{changeDate(ele.date)}</h3>
                      <motion.h2 variants={titleVar}>{ele.title}</motion.h2>
                      <motion.div className={styles.circle} variants={circleVar} />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Life;

const Wrapper = styled.div`
  padding-top: 200px;
  padding-left: 100px;
  padding-right: 100px;
  padding-bottom: 100px;
`;

const List = styled.div`
  /* margin-top: 160px; */
`;

const Circle = styled(motion.div)`
  width: 5px;
  height: 5px;
  background-color: black;
  position: absolute;
  top: 25px;
  left: 0;
  border-radius: 100px;
  opacity: 0;
`;

const MonthList = styled.div`
  display: flex;
  border-top: 0.5px solid black;
  padding-top: 50px;
`;

const MonthColumn = styled.h2`
  margin-right: 100px;
`;

const MainColumn = styled.div``;

const BlogContent = styled(motion.div)`
  padding-bottom: 80px;
  position: relative;
`;

const BlogDate = styled.h2`
  font-weight: 200;
  font-size: 14px;
`;

const BlogName = styled(motion.h2)`
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

const defaultVar = {
  initial: {},
  animate: {},
  hover: {},
};

const titleVar = {
  initial: {},
  animate: {},
  hover: { color: "#ff0000", transition: { duration: 0.5, delay: 0.1 } },
};

const circleVar = {
  initial: { opacity: 0 },
  animate: { opacity: 0 },
  hover: { opacity: 0.5, transition: { duration: 0.5, delay: 0.1 } },
};
