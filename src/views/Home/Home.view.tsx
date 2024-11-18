"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { getRandomSample } from "@/utils/string.utils";
import { useEffect, useState } from "react";
import { usePopup } from "@/components/hooks/popup/usePopup";
import Image from "next/image";
import VerticalCard from "@/components/VerticalCard/VerticalCard";
import { useRouter } from "next/navigation";

const cx = cn.bind(styles);

const HomeView = ({ data }: { data: any }) => {
  const { centerPopup } = usePopup();
  const router = useRouter();

  const postList = data[0].tech.list;

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
              src={postList[0].image}
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
              <h3 className={cx("MainContentTitle")}>{postList[0].title}</h3>
              <p className={cx("MainContentDescription")}>{postList[0].desc}</p>
              <div className={cx("MainContentStatistic")}>
                <div className={cx("MainContentStatisticItem")}>
                  <p className={cx("MainContentStatisticItemKey")}>Category</p>
                  <p className={cx("MainContentStatisticItemValue")}>Projects</p>
                </div>
                <div className={cx("MainContentStatisticItem")}>
                  <p className={cx("MainContentStatisticItemKey")}>Publication Date</p>
                  <p className={cx("MainContentStatisticItemValue")}>{postList[0].date}</p>
                </div>
              </div>
              <div className={cx("MainContentButtonWrapper")}>
                <button
                  className={cx("MainContentButton")}
                  onClick={() => {
                    router.push(`/tech/${postList[0].id}`);
                  }}
                >
                  Read More
                </button>
              </div>
            </div>
          </div>
        </main>
        <section className={cx("ThreeCards")}>
          {postList
            ?.slice(1)
            ?.map((card: any, index: number) => <VerticalCard key={index} item={card} />)}
        </section>
        {/* <section className={cx("Table")}>
          {postList?.slice(4).map((row: any, index: number) => (
            <div key={index} className={cx("TableRow")}>
              <Image
                src={row.image}
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
                  <p className={cx("ItemContentDate")}>{row.date}</p>
                  <h3 className={cx("ItemContentTitle")}>{row.title}</h3>
                  <p className={cx("ItemContentDescription")}>{row.desc}</p>
                </div>
                <div className={cx("ButtonWrapper")}>
                  <button className={cx("ItemContentButton")}>Read More</button>
                </div>
              </div>
            </div>
          ))}
        </section> */}
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
