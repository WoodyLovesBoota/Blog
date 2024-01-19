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
      date: number;
      content: string;
    }[];
  }[];
}
