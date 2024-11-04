"use client";
import React, { useContext, useState } from "react";
import styles from "./TextArea.module.scss";
import cn from "classnames/bind";
import TextInputContext from "@/lib/contexts/TextInput.context";

const cx = cn.bind(styles);

export const TextArea = (props: React.PropsWithChildren<Partial<TextInputProps>> & {}) => {
  const {
    handleBlur,
    handleFocus,
    isFocused,
    value,
    readOnly,
    className,
    disabled,
    name,
    onChange,
    placeholder,
    errorMessage,
    maxLength,
    themeType = "outlined",
  } = useContext(TextInputContext);
  const [heightState, setHeightState] = useState(1);
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { style, scrollHeight } = event.target;

    const lineHeight = 24;

    const newLines = Math.floor(scrollHeight / lineHeight);
    setHeightState(newLines * lineHeight);

    if (onChange) {
      onChange(event);
    }

    if (props?.onChange) {
      props.onChange(event);
    }
  };

  return (
    <div
      className={cx("Wrapper", props?.className ?? className, themeType, {
        focused: props?.isFocused ?? isFocused,
        error: !!errorMessage,
      })}
      style={{ height: `${heightState}px` }}
    >
      <textarea
        onChange={handleChange}
        readOnly={props?.readonly || readOnly}
        value={props?.value ?? value ? value : undefined}
        className={cx("TextArea")}
        onFocus={props?.onFocus ?? handleFocus}
        onBlur={props?.onBlur || handleBlur}
        name={props?.name || name}
        id={props?.name || name}
        placeholder={!!placeholder ? placeholder : ""}
        disabled={props?.disabled ?? disabled}
        maxLength={props?.maxLength ?? maxLength}
      />

      {!!maxLength && (
        <p className={cx("Count")}>
          <strong>{value.length}</strong>/{maxLength}
        </p>
      )}
    </div>
  );
};
