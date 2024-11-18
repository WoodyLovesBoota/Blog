"use client";

import React from "react";
import cn from "classnames/bind";
import styles from "./Detail.view.module.scss";
import MarkDownConverter from "@/components/MarkdownConverter/MarkdownConverter";
import Image from "next/image";

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
  const categories = getCategories(data.content);

  return (
    <div className={cx("Wrapper")}>
      <header className={cx("Header")}>
        <Image
          src={data.image}
          alt={data.title}
          width={1920}
          height={600}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <h1 className={cx("Title")}>{data.title}</h1>
      </header>
      <div className={cx("Content")}>
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
                <p className={cx("InfoValue")}>{calculateReadTime(data.content)} Min</p>
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
  );
};

export default DetailView;
