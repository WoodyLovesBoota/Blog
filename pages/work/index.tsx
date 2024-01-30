import { GetServerSideProps } from "next";
import { firestore } from "../../firebase/firebaseAdmin";
import { IBlogData } from "@/atoms";
import { useEffect, useState } from "react";
import Link from "next/link";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import styles from "./index.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(styles);

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
      ? Number(date.split(",")[0].split(" ")[1]) + "st"
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
    <div className={cx("Wrapper")}>
      <Seo title="Work" />
      <div>
        {sortedData &&
          sortedData.map((e, i) => (
            <div className={cx("MonthList")} key={i}>
              <h2>
                {months[Number(e[0].slice(4)) - 1]}, {e[0].slice(0, 4)}
              </h2>
              <div>
                {e[1].map((ele) => (
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
                    <motion.div
                      className={cx("Blog")}
                      variants={defaultVar}
                      initial="initial"
                      animate="animate"
                      whileHover={"hover"}
                    >
                      <h3>{changeDate(ele.date)}</h3>
                      <motion.h2 variants={titleVar}>{ele.title}</motion.h2>
                      <motion.div className={cx("Circle")} variants={circleVar} />
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

export default Work;

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
