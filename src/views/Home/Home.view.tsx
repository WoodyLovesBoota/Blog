"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { getRandomSample } from "@/utils/string.utils";
import { useEffect, useState } from "react";
import { usePopup } from "@/components/hooks/popup/usePopup";
import Image from "next/image";

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
          <p>Technology</p>
          <h2>Frontend Technology</h2>
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
            <div className={cx("Card")} key={index}>
              <Image
                src={"/static/images/sample.png"}
                alt="frontend"
                width={515}
                height={222}
                style={{
                  height: "222px",
                  width: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  borderRadius: "12px",
                }}
              />
              <div className={cx("CardText")}>
                <h3 className={cx("CardTitle")}>와다다곰 이란</h3>
                <p className={cx("CardDescription")}>와다다곰 짱짱짱 너무너무너무 귀여워요</p>
                <div className={cx("CardButtonWrapper")}>
                  <p className={cx("CardDate")}>October 10, 2023</p>
                  <button className={cx("CardButton")}>Read More</button>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default HomeView;
