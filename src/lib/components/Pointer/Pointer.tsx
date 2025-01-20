"use client";
import React from "react";
import styles from "./Pointer.module.scss";
import classNames from "classnames/bind";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const cx = classNames.bind(styles);

interface IPointerProps {
  dotPosition: { x: number; y: number };
  pointerState: { type: string; image?: string };
}

const Pointer = ({ dotPosition, pointerState }: IPointerProps) => {
  return (
    <div
      className={cx("Pointer", pointerState.type)}
      style={{ transform: `translate(${dotPosition.x}px, ${dotPosition.y}px)` }}
    >
      {pointerState.type === "image" && pointerState.image && (
        <motion.div
          key={"image"}
          className={cx("ImageWrapper")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Image
            src={pointerState.image}
            alt="hover"
            width={100}
            height={100}
            style={{ height: "100px", width: "auto" }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default Pointer;
