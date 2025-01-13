"use client";
import React from "react";
import styles from "./Pointer.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

interface IPointerProps {
  dotPosition: { x: number; y: number };
}

const Pointer = ({ dotPosition }: IPointerProps) => {
  return (
    <div
      className={cx("Pointer")}
      style={{ transform: `translate(${dotPosition.x}px, ${dotPosition.y}px)` }}
    ></div>
  );
};

export default Pointer;
