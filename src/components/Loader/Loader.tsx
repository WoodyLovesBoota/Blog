"use client";
import React from "react";
import styles from "./Loader.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

interface ILoaderProps {
  isData: boolean;
  isLoading: boolean;
}

const Loader = (props: ILoaderProps) => {
  const { isData, isLoading } = props;

  const [percentage, setPercentage] = React.useState(0);

  React.useEffect(() => {
    let start = percentage;
    let end = isData ? 100 : 87;
    const duration = 1000;
    let increment = (end - start) / (duration / 10);

    const interval = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(interval);
      }
      setPercentage(Math.floor(start));
    }, 10);

    return () => clearInterval(interval);
  }, [isData]);

  return (
    <div className={cx("Wrapper")}>
      <span>{percentage}%</span>
    </div>
  );
};

export default Loader;
