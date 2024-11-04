import {
  COMMON_FORM_TYPE,
  COMMON_FORM_TYPE_DEFAULT_VALUE,
} from "@/constants/form.constant";
import { v4 as uuid } from "uuid";
import * as yup from "yup";

type FormItemType = (typeof COMMON_FORM_TYPE)[keyof typeof COMMON_FORM_TYPE];

type Schema = yup.AnySchema<any, yup.AnyObject, any, "">;

export interface IFormOption {
  /** uuid */
  uuid: string;
  /** 생성일 */
  created?: string;
  /** 수정일 */
  modified?: string;
  /** 기본값 */
  default_value: any;
  /** 설명 가이드 텍스트 */
  description?: string;
  /** 인풋 타입 */
  input_type: FormItemType;
  /** 비활성화 여부 */
  is_disabled?: boolean;
  /** 읽기 전용 여부 */
  is_readonly?: boolean;
  /** 필수 여부 */
  is_required?: boolean;
  /** 서버랑 통신할 프로퍼티 */
  key: string;
  /** order */
  order?: number;
  /** 뎁스 */
  level?: number;
  /** 최대 길이 */
  max_length?: number;
  /** label */
  name?: string;
  /** parent uuid */
  parent_uuid: string | null;
  /** placeholder */
  placeholder?: string;
  /** 부가 금액 */
  additional_price: number;
  /** min value */
  min?: number;
  /** max value */
  max?: number;
  /** step */
  step?: number;
  /** child_visible */
  child_visible?: boolean;
  /** unit */
  unit: string;
  /** component_type */
  component_type: string;
  /** 옵션 direction */
  direction: "row" | "column";
  /** child direction */
  child_direction?: "row" | "column";
  /** child_component */
  child_component?: React.ReactNode | undefined;
  /** 빌더 수정시  */
  toBuilder(): IFormOptionBuilder;
  /** 빌더 복제 */
  clone(): IFormOptionBuilder;
}

interface IFormOptionBuilder {
  uuid(uuid: string): this;
  default_value(default_value: any): this;
  description(description: string): this;
  type(input_type: FormItemType): this;
  order(order: number): this;
  disabled(is_disabled: boolean): this;
  readonly(is_readonly: boolean): this;
  required(is_required: boolean): this;
  key(key: string): this;
  level(level: number): this;
  value(value: any): this;
  max_length(max_length: number): this;
  label(name: string): this;
  parent_uuid(parent_uuid: string): this;
  placeholder(placeholder: string): this;
  additional_price(additional_amount: number): this;
  min(min: number): this;
  max(max: number): this;
  step(step: number): this;
  validation(schema: Schema): this;
  child_visible(child_visible: boolean): this;
  unit(unit: string): this;
  component_type(component_type: string): this;
  child_direction(child_direction: "row" | "column"): this;
  direction(direction: "row" | "column"): this;
  child_component(child_component: string): this;
  build(): FormOption;
}

export class FormOption implements IFormOption {
  /** uuid */
  uuid: string = uuid();
  /** 생성일 */
  created: string = new Date().toISOString();
  /** 수정일 */
  modified: string = new Date().toISOString();
  /** default value */
  default_value: any = "";
  /** description */
  /** description */
  description?: string;
  /** input type */
  input_type: FormItemType = "id";
  /** disabled */
  is_disabled: boolean = false;
  /** readonly */
  is_readonly: boolean = false;
  /** required */
  is_required: boolean = false;
  /** 옵션이 아닌 경우 서버와 통신할 값 */
  key: string = "";
  /** level */
  level: number = 0;
  /** 값의 max number */
  max_length?: number;
  /** value */
  value?: any;
  /** label */
  name?: string | undefined;
  /** parent uuid */
  parent_uuid: string | null = null;
  /** placeholder */
  placeholder: string = "";
  /** 부가 금액 */
  additional_price: number = 0;
  /** min value */
  min: number = Number.MIN_SAFE_INTEGER;
  /** max value */
  max: number = Number.MAX_SAFE_INTEGER;
  /** step */
  step: number = 1;
  /** order */
  order: number = 0; /** schema */
  schema?: Schema;
  /** child_visible */
  child_visible: boolean = false;
  /** unit */
  unit: string = "";
  /** component_type */
  component_type: string = "primary";
  /** 옵션 direction */
  direction: "row" | "column" = "row";
  /** child direction */
  child_direction?: "row" | "column" = "row";
  /** child component */
  child_component?: React.ReactNode | undefined;

