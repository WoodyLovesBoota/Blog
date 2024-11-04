declare interface DropdownItem {
  label: string;
  value: any;
  children?: React.ReactNode;
  disabled?: boolean;
  additional_price?: number;
  direction?: "row" | "column";
}

declare interface TriggerProps {
  className?: string;
}

declare interface DropdownListProps {
  className?: string;
}

declare interface DropdownProps {
  value: any;
  onChange: (...args: any) => void;
  direction?: "top" | "bottom";
  disabled?: boolean;
  type?: "outlined" | "contained";
  placeholder?: string;
  options: DropdownItem[];
  size?: "small" | "medium" | "large";
  readOnly?: boolean;
}

declare type IDropdownContext = {
  value: any;
  onChange: (...args: any) => void;
  isOpen: boolean;
  handleToggleOpen: () => void;
  direction?: "top" | "bottom";
  type?: "outlined" | "contained";
  options: DropdownItem[];
  size?: "small" | "medium" | "large";
} & IFormItem;

declare type DropdownSetProps = {
  label?: string;
  errorMessage?: string;
  successMessage?: string;
  id?: string;
  className?: string;
  options: DropdownItem[];
  type?: string;
  maxWidth?: string;
  size?: "small" | "medium" | "large";

  [key: string]: any;
} & HookFormFieldProps &
  IFormItem;
