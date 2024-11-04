export const COMMON_FORM_TYPE = {
  /** 아이디 */
  ID: "id",
  /** 비밀번호 */
  PASSWORD: "password",
  /** 텍스트 */
  TEXT: "text",
  /** 텍스트 영역 */
  TEXTAREA: "textarea",
} as const;

export const COMMON_FORM_TYPE_DEFAULT_VALUE = {
  [COMMON_FORM_TYPE.ID]: "",
  [COMMON_FORM_TYPE.PASSWORD]: "",
  [COMMON_FORM_TYPE.TEXT]: "",
  [COMMON_FORM_TYPE.TEXTAREA]: "",
};

export const VALIDATION_REGEX = {
  /** 이메일 */
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
  /** 비밀번호 (특수문자, 영문자 포함 8~16자) */
  PASSWORD: /^(?=.*[a-zA-Z])(?=.*[!@#$%^*()+=-])(?=.*[0-9]).{8,16}$/,
  /** URL */
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  /** 전화번호 */
  PHONE: /^\d{3}-\d{3,4}-\d{4}$/,
  /** 국가코드 포함 전화번호 */
  PHONE_WITH_COUNTRY_CODE: /^\d{2,3}-\d{3,4}-\d{4}$/,
  /** 구 우편번호 */
  POSTAL_CODE: /^\d{3}-\d{3}$/,
  /** 신 우편번호 */
  ZIP_CODE: /^\d{5}$/,
  /** HTTP URL */
  HTTP: /^https?:\/\//,
  /** TWITTER URL */
  TWITTER: /(^https?:\/\/twitter.com\/[a-zA-Z0-9_]+\/?$)|^$/,
  /** INSTA URL */
  INSTAGRAM: /(^https?:\/\/www.instagram.com\/[a-zA-Z0-9_.]+\/?$)|^$/,
};
