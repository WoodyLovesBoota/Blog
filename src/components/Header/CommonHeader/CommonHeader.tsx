"use client";

import cn from "classnames/bind";
import styles from "./CommonHeader.module.scss";
import React from "react";
import { ROUTES } from "@/constants/route.constant";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/lib/common/components/Icon/Icon";

const cx = cn.bind(styles);

const GNB_LIST = [
  { name: "HOME", path: ROUTES.INDEX },
  { name: "TECH", path: ROUTES.TECH },
  { name: "PROJECT", path: ROUTES.PROJECT },
];

const CommonHeader = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className={cx("Wrapper")}>
      <div className={cx("MainHeader")}>
        <button
          className={cx("Logo")}
          onClick={() => router.push(ROUTES.INDEX)}
        >
          BLOG
        </button>
        <p className={cx("Email")}>{"woodylovesboota@gmail.com"}</p>
      </div>
    </header>
  );
};

export default CommonHeader;
