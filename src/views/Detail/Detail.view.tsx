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

const DetailView = () => {
  return (
    <div className={cx("Wrapper")}>
      <header className={cx("Header")}>
        <section className={cx("TitleSection")}>
          <div className={cx("TitleWrapper")}>
            <p className={cx("Title")}>
              BLpictoW PAST YOUR CONTENT BpictoTTLENECK
            </p>
          </div>
        </section>
        <section className={cx("ContentSection")}>
          <p className={cx("Subtitle")}>
            asdfsadfasdfsdfdafdfsdf asdfsdfsdf asdfsadfsd
          </p>
        </section>
      </header>
    </div>
  );
};

export default DetailView;
