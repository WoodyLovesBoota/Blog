"use client";
import React, { Component } from "react";
import cn from "classnames/bind";
import styles from "./FullLayout.module.scss";

const cx = cn.bind(styles);

interface IFullLayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  type?: "full";
}

const FullLayout = (props: React.PropsWithChildren<IFullLayoutProps>) => {
  const { children, header, footer, type } = props;

  return (
    <div className={cx("Wrapper")}>
      <main className={cx("Main")}>{children}</main>
    </div>
  );
};

export default FullLayout;
