"use client";

import React, { useEffect, useState } from "react";
import cn from "classnames/bind";
import styles from "./Detail.view.module.scss";
import MarkDownConverter from "@/components/MarkdownConverter/MarkdownConverter";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import useScroll from "@/components/hooks/scroll/useScroll";
import { useSetRecoilState } from "recoil";
import { PointerState } from "@/recoil/atom/payback.atom";

const cx = cn.bind(styles);

interface IDetailViewProps {
  id: string;
  title: string;
}

const blogData = require("/public/static/assets/blog.json");

const DetailView = (props: IDetailViewProps) => {
  const { id, title } = props;
  const setPointerState = useSetRecoilState(PointerState);
  const [markdown, setMarkdown] = useState("");
  useEffect(() => {
    const fetchData = () => {
      fetch(blogData.tech.find((item: any) => item.id === Number(id)).content)
        .then((res) => res.text())
        .then((data) => setMarkdown(data));
    };
    fetchData();
    setPointerState({ type: "normal" });
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
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <p className={cx("Title")}>{title}</p>
          </motion.div>
          {blogData.tech.find((item: any) => item.id === Number(id)).image && (
            <motion.div
              key={"image"}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.4, delay: 1 }}
              className={cx("ImageWrapper")}
            >
              <Image
                src={
                  blogData.tech.find((item: any) => item.id === Number(id))
                    .image
                }
                alt="title"
                width={300}
                height={300}
                style={{ height: 400, width: "auto" }}
              />
            </motion.div>
          )}
        </section>
        <section className={cx("ContentSection")}>
          <p className={cx("Subtitle")}>
            {blogData.tech.find((item: any) => item.id === Number(id)).date}
          </p>
        </section>
      </header>
      <main className={cx("Main")}>
        <motion.section
          key={"markdown"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, delay: 1.5 }}
          className={cx("MarkDownSection")}
        >
          <MarkDownConverter text={markdown} />
        </motion.section>
      </main>
    </div>
  );
};

export default DetailView;
