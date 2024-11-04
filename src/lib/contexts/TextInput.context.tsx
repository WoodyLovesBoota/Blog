"use client";
import React from "react";

const CommonTextInputItemContext = React.createContext<ICommonTextInputItemContext>({
  onChange: () => {},
  value: "",
  handleBlur: () => {},
  handleFocus: () => {},
  isFocused: false,
  placeholder: "",
  type: "text",
  name: "",
  id: "",
  onSearch: () => {},
  disabled: false,
  readOnly: false,
  required: false,
  errorMessage: "",
  successMessage: "",
  label: "",
  focusedClassname: "",
  maxLength: 0,
  className: "",
  themeType: "outlined",
  removeText: () => {},
  togglePassword: () => {},
});

export const CommonTextInputItemProvider = (props: React.PropsWithChildren<TextInputItemProps>) => {
  const [isFocused, setFocused] = React.useState(false);
  const {
    children,
    onChange,
    value,
    placeholder,
    type,
    name,
    disabled,
    readOnly,
    required,
    errorMessage,
    successMessage,
    label,
    focusedClassname,
    maxLength,
    className,
    themeType,
    onSearch,
    size,
    defaultValue,
    unit,
  } = props;

  const _input = React.useRef<HTMLInputElement>(null);
  const _textArea = React.useRef<HTMLTextAreaElement>(null);

  const handleFocus = React.useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    },
    [setFocused]
  );

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      setFocused(false);

      props.onBlur?.(e);
    },
    [props]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeTextHanlder = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    if (_input.current) {
      if (_input.current.value) {
        _input.current.value = "";
      }

      _input.current.focus();
    }

    if (_textArea.current) {
      _textArea.current.value = "";
      _textArea.current.focus();
    }
    onChange("");
  };

  const togglePasswordHandler = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    const type = _input.current?.type;
    if (_input.current) {
      _input.current.type = type === "password" ? "text" : "password";
    }
  };

  const context: ICommonTextInputItemContext = React.useMemo(() => {
    return {
      onChange,
      handleFocus,
      handleBlur,
      isFocused,
      value,
      placeholder,
      type,
      name,
      id: name,
      disabled,
      readOnly,
      required,
      errorMessage,
      onSearch,
      successMessage,
      label,
      focusedClassname,
      className,
      maxLength,
      unit,
      _input,
      togglePassword: togglePasswordHandler,
      removeText: removeTextHanlder,
      _textArea,
      themeType,
      defaultValue,
      size,
    };
  }, [
    onChange,
    handleFocus,
    handleBlur,
    isFocused,
    value,
    placeholder,
    type,
    name,
    disabled,
    readOnly,
    required,
    errorMessage,
    onSearch,
    successMessage,
    label,
    focusedClassname,
    className,
    maxLength,
    unit,
    removeTextHanlder,
    themeType,
    defaultValue,
    size,
  ]);

  return <CommonTextInputItemContext.Provider value={context}>{children}</CommonTextInputItemContext.Provider>;
};

export default CommonTextInputItemContext;
