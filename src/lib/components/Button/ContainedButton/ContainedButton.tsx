import React, { useState } from "react";
import cn from "classnames/bind";
import styles from "./ContainedButton.module.scss";

const cx = cn.bind(styles);

function ContainedButton(props: React.PropsWithChildren<ButtonProps>) {
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
      className={cx("Button", "ContainedButton", colorType, size, className)}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export default ContainedButton;
