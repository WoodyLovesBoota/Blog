import React from "react";
import styles from "./HelperText.module.scss";
import cn from "classnames/bind";
import { Icon } from "@/lib/common/components/Icon/Icon";

const cx = cn.bind(styles);

type HelperTextProps = {
  status?: "error" | "warning" | "success" | "info";
  className?: string;
  iconColor?: string;
};

export const HelperText = (props: React.PropsWithChildren<HelperTextProps>) => {
  const { children, status, className, iconColor } = props;

  const IconComponent = ((status?: string) => {
    switch (status) {
      case "error":
        return <Icon name={"Notice"} size={18} color={iconColor ?? "var(--border-border-error, #DE4743)"} />;
      case "success":
        return <Icon name={"Notice"} size={18} color={iconColor ?? "var(--text-text-brand, #527AFF)"} />;
      default:
        return null;
    }
  })(status);

  return (
    <p className={cx("HelperText", status, className)} data-name={"HelperText"}>
      {IconComponent}
      {children}
    </p>
  );
};
