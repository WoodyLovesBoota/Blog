"use client";
import React from "react";
import styles from "./PrimaryTextInputSet.module.scss";
import cn from "classnames/bind";
import { Label } from "@/lib/components/Input/Label/Label";
import { TextInput } from "@/lib/components/Input/TextInput/TextInput";
import { HelperText } from "@/lib/components/Input/HelperText/HelperText";
import { CommonTextInputItemProvider } from "@/lib/contexts/TextInput.context";
import { COMMON_FORM_TYPE } from "@/constants/form.constant";
import { TextArea } from "../../TextArea/TextArea";

const cx = cn.bind(styles);
export const PrimaryTextInputSet = (
  props: Partial<
    React.PropsWithChildren<React.PropsWithChildren<TextInputItemProps>>
  >
) => {
  const {
    children,
    className,
    name = "",
    errorMessage,
    labelClass,
    readonly,
    helperText,
    successMessage,
    warningMessage,
    onChange = () => null,
    onBlur = () => null,
    onFocus = () => null,
    value = "",
    hidden = false,
    defaultValue,
    type,
    iconColor,
    description,
    toggleButton,
    isButton,
    iconName,
    buttonType,
    iconSize,
    maxLength,
    ...rest
  } = props;
  if (hidden) return null;
  return (
    <CommonTextInputItemProvider
      {...rest}
      name={name || ""}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      value={value ?? defaultValue}
      readonly={readonly}
      type={type}
      unit={props.unit}
      errorMessage={errorMessage}
    >
      <label
        className={cx("Wrapper", className)}
        htmlFor={name}
        data-uuid={rest["data-uuid"]}
        data-key={name}
      >
        {props?.label && <Label className={labelClass} />}
        {props?.description && (
          <p className={cx("Description")}>{description}</p>
        )}
        {type === COMMON_FORM_TYPE.TEXTAREA ? (
          <TextArea readonly={readonly} className={className} maxLength={200} />
        ) : (
          <TextInput
            type={type}
            className={className}
            isButton={isButton}
            iconColor={iconColor}
            iconName={iconName}
            iconSize={iconSize}
            toggleButton={toggleButton}
            value={value ?? value}
            buttonType={buttonType ? buttonType : "button"}
            maxLength={maxLength}
          />
        )}
        {errorMessage && (
          <HelperText
            status={!!errorMessage ? "error" : undefined}
            className={className}
            iconColor={iconColor}
          >
            {errorMessage}
          </HelperText>
        )}
        {successMessage && (
          <HelperText
            status={!!successMessage ? "success" : undefined}
            className={className}
            iconColor={iconColor}
          >
            {successMessage}
          </HelperText>
        )}
      </label>
    </CommonTextInputItemProvider>
  );
};
