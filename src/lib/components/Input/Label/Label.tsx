"use client";
import React, { useContext } from "react";
import TextInputContext from "@/lib/contexts/TextInput.context";
import styles from "./Label.module.scss";
import cn from "classnames/bind";
const cx = cn.bind(styles);

export const Label = (props: React.PropsWithChildren<Partial<LabelProps>>) => {
  const { children } = props;
  const { isFocused, required, label, focusedClassname } = useContext(TextInputContext);

  return (
    <div
      className={cx("Wrapper", props.className, {
        focused: props.label ?? isFocused,
      })}
      data-name={"label"}
    >
      <div className={cx("Label", props.className, isFocused && focusedClassname)}>
        {props.label ?? label}
        {(props.required ?? required) && <span className={cx("Required")}>*</span>}
      </div>
      {children}
    </div>
  );
};
