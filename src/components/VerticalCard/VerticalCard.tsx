"use client";
import React, { useState } from "react";
import cn from "classnames/bind";
import styles from "./VerticalCard.module.scss";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/constants/route.constant";
const cx = cn.bind(styles);

const VerticalCard = ({ item }: { item: any }) => {
  const router = useRouter();

  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className={cx("Wrapper")}
      onClick={() => router.push(`/tech/${item.id}`)}
    >
      <div
        className={cx("Card")}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <Image
          src={item.image}
          alt="frontend"
          width={400}
          height={400}
          style={{
            width: "100%",
            height: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            objectPosition: "center",
            borderRadius: "12px",
          }}
          className={cx("CardImage", {
            hover: isHover,
          })}
        />
        <AnimatePresence>
          {isHover && (
            <motion.div
              className={cx("CardText")}
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h3
                className={cx("CardTitle")}
                transition={{ duration: 0.3, staggerChildren: 0.05 }}
              >
                {item.title.split("").map((char: string, index: number) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 + 0.1 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h3>
              <motion.h3
                className={cx("CardDate")}
                transition={{ duration: 0.3, staggerChildren: 0.05 }}
              >
                {item.date.split("").map((char: string, index: number) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 + 0.1 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerticalCard;
