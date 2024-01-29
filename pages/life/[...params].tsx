import Seo from "@/components/Seo";
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
import styles from "../work/params.module.scss";

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
        <span className={styles.image_wrapper}>
          <Image src={src} alt={alt || ""} width={700} height={400} style={{ width: "100%", height: "100%" }} />
        </span>
      );
    }
    return null;
  },
};

const Detail = ({ data }: { data: IBlogData[] }) => {
  const router = useRouter();
  const [date, key] = router.query.params || [];
  const currentPost = data[0].life[0][date][data[0].life[0][date].findIndex((e) => e.numberDate === Number(key))];

  const nextPost = Object.values(data[0].life[0]).flat()[
    Object.values(data[0].life[0])
      .flat()
      .findIndex((e) => e.order === (Number(currentPost.order) + 1).toString())
  ];

  const prevPost = Object.values(data[0].life[0]).flat()[
    Object.values(data[0].life[0])
      .flat()
      .findIndex((e) => e.order === (Number(currentPost.order) - 1).toString())
  ];

  if (!currentPost) {
    return <div className={styles.wrapper}>현재 페이지를 불러올 수 없습니다.</div>;
  }

  return (
    <motion.div className={styles.wrapper} variants={fadeVar} initial="initial" animate="animate">
      <Seo title={currentPost.title} />
      <div className={styles.container}>
        <h1>{currentPost.title}</h1>
        <h4>{currentPost.date}</h4>
        <div className={styles.main}>
          <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[gfm]} components={customRenderers}>
              {currentPost.content.replace(/\\y/g, "\n")}
            </ReactMarkdown>
          </div>
        </div>
        <div className={styles.footer}>
          {nextPost && (
            <button className={styles.prev}>
              <Link
                href={{
                  pathname: `/life/${getMonth(nextPost.date)}/${nextPost.numberDate}`,
                  query: {
                    date: getMonth(nextPost.date),
                    key: nextPost.numberDate,
                  },
                }}
              >
                PREV
              </Link>
            </button>
          )}
          {prevPost && (
            <button className={styles.next}>
              <Link
                href={{
                  pathname: `/life/${getMonth(prevPost.date)}/${prevPost.numberDate}`,
                  query: {
                    date: getMonth(prevPost.date),
                    key: prevPost.numberDate,
                  },
                }}
              >
                NEXT
              </Link>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Detail;

const fadeVar = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1, delay: 0.5 } },
};
