"use client";

import React, { useEffect, useState } from "react";
import cn from "classnames/bind";
import styles from "./Detail.view.module.scss";
import MarkDownConverter from "@/components/MarkdownConverter/MarkdownConverter";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import useScroll from "@/components/hooks/scroll/useScroll";

const cx = cn.bind(styles);

interface IDetailViewProps {
  id: string;
}

const blogData = require("/public/static/assets/blog.json");

const DetailView = (props: IDetailViewProps) => {
  const { id } = props;
  const [markdown, setMarkdown] = useState("");
  useEffect(() => {
    const fetchData = () => {
      fetch(blogData.tech.find((item: any) => item.id === Number(id)).content)
        .then((res) => res.text())
        .then((data) => setMarkdown(data));
    };
    fetchData();
  }, [id, blogData]);

  return (
    <div className={cx("Wrapper")}>
      <header className={cx("Header")}>
        <section className={cx("TitleSection")}>
          <motion.div
            key={"title"}
            className={cx("TitleWrapper")}
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className={cx("Title")}>
              BLpictoW PAST YOUR CONTENT BpictoTTLENECK
            </p>
          </motion.div>
          <motion.div
            key={"image"}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cx("ImageWrapper")}
          >
            <Image
              src="https://picsum.photos/300/300"
              alt="title"
              width={300}
              height={300}
            />
          </motion.div>
        </section>
        <section className={cx("ContentSection")}>
          <p className={cx("Subtitle")}>
            asdfsadfasdfsdfdafdfsdf asdfsdfsdf asdfsadfsd
          </p>
        </section>
      </header>
      <main className={cx("Main")}>
        <section className={cx("MarkDownSection")}>
          <MarkDownConverter text={markdown} />
        </section>
      </main>
    </div>
  );
};

export default DetailView;
