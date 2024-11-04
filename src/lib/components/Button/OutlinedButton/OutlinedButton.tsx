import React, { useState } from "react";
import cn from "classnames/bind";
import styles from "./OutlinedButton.module.scss";

const cx = cn.bind(styles);

function OutlinedButton(props: React.PropsWithChildren<ButtonProps>) {
  const {
    colorType = "blue",
    size = "medium",
    disabled,
    children,
    onClick,
    className,
    ...rest
  } = props;

  return (
    <button
      className={cx("Button", "OutlinedButton", colorType, size, className)}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export default OutlinedButton;
