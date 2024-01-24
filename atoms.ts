import { atom } from "recoil";

export const languageState = atom<boolean>({
  key: "isEng",
  default: false,
});

export const screenState = atom<number>({
  key: "screenWidth",
  default: 0,
});

export interface IBlogData {
  works: {
    [key: string]: {
      title: string;
      date: string;
      content: string;
      numberDate: number;
      order: string;
    }[];
  }[];
  life: {
    [key: string]: {
      title: string;
      date: string;
      content: string;
      numberDate: number;
      order: string;
    }[];
  }[];
}
