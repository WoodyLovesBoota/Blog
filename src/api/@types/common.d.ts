import { boolean } from "yup";

declare type OSType = "AOS" | "IOS";

type AjaxOptions = Partial<{
  url: string;
}>;
