import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";
const { persistAtom } = recoilPersist();

export interface PaybackResult {}

export const PaybackResultState = atom<PaybackResult>({
  key: "PaybackResultState",
  default: {
    applicationtime: "",
    uid: "",
    amount: "",
    exchange: "",
  },
  effects_UNSTABLE: [persistAtom],
});
