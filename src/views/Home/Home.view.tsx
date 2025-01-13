"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
const cx = cn.bind(styles);

const blogData = require("/public/static/assets/blog.json");

const HomeView = () => {
  const router = useRouter();

  const [hover, setHover] = useState<any>();
  const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    setDotPosition({ x: event.clientX, y: event.clientY });
  };

  const handleItemClick = (item: any) => {
    router.push(`/tech/${item.id}`);
  };

  return (
    <div className={cx("Wrapper")} onMouseMove={handleMouseMove}>
      <div className={cx("Container")}>
        <section className={cx("Section")}>
          <p className={cx("Category")}>TECH</p>
          <div className={cx("List")}>
            {blogData.tech.map((item: any) => (
              <div
                key={item.id}
                className={cx("Item")}
                onClick={() => {
                  handleItemClick(item);
                }}
                onMouseEnter={() => setHover(item)}
                onMouseLeave={() => setHover(null)}
              >
                <p className={cx("ItemTitle")}>{item.title}</p>
                <p className={cx("ItemDate")}>
                  {item.date.split("-").join(".")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      {hover && hover.image && (
        <div
          className={cx("Hover")}
          style={{
            position: "fixed",
            left: -6,
            top: -6,
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "black",
            pointerEvents: "none",
            transform: `translate(${dotPosition.x}px, ${dotPosition.y}px)`,
            transition: "transform 0.05s ease-in-out",
          }}
        >
          <Image src={hover.image} alt="hover" width={100} height={100} />
        </div>
      )}
    </div>
  );
};

export default HomeView;
