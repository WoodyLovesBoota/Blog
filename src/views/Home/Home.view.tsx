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
      <section className={cx("PostCards")}>
        <MainCard item={postList[0]} />
        {postList.slice(1, 12).map((card: any, index: number) => (
          <VerticalCard key={index} item={card} />
        ))}
      </section>
      <section className={cx("PostList")}></section>
    </div>
  );
};

export default HomeView;
