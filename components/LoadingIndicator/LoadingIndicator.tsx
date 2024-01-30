import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import styles from "./LoadingIndicator.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(styles);

const LoadingIndicator = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleStart = (url: string) => {
    if (url !== router.asPath) {
      setLoading(true);
    }
  };

  const handleComplete = () => setLoading(false);

  useEffect(() => {
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router, handleStart, handleComplete]);

  return loading ? (
    <motion.div className={cx("Wrapper")} variants={loadingVariants} initial="initial" animate="animate">
      <div className={cx("Spinner")} />
    </motion.div>
  ) : null;
};

export default LoadingIndicator;

const loadingVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, duration: 1 },
};
