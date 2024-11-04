"use client";

import cn from "classnames/bind";
import styles from "./CommonHeader.module.scss";
import React from "react";
import { ROUTES } from "@/constants/route.constant";
import { useRouter } from "next/navigation";

const cx = cn.bind(styles);

const GNB_LIST = [
  { name: "HOME", path: ROUTES.INDEX },
  { name: "DETAIL", path: ROUTES.DETAIL },
  { name: "TRENDING", path: ROUTES.TRENDING },
];

const CommonHeader = () => {
  const router = useRouter();

  return (
    <nav className={cx("Wrapper")}>
      {GNB_LIST.map((link) => (
        <button
          key={link.name}
          className={cx("NavButton")}
          onClick={() => router.push(link.path)}
        >
          {link.name}
        </button>
      ))}
    </nav>
  );
};

export default CommonHeader;
