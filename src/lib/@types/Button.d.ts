type ButtonProps = {
  colorType?: "blue" | "gray" | "lightgray";
  size?: "small" | "medium" | "large" | "xsmall" | "xlarge";
  disabled?: boolean;
  className?: string;
  onClick?: (...args: any) => void;
};
