"use client";

import cn from "classnames/bind";
import styles from "./Login.view.module.scss";
import { PrimaryTextInputSet } from "@/lib/components/Input/TextInputSet/Primary/PrimaryTextInputSet";
import { Controller, useForm, useWatch } from "react-hook-form";
import { DEFAULT_FORM_KEYS, ID, PASSWORD } from "@/constants/form/default.form.constant";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ContainedButton from "@/lib/components/Button/ContainedButton/ContainedButton";

const cx = cn.bind(styles);

type LoginFormType = {
  id: string;
  password: string;
};

const LoginView = () => {
  const form = useForm<LoginFormType>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {},
    resolver: yupResolver(
      yup.object().shape({
        [ID.key]: ID.schema,
        [PASSWORD.key]: PASSWORD.schema,
      } as {}) as never
    ),
  });

  const id = useWatch({
    control: form.control,
    name: DEFAULT_FORM_KEYS.ID,
  });

  const password = useWatch({
    control: form.control,
    name: DEFAULT_FORM_KEYS.PASSWORD,
  });

  const onValid = (data: LoginFormType) => {
    console.log(data);
  };

  return (
    <div>
      <form onSubmit={form.handleSubmit(onValid)}>
        <Controller
          name={ID.key as never}
          control={form.control}
          render={({ field: { ref: _, ...rest }, fieldState }) => {
            return (
              <PrimaryTextInputSet
                {...rest}
                label={"ID"}
                type={ID.input_type}
                placeholder={"아이디 입력"}
                errorMessage={fieldState.error?.message}
                className={cx("Insertreason")}
              />
            );
          }}
        />
        <Controller
          name={PASSWORD.key as never}
          control={form.control}
          render={({ field: { ref: _, ...rest }, fieldState }) => {
            return (
              <PrimaryTextInputSet
                {...rest}
                label={"비밀번호"}
                type={ID.input_type}
                placeholder={"비밀번호 입력"}
                errorMessage={fieldState.error?.message}
                className={cx("Insertreason")}
              />
            );
          }}
        />
        <ContainedButton>버튼</ContainedButton>
      </form>
      {id}
      {password}
    </div>
  );
};

export default LoginView;
