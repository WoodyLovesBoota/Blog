import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";
const { persistAtom } = recoilPersist();

export const PointerState = atom<{ type: string; image?: string }>({
  key: "pointerState",
  default: { type: "normal" },
  effects_UNSTABLE: [persistAtom],
});
