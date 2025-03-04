"use client";
import React, { Component, PropsWithChildren, useContext, useRef } from "react";
import cn from "classnames/bind";
import styles from "./CommonLayout.module.scss";
import AnimateLayout from "../animate/AnimateLayout";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Pointer from "@/lib/components/Pointer/Pointer";
import { useRecoilValue } from "recoil";
import { PointerState } from "@/recoil/atom/payback.atom";
const cx = cn.bind(styles);

interface ICommonLayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  type?: "common";
}

function FrozenRouter(props: PropsWithChildren<{}>) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;

  return (
    <LayoutRouterContext.Provider value={frozen}>
      {props.children}
    </LayoutRouterContext.Provider>
  );
}

const CommonLayout = (props: React.PropsWithChildren<ICommonLayoutProps>) => {
  const { children, header, footer, type } = props;
  const pathname = usePathname();
  const pointerState = useRecoilValue(PointerState);
  const [dotPosition, setDotPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    setDotPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className={cx("Wrapper")} onMouseMove={handleMouseMove}>
      {header && <header className={cx("Header")}>{header}</header>}
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className={cx("Main")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.5 } }}
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.main>
      </AnimatePresence>
      {footer && <footer className={cx("Footer")}>{footer}</footer>}
      <Pointer dotPosition={dotPosition} pointerState={pointerState} />
    </div>
  );
};

export default CommonLayout;
