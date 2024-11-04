// import { VALIDATION } from "@/constants/form/validation.constant";
import { COMMON_FORM_TYPE } from "@/constants/form.constant";
import FormOptionBuilder from "@/models/form/Options";
import * as yup from "yup";

export const DEFAULT_FORM_KEYS = {
  ID: "id",
  PASSWORD: "password",
} as const;

export type DefaultFormType = {
  [DEFAULT_FORM_KEYS.ID]: string;
  [DEFAULT_FORM_KEYS.PASSWORD]: string;
};

/** ID 아이디 */
export const ID = (() => {
  return new FormOptionBuilder()
    .type(COMMON_FORM_TYPE.ID)
    .key(DEFAULT_FORM_KEYS.ID)
    .validation(
      yup
        .string()
        .required("please enter between 8 and 20 characters")
        .max(8, "최대 9")
        .min(3, "최소 3")
    )
    .build();
})();

/** 비밀번호 */
export const PASSWORD = (() => {
  return new FormOptionBuilder()
    .type(COMMON_FORM_TYPE.PASSWORD)
    .key(DEFAULT_FORM_KEYS.PASSWORD)
    .validation(
      yup
        .string()
        .required("please enter between 8 and 20 characters")
        .max(8, "최대 9")
    )
    .build();
})();
