"use client";

import {
  usePopupDispatch,
  usePopupState,
} from "@/lib/common/contexts/popup/popup.context";
import React from "react";
import styles from "./PopupManager.module.scss";
import cn from "classnames/bind";
import { AnimatePresence, motion } from "framer-motion";

const cx = cn.bind(styles);

export const PopupManager = () => {
  const { popups } = usePopupState();
  const { initLayerKey, close } = usePopupDispatch();

  React.useEffect(() => {
    if (popups.length === 0) {
      document.body.classList.remove("popup-open");

      initLayerKey();
    } else {
      document.body.classList.add("popup-open");
    }

    return () => {};
  }, [popups, initLayerKey]);

  return (
    <AnimatePresence>
      {popups.map((popup) => {
        return (
          <motion.div
            key={popup.stringKey}
            className={cx("PopupWrapper", {
              bottomSheet: popup.stringKey.includes("bottomSheet"),
            })}
            style={{ zIndex: popup.layerKey || 0 }}
          >
            {popup.option?.dimmed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "tween", duration: 0.2 }}
                exit={{ opacity: 0 }}
                className={cx("Dimmed", { open })}
                id={"dimmed"}
                style={{ zIndex: popup?.layerKey ? popup.layerKey - 1 : -1 }}
                onClick={() => close(popup.stringKey)}
              />
            )}
            {popup.stringKey.includes("bottomSheet") ? (
              <motion.div
                initial={{ y: 500 }}
                animate={{ y: 0 }}
                transition={{ type: "tween", duration: 0.2 }}
                exit={{ y: 500 }}
                style={{ zIndex: popup?.layerKey || 0 }}
              >
                {React.cloneElement(popup.component as React.ReactElement, {
                  layerClose: close.bind(null, popup.stringKey),
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "tween", duration: 0.2 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ zIndex: popup?.layerKey || 0 }}
              >
                {React.cloneElement(popup.component as React.ReactElement, {
                  layerClose: close.bind(null, popup.stringKey),
                })}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};
