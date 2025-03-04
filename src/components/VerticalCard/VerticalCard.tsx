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

  return (
    <div
      className={cx("Wrapper")}
      onClick={() => router.push(`/tech/${item.id}`)}
    >
      <div className={cx("CardText")} key={item.id}>
        <h3 className={cx("CardDate")}>{item.date}</h3>
        <h3 className={cx("CardTitle")}>{item.title}</h3>
      </div>

      <footer className={cx("CardFooter")}>
        <div className={cx("CardTags")}>
          <p className={cx("CardTag")}>{"Project".toUpperCase()}</p>
        </div>
        {item.image && (
          <Image
            src={item.image}
            alt={item.title}
            width={200}
            height={200}
            style={{ objectFit: "cover", width: "200px", height: "200px" }}
          />
        )}
      </footer>
    </div>
  );
};

export default VerticalCard;
