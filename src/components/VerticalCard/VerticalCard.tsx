"use client";
import React, { useState } from "react";
import cn from "classnames/bind";
import styles from "./VerticalCard.module.scss";
import Image from "next/image";

const cx = cn.bind(styles);

const VerticalCard = () => {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className={cx("Card")}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div className={cx("ImageWrapper")}>
        <Image
          src={"/static/images/sample.png"}
          alt="frontend"
          width={515}
          height={222}
          style={{
            height: "222px",
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
        <h3 className={cx("CardTitle")}>와다다곰 이란</h3>
        <p className={cx("CardDescription")}>와다다곰 짱짱짱 너무너무너무 귀여워요</p>
        <div className={cx("CardButtonWrapper")}>
          <p className={cx("CardDate")}>October 10, 2023</p>
          <button className={cx("CardButton")}>Read More</button>
        </div>
      </div>
    </div>
  );
};

export default VerticalCard;
