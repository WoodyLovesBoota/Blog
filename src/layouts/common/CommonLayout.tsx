"use client";
import React, { Component } from "react";
import cn from "classnames/bind";
import styles from "./CommonLayout.module.scss";
import AnimateLayout from "../animate/AnimateLayout";
import { usePathname } from "next/navigation";

const cx = cn.bind(styles);

interface ICommonLayoutProps {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    type?: "common";
}

const CommonLayout = (props: React.PropsWithChildren<ICommonLayoutProps>) => {
    const { children, header, footer, type } = props;
    const pathname = usePathname();

    return (
        <div
            className={cx("Wrapper")}
            style={{
                backgroundColor: pathname === "/tech" ? "red" : "#121212",
            }}
        >
            {header && <header className={cx("Header")}>{header}</header>}
            <main className={cx("Main")}>{children}</main>
            {footer && <footer className={cx("Footer")}>{footer}</footer>}
        </div>
    );
};

export default CommonLayout;
