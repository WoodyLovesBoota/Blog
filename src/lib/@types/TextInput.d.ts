declare type ICommonTextInputItemContext = {
  onChange: (...args: any) => void;
  handleFocus: (e: React.FocusEvent<HTMLElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLElement>) => void;
  isFocused?: boolean;
  value: string;
  name?: string;
  onSearch?: (e: React.MouseEvent<HTMLElement>) => void;
  id?: string;
  errorMessage?: string;
  successMessage?: string;
  className?: string;
  themeType?: "outlined" | "contained";
  _input?: React.RefObject<HTMLInputElement>;
  _textArea?: React.RefObject<HTMLTextAreaElement>;
  removeText?: (e: React.MouseEvent<HTMLElement>) => void;
  togglePassword?: (e: React.MouseEvent<HTMLElement>) => void;
  size?: "small" | "large";
  defaultValue?: string;
  unit?: string;
} & IFormItem;

declare type TextInputItemProps = {
  className?: string;
  labelClass?: string;
  id?: string;
  errorMessage?: string;
  successMessage?: string;
  themeType?: "outlined" | "contained";
  size?: "small" | "large";
  maxWidth?: string | number;
  helperText?: string;
  warningMessage?: string;
  hidden?: boolean;
  textValue?: string;
  readOnly?: boolean;
  defaultValue?: any;
  className?: string;
  [key: string]: any;
} & HookFormFieldProps &
  IFormItem;

interface LabelProps {
  label: string;
  required?: boolean;
  isFocused?: boolean;
  className?: string;
}

type TextInputProps = {
  value: string;
  name: string;
  maxLength?: number;
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
  placeholder?: string;
  type?: string;
  isFocused?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  themeType?: "outlined" | "contained";
  maxWidth?: string | number;
  defaultValue?: string;
  className?: string;
} & HookFormFieldProps;
type TextBorderInputProps = {
  value: string;
  name: string;
  maxLength?: number;
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
  placeholder?: string;
  type?: string;
  isFocused?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  themeType?: "outlined" | "contained";
  maxWidth?: string | number;
  defaultValue?: string;
  className?: string;
} & HookFormFieldProps;
