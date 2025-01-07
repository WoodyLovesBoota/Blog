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
      <p>BLpictoW PAST YOUR CONTENT BpictoTTLENECK</p>
    </div>
  );
};

export default DetailView;