  /** 수정자 */
  toBuilder() {
    return new FormOptionBuilder()
      .uuid(this.uuid)
      .default_value(this.default_value)
      .description(this.description)
      .type(this.input_type)
      .disabled(this.is_disabled)
      .readonly(this.is_readonly)
      .required(this.is_required)
      .key(this.key)
      .level(this.level)
      .max_length(this.max_length)
      .label(this.name)
      .additional_price(this.additional_price)
      .parent_uuid(this.parent_uuid)
      .min(this.min)
      .max(this.max)
      .step(this.step)
      .validation(this.schema as any)
      .child_visible(this.child_visible)
      .placeholder(this.placeholder)
      .unit(this.unit)
      .component_type(this.component_type)
      .direction(this.direction)
      .order(this.order)
      .child_direction(this.child_direction || "row");
  }

  clone() {
    return this.toBuilder().uuid(uuid());
  }
  passwardValidate() {}
}

export default class FormOptionBuilder implements IFormOptionBuilder {
  readonly _formOption: FormOption = new FormOption();

  constructor() {}

  build() {
    return this._formOption as Readonly<FormOption>;
  }

  uuid(uuid: string) {
    this._formOption.uuid = uuid;
    return this;
  }

  default_value(default_value: any) {
    this._formOption.default_value = default_value;
    return this;
  }

  description(description?: string) {
    this._formOption.description = description;
    return this;
  }

  type(input_type: FormItemType) {
    this._formOption.input_type = input_type;
    this._formOption.default_value =
      this._formOption.default_value ||
      COMMON_FORM_TYPE_DEFAULT_VALUE[this._formOption.input_type];
    return this;
  }

  disabled(is_disabled: boolean) {
    this._formOption.is_disabled = is_disabled;
    return this;
  }

  readonly(is_readonly: boolean) {
    this._formOption.is_readonly = is_readonly;
    return this;
  }

  required(is_required: boolean) {
    this._formOption.is_required = is_required;
    return this;
  }

  key(key: string) {
    this._formOption.key = key;
    return this;
  }

  level(level: number) {
    this._formOption.level = level;
    return this;
  }

  max_length(max_length?: number) {
    this._formOption.max_length = max_length;
    return this;
  }

  label(name?: string) {
    this._formOption.name = name;
    return this;
  }

  additional_price(additional_amount: number) {
    this._formOption.additional_price = additional_amount;
    return this;
  }

  parent_uuid(parent_uuid: string | null) {
    this._formOption.parent_uuid = parent_uuid;
    return this;
  }

  placeholder(placeholder: string) {
    this._formOption.placeholder = placeholder;
    return this;
  }

  value(value: any) {
    this._formOption.value = value;
    return this;
  }

  min(min?: number) {
    this._formOption.min = min ?? this._formOption.min;
    return this;
  }

  max(max?: number) {
    this._formOption.max = max ?? this._formOption.max;
    return this;
  }

  step(step?: number) {
    this._formOption.step = step ?? this._formOption.step;
    return this;
  }

  validation(schema: Schema): this {
    this._formOption.schema = schema;
    return this;
  }

  child_visible(child_visible: boolean): this {
    this._formOption.child_visible = child_visible;
    return this;
  }

  unit(unit: string): this {
    this._formOption.unit = unit;
    return this;
  }

  component_type(component_type: string): this {
    this._formOption.component_type = component_type;
    return this;
  }

  direction(direction: "row" | "column"): this {
    this._formOption.direction = direction;
    return this;
  }

  child_direction(child_direction: "row" | "column"): this {
    this._formOption.child_direction = child_direction;
    return this;
  }

  child_component(child_component: string): this {
    this._formOption.child_component = child_component;
    return this;
  }

  order(order: number): this {
    this._formOption.order = order;

    return this;
  }
}
