"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { getRandomSample } from "@/utils/string.utils";
import { useEffect, useState } from "react";
import { usePopup } from "@/components/hooks/popup/usePopup";
import Image from "next/image";
import VerticalCard from "@/components/VerticalCard/VerticalCard";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
const cx = cn.bind(styles);

const HomeView = ({ data }: { data: any }) => {
  const { centerPopup } = usePopup();
  const router = useRouter();

  const [tab, setTab] = useState<"all" | "tech" | "project">("all");

  const postList = data[0].tech.list;

  console.log(postList);

  return (
    <div className={cx("Wrapper")}>
      <header className={cx("Header")}>
        <div className={cx("Tabs")}>
          <button
            className={cx("TabButton", { active: tab === "all" })}
            onClick={() => setTab("all")}
          >
            All
            {tab === "all" && (
              <motion.div layoutId="currentTab" className={cx("CurrentTab")} />
            )}
          </button>
          <button
            className={cx("TabButton", { active: tab === "tech" })}
            onClick={() => setTab("tech")}
          >
            Tech
            {tab === "tech" && (
              <motion.div layoutId="currentTab" className={cx("CurrentTab")} />
            )}
          </button>
          <button
            className={cx("TabButton", { active: tab === "project" })}
            onClick={() => setTab("project")}
          >
            Project
            {tab === "project" && (
              <motion.div layoutId="currentTab" className={cx("CurrentTab")} />
            )}
          </button>
        </div>
      </header>
      <section className={cx("Section")}>
        <section className={cx("ThreeCards")}>
          {postList
            .filter((e: any) => {
              if (tab === "all") return true;
              else if (tab === "tech") return e.type === "tech";
              else if (tab === "project") return e.type === "project";
              return false;
            })
            .map((card: any, index: number) => (
              <VerticalCard key={index} item={card} />
            ))}
        </section>
      </section>
      <section className={cx("ProjectsList")}></section>
    </div>
  );
};

export default HomeView;
