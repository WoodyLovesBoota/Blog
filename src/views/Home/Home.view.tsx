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

        <section className={cx("ThreeCards")}>
          {postList?.map((card: any, index: number) => (
            <VerticalCard key={index} item={card} />
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
