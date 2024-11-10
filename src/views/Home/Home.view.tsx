"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { getRandomSample } from "@/utils/string.utils";
import { useEffect, useState } from "react";
import { usePopup } from "@/components/hooks/popup/usePopup";
import Image from "next/image";
import VerticalCard from "@/components/VerticalCard/VerticalCard";

const cx = cn.bind(styles);

const HomeView = () => {
  const { centerPopup } = usePopup();

  const handleButtonClick = () => {
    centerPopup({
      title: "Title",
      subtitle: "this is subtitle",
      description: "desctiption is very long .....",
      positiveText: "Yes",
      negativeText: "No",
      dimmed: true,
      onPositiveClick: () => {
        console.log("positiveClick");
      },
      onNegativeClick: () => {
        console.log("negativeClick");
      },
    });
  };
  return (
    <div className={cx("Wrapper")}>
      <section className={cx("Section")}>
        <div className={cx("Title")}>
          <p>Technological Insights</p>
          <h2>Troubleshooting and Lessons Learned in Frontend Development</h2>
        </div>
        <main className={cx("Main")}>
          <div className={cx("MainContent")}>
            <Image
              src={"/static/images/sample.png"}
              alt="frontend"
              width={515}
              height={427}
              style={{
                height: "427px",
                width: "515px",
                objectFit: "cover",
                objectPosition: "center",
                borderRadius: "12px",
              }}
            />
            <div className={cx("MainContentText")}>
              <h3 className={cx("MainContentTitle")}>와다다곰 이란</h3>
              <p className={cx("MainContentDescription")}>와다다곰 짱짱짱 너무너무너무 귀여워요</p>
              <div className={cx("MainContentStatistic")}>
                <div className={cx("MainContentStatisticItem")}>
                  <p className={cx("MainContentStatisticItemKey")}>Category</p>
                  <p className={cx("MainContentStatisticItemValue")}>Projects</p>
                </div>
                <div className={cx("MainContentStatisticItem")}>
                  <p className={cx("MainContentStatisticItemKey")}>Publication Date</p>
                  <p className={cx("MainContentStatisticItemValue")}>October 10, 2023</p>
                </div>
              </div>
              <div className={cx("MainContentButtonWrapper")}>
                <button className={cx("MainContentButton")}>Read More</button>
              </div>
            </div>
          </div>
        </main>
        <section className={cx("ThreeCards")}>
          {Array.from({ length: 3 }).map((card, index) => (
            <VerticalCard key={index} />
          ))}
        </section>
        <section className={cx("Table")}>
          {Array.from({ length: 5 }).map((row, index) => (
            <div key={index} className={cx("TableRow")}>
              <Image
                src={"/static/images/sample.png"}
                alt="frontend"
                width={300}
                height={222}
                style={{
                  height: "222px",
                  width: "300px",
                  objectFit: "cover",
                  objectPosition: "center",
                  borderRadius: "12px",
                }}
              />
              <div className={cx("ItemContent")}>
                <div className={cx("ItemContentText")}>
                  <p className={cx("ItemContentDate")}>October 10, 2023</p>
                  <h3 className={cx("ItemContentTitle")}>와다다곰 이란</h3>
                  <p className={cx("ItemContentDescription")}>
                    와다다곰 짱짱짱 너무너무너무 귀여워요
                  </p>
                </div>
                <div className={cx("ButtonWrapper")}>
                  <button className={cx("ItemContentButton")}>Read More</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </section>
      <section className={cx("Projects")}>
        <div className={cx("ProjectsContent")}>
          <p className={cx("ProjectsTitle")}>Side Projects Journey</p>
          <h2 className={cx("ProjectsSubtitle")}>
            Challenges and Reflections from Personal Projects
          </h2>
        </div>
      </section>
      <section className={cx("ProjectsList")}></section>
    </div>
  );
};

export default HomeView;
