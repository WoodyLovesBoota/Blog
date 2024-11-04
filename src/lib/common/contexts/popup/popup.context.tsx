"use client";
import React from "react";
import { Popup, OpenPayload } from "./popup.context.type";

class PopupModel implements IPopup {
  layerKey?: number;
  component?: React.ReactElement;
  stringKey: string;
  option?: IPopupOption;

  constructor({ stringKey, component, option, layerKey }: IPopup) {
    this.layerKey = layerKey;
    this.stringKey = stringKey;
    this.component = component;
    this.option = option;
  }
}

import State = Popup.State;
import Actions = Popup.Actions;
import { PopupActionTypes } from "@/lib/contants/reducers/action.type";

const PopupState = React.createContext<State | null>(null);
const PopupDispatch = React.createContext<React.Dispatch<Actions> | null>(null);

const initialState: State = {
  popups: [],
  layerKey: 1000,
};

export function usePopupState() {
  const state = React.useContext(PopupState);
  if (!state) throw new Error("Cannot find PopupProvider");
  return state;
}

export function usePopupDispatch() {
  const dispatch = React.useContext(PopupDispatch);
  if (!dispatch) throw new Error("Cannot find PopupProvider");

  const open = React.useCallback(
    (payload: OpenPayload) => {
      const { option } = payload;

      dispatch({
        type:
          option?.stringKey && option?.isReplace ? PopupActionTypes.REPLACE : PopupActionTypes.OPEN,
        payload,
      });
    },
    [dispatch]
  );

  const close = React.useCallback(
    (popupKey: string) => {
      dispatch({
        type: PopupActionTypes.CLOSE,
        payload: popupKey,
      });
    },
    [dispatch]
  );

  const allClose = React.useCallback(() => {
    dispatch({
      type: PopupActionTypes.ALL_CLOSE,
    });
  }, [dispatch]);

  const initLayerKey = React.useCallback(() => {
    dispatch({
      type: PopupActionTypes.INIT_LAYER_KEY,
    });
  }, [dispatch]);

  return {
    open,
    close,
    allClose,
    initLayerKey,
  };
}

const popupReducer = (state: State, action: Actions): State => {
  const isDuplicateStringKey = (stringKey: string) => {
    return state.popups.some((popup) => popup.stringKey === stringKey);
  };

  switch (action.type) {
    case PopupActionTypes.INIT_LAYER_KEY: {
      return {
        ...state,
        layerKey: initialState.layerKey,
      };
    }
    case PopupActionTypes.OPEN: {
      const { component, option = {} } = action.payload;
      const stringKey = option.stringKey || Math.random().toString(20).substring(2, 16);
      const layerKey = state.layerKey + 2;

      return {
        ...state,
        popups: !isDuplicateStringKey(stringKey)
          ? [
              ...state.popups,
              new PopupModel({
                layerKey,
                component,
                stringKey,
                option,
              }),
            ]
          : state.popups,
        layerKey: state.layerKey + 2,
      };
    }
    case PopupActionTypes.REPLACE: {
      const { component, option } = action.payload;
      const stringKey = option?.stringKey || "";
      const layerKey = state.layerKey;
      const isDuplicate = isDuplicateStringKey(stringKey);
      return {
        ...state,
        popups: !isDuplicate
          ? /** 없는 경우  */
            [
              ...state.popups,
              new PopupModel({
                layerKey,
                component,
                stringKey,
                option,
              }),
            ]
          : /** 있는 경우  */
            state.popups.map((popup) =>
              popup.stringKey === option?.stringKey
                ? {
                    ...popup,
                    component,
                  }
                : popup
            ),
      };
    }

    case PopupActionTypes.CLOSE: {
      return {
        ...state,
        popups: state.popups.filter((popup) => popup.stringKey !== action.payload),
      };
    }

    case PopupActionTypes.ALL_CLOSE: {
      return initialState;
    }
    default:
      return state;
  }
};

export const PopupProvider = ({ children }: React.PropsWithChildren) => {
  const [state, dispatch] = React.useReducer(popupReducer, initialState);

  return (
    <PopupState.Provider value={state}>
      <PopupDispatch.Provider value={dispatch}>{children}</PopupDispatch.Provider>
    </PopupState.Provider>
  );
};
