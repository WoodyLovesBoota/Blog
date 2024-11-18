"use client";
import React, { useState } from "react";
import cn from "classnames/bind";
import styles from "./VerticalCard.module.scss";
import Image from "next/image";
import { useRouter } from "next/navigation";

const cx = cn.bind(styles);

const VerticalCard = ({ item }: { item: any }) => {
  const router = useRouter();

  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className={cx("Card")}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div className={cx("ImageWrapper")}>
        <Image
          src={item.image}
          alt="frontend"
          width={400}
          height={400}
          style={{
            height: "400px",
            width: "100%",
            objectFit: "cover",
            objectPosition: "center",
            borderRadius: "12px",
          }}
          className={cx("CardImage", {
            hover: isHover,
          })}
        />
      </div>
      <div className={cx("CardText")}>
        <h3 className={cx("CardTitle")}>{item.title}</h3>
        <p className={cx("CardDescription")}>{item.desc}</p>
        <div className={cx("CardButtonWrapper")}>
          <p className={cx("CardDate")}>{item.date}</p>
          <button
            className={cx("CardButton")}
            onClick={() => {
              router.push(`/tech/${item.id}`);
            }}
          >
            Read More
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerticalCard;
