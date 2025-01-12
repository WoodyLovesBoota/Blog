"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
const cx = cn.bind(styles);

const blogData = require("/public/static/assets/blog.json");

const HomeView = () => {
  const router = useRouter();

  const handleItemClick = (item: any) => {
    router.push(`/tech/${item.id}`);
  };

  return (
    <div className={cx("Wrapper")}>
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
    </div>
  );
};

export default HomeView;
