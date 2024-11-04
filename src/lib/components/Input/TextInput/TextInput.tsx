"use client";
import React, { useContext } from "react";
import styles from "./TextInput.module.scss";
import cn from "classnames/bind";
import TextInputContext from "@/lib/contexts/TextInput.context";
import { Icon } from "@/lib/common/components/Icon/Icon";
import { COMMON_FORM_TYPE } from "@/constants/form.constant";
const cx = cn.bind(styles);

export const TextInput = (
  props: React.PropsWithChildren<Partial<TextInputProps>>
) => {
  const {
    handleBlur,
    handleFocus,
    type,
    isFocused,
    value,
    className,
    disabled = false,
    name,
    onChange,
    placeholder,
    _input,
    errorMessage,
    themeType,
    size = "small",
  } = useContext(TextInputContext);

  const { iconName, iconColor, iconSize, maxLength } = props;

  return (
    <React.Fragment>
      <div
        className={cx("Wrapper", className ?? className, themeType, size, {
          focused: isFocused,
          error: !!errorMessage,
        })}
        onFocus={handleFocus}
        data-name={"TextInput"}
      >
        <input
          onBlur={handleBlur}
          onChange={onChange ?? props?.onChange}
          className={cx("Input")}
          disabled={disabled}
          value={value}
          name={props?.name ?? name}
          id={props?.name ?? name}
          placeholder={placeholder}
          autoComplete="off"
          inputMode={type === "number" ? "numeric" : "search"}
          onKeyDown={(e) => {
            if (type === "number") {
              ["e", "E", "+", "-"].includes(e.key) && e.preventDefault();
            }
          }}
          type={type || "text"}
          ref={_input}
          maxLength={maxLength}
        />

        <div className={cx("ButtonGroup")}>
          {props.isButton && (
            <button
              className={cx("Button", "visibleButton")}
              type={props.buttonType ? props.buttonType : "button"}
              onClick={props.togglePassword}
            >
              <Icon
                name={iconName ? iconName : "Plus"}
                color={iconColor}
                size={iconSize}
              />
            </button>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};
