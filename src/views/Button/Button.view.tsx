"use client";
import React, { useState } from "react";
import styles from "./Button.view.module.scss";
import cn from "classnames/bind";
import { motion } from "framer-motion";

const cx = cn.bind(styles);

const ButtonView = () => {
  const [current, setCurrent] = useState(0);

  const handleClick = (index: number) => {
    setCurrent(index);
  };

  return (
    <div className={cx("Wrapper")}>
      <div className={cx("Buttons")}>
        <div className={cx("Button")} onClick={() => handleClick(0)}>
          <p className={cx("Text", "red", { current: current === 0 })}>
            <span className={cx("Span", { current: current === 0 })}>ER</span>
          </p>
          {current === 0 && (
            <motion.div layoutId="current" className={cx("Current", "red")}>
              <div className={cx("Circle")} />
            </motion.div>
          )}
        </div>
        <div className={cx("Divider")} />
        <div className={cx("Button")} onClick={() => handleClick(1)}>
          {current === 1 && (
            <motion.div layoutId="current" className={cx("Current", "orange")}>
              <div className={cx("Circle")} />
            </motion.div>
          )}
          <p className={cx("Text", "orange", { current: current === 1 })}>
            <span className={cx("Span", { current: current === 1 })}>PR</span>
          </p>
        </div>
        <div className={cx("Divider")} />
        <div className={cx("Button")} onClick={() => handleClick(2)}>
          <p className={cx("Text", "blue", { current: current === 2 })}>
            <span className={cx("Span", { current: current === 2 })}>HER2</span>
          </p>
          {current === 2 && (
            <motion.div layoutId="current" className={cx("Current", "blue")}>
              <div className={cx("Circle")} />
            </motion.div>
          )}
        </div>
        <div className={cx("Divider")} />
        <div className={cx("Button")} onClick={() => handleClick(3)}>
          <p className={cx("Text", "purple", { current: current === 3 })}>
            <span className={cx("Span", { current: current === 3 })}>
              Ki-67
            </span>
          </p>
          {current === 3 && (
            <motion.div layoutId="current" className={cx("Current", "purple")}>
              <div className={cx("Circle")} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ButtonView;
