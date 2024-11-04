type CheckBoxProps = {
  /** 체크여부 */
  checked: boolean;
  /** radius */
  rounded?: boolean;
  /** disabled */
  disabled?: boolean;
  /** name */
  name?: string;
  /** value */
  value?: string;
  /** onChange */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** indeterminate */
  indeterminate?: boolean;
  /** className */
  className?: string;
};
