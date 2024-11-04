"use client";
import React, { Component } from "react";
import cn from "classnames/bind";
import styles from "./AuthLayout.module.scss";

const cx = cn.bind(styles);

interface IHorizontalLayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  type?: "horzontal";
}

const HorizontalLayout = (
  props: React.PropsWithChildren<IHorizontalLayoutProps>
) => {
  const { children, header, footer, type } = props;

  return (
    <div className={cx("Wrapper")}>
      {header && <header className={cx("Header")}>{header}</header>}{" "}
      <main className={cx("Main")}>{children}</main>
      {footer && <footer className={cx("Footer")}>{footer}</footer>}{" "}
    </div>
  );
};

export default HorizontalLayout;
