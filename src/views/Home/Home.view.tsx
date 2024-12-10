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
import MainCard from "@/components/MainCard/MainCard";

const cx = cn.bind(styles);

const HomeView = ({ data }: { data: any }) => {
  const postList = data[0].tech.list;

  return (
    <div className={cx("Wrapper")}>
      <section className={cx("MainSection")}></section>
      <section className={cx("PlaySection")}></section>
      <section className={cx("TechSection")}>
        <header className={cx("SectionHeader")}>
          <p className={cx("SectionTitle")}>{"Tech :"}</p>
          <button className={cx("SectionButton")}>{"More"}</button>
        </header>
        <div className={cx("SectionContent")}></div>
      </section>
      <section className={cx("ProjectSection")}>
        <header className={cx("SectionHeader")}>
          <p className={cx("SectionTitle")}>{"Project :"}</p>
          <button className={cx("SectionButton")}>{"More"}</button>
        </header>
      </section>
    </div>
  );
};

export default HomeView;
