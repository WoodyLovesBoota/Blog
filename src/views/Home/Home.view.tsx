"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
const cx = cn.bind(styles);

const HomeView = () => {
  const router = useRouter();

  const blogData = fetch("/assets/blog.json").then((res) => res.json());

  const handleMoreClick = () => {
    router.push("/tech");
  };

  return (
    <div className={cx("Wrapper")}>
      <div className={cx("Container")}>
        <section className={cx("Section")}>
          <p className={cx("Category")}>TECH</p>
          <div className={cx("List")}>
            {blogData.then((data) =>
              data.tech.map((item: any) => (
                <div className={cx("Item")}>
                  <p className={cx("ItemTitle")}>{item.title}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeView;
