import { usePopupDispatch } from "@/lib/common/contexts/popup/popup.context";
import BottomSheet from "@/lib/components/Popup/BottomSheet/BottomSheet";
import CenterPopup from "@/lib/components/Popup/CenterPopup/CenterPopup";
import ToastPopup from "@/lib/components/Popup/ToastPopup/ToastPopup";
import React from "react";

export function usePopup() {
  const { open } = usePopupDispatch();

  /** 중앙 팝업 */
  const centerPopup = React.useCallback(
    (props: CenterPopupProps & { type?: string }, option?: IPopupOption) => {
      const { type = "default", dimmed, ...rest } = props;

      open({
        option: {
          ...(option || {}),
          dimmed,
          stringKey: "centerPopup",
        },
        component: <CenterPopup {...rest} />,
      });
    },
    [open]
  );

  /**토스트 메시지 */
  const toastPopup = React.useCallback(
    (props: ToastPopupProps & { type?: string }, option?: IPopupOption) => {
      const { type = "default", ...rest } = props;
      open({
        option: {
          ...(option || {}),
          stringKey: "toastPopup",
        },
        component: <ToastPopup {...rest} />,
      });
    },
    [open]
  );

  /** 바텀 시트 */
  const bottomSheet = React.useCallback(
    (props: BottomSheetProps & { type?: string }, option?: IPopupOption) => {
      const { type = "default", dimmed, ...rest } = props;

      open({
        option: {
          ...(option || {}),
          dimmed,
          stringKey: "bottomSheet",
        },
        component: <BottomSheet {...rest} />,
      });
    },
    [open]
  );

  return {
    centerPopup,
    toastPopup,
    bottomSheet,
  };
}
