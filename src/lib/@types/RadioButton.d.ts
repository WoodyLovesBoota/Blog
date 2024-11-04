type RadioButtonProps = {
  /** 체크여부 */
  checked?: boolean;
  /** value */
  value?: string;
  /** name */
  name?: string;
  /** disabled */
  disabled?: boolean;
  /** onChange */
  onChange?: (...args: any) => void;
  /** checkedValue */
  checkedValue?: string;
};

declare interface RadioItem {
  /** value */
  value: string;
  /** label */
  label: string;
  /** disabled */
  disabled?: boolean;
}

declare type RadioButtonSetProps = {
  /** value */
  value?: string;
  /** name */
  name?: string;
  /** disabled */
  disabled?: boolean;
  /** onChange */
  onChange?: (...args: any) => void;
  /** children */
  children?: React.ReactNode;
  /** options */
  options: RadioItem[];
  /** direction */
  direction?: "row" | "column";
  /** label */
  label?: string;
  /** required */
  required?: boolean;
} & HookFormFieldProps;
