import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import React from "react";
import Link from "next/link";
import styles from "./not-found.module.scss";
import cn from "classnames/bind";
import { ROUTES } from "@/constants/route.constant";

const cx = cn.bind(styles);

const NotFound = () => {
  return <div className={cx("Wrapper")}>NOT FOUND</div>;
};

export default NotFound;
