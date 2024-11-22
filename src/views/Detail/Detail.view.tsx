"use client";

import React, { useEffect, useState } from "react";
import cn from "classnames/bind";
import styles from "./Detail.view.module.scss";
import MarkDownConverter from "@/components/MarkdownConverter/MarkdownConverter";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import useScroll from "@/components/hooks/scroll/useScroll";

const cx = cn.bind(styles);

const getCategories = (text: string) => {
  const categories: string[] = [];
  const lines = text.split("\n");

  lines.forEach((line) => {
    if (line.startsWith("###") && !line.startsWith("####")) {
      categories.push(line.replace(/^[#]+\s/, "").trim());
    }
  });

  return categories;
};

function calculateReadTime(text: string) {
  const wordsPerMinute = 250;
  const totalWords = text.split(/\s+/).length;
  const readTime = Math.ceil(totalWords / wordsPerMinute);
  return readTime;
}

const DetailView = ({ data }: { data: any }) => {
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowHeader(false);
    }, 3000);
  }, []);

  const categories = getCategories(data.content);
  return (
    <div className={cx("Wrapper")}>
      <AnimatePresence mode="wait">
        {showHeader && (
          <motion.header
            key={"header"}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={cx("Header")}
          >
            <section className={cx("TitleSection")}>
              <h1 className={cx("Title")}>{data.title}</h1>
            </section>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className={cx("Divider")}
            ></motion.div>
            <div className={cx("Description")}>
              <div className={cx("Column")}>
                <div className={cx("Date")}>{data.date}</div>
                <div className={cx("ReadTime")}>
                  {calculateReadTime(data.content)} Min
                </div>
              </div>
              <div className={cx("Column")}>
                <div className={cx("DescriptionText")}>{data.desc}</div>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className={cx("Content")}>
        <section className={cx("ContentHeader")}>
          <h1 className={cx("Title")}>{data.title}</h1>
        </section>
        <div className={cx("ContentWrapper")}>
          <div className={cx("MarkDownWrapper")}>
            <MarkDownConverter text={data.content} />
          </div>
          <div className={cx("TagWrapper")}>
            <section className={cx("InfoSection")}>
              <div className={cx("InfoRow")}>
                <div className={cx("InfoItem")}>
                  <p className={cx("InfoTitle")}>Publication Date</p>
                  <p className={cx("InfoValue")}>{data.date}</p>
                </div>
                <div className={cx("InfoItem")}>
                  <p className={cx("InfoTitle")}>Reading Time</p>
                  <p className={cx("InfoValue")}>
                    {calculateReadTime(data.content)} Min
                  </p>
                </div>
              </div>
              <div className={cx("InfoRow")}>
                <div className={cx("InfoItem")}>
                  <p className={cx("InfoTitle")}>Tags</p>
                  <ul className={cx("InfoList")}>
                    <li>Next.js</li>
                    <li>React</li>
                  </ul>
                </div>
              </div>
            </section>
            <section className={cx("ContentSection")}>
              <p className={cx("CategoryTitle")}>Table of Contents</p>
              <ul className={cx("CategoryList")}>
                {categories.map((category) => (
                  <li className={cx("Tag")}>{category}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;
