"use client";

import cn from "classnames/bind";
import styles from "./CommonHeader.module.scss";
import React from "react";
import { ROUTES } from "@/constants/route.constant";
import { usePathname, useRouter } from "next/navigation";

const cx = cn.bind(styles);

const GNB_LIST = [
  { name: "Home", path: ROUTES.INDEX },
  { name: "Detail", path: ROUTES.DETAIL },
  { name: "Trending", path: ROUTES.TRENDING },
];

const CommonHeader = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className={cx("Wrapper")}>
      {GNB_LIST.map((link) => (
        <button
          key={link.name}
          className={cx("NavButton", { current: pathname === link.path })}
          onClick={() => router.push(link.path)}
        >
          {link.name}
        </button>
      ))}
    </nav>
  );
};

export default CommonHeader;
