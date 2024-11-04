import { PopupActionTypes } from "@/lib/contants/reducers/action.type";

export interface OpenPayload {
  component: React.ReactElement;
  option?: IPopupOption;
}

export namespace Popup {
  export interface State {
    popups: IPopup[];
    layerKey: number;
  }

  type Payload = {
    [PopupActionTypes.OPEN]: OpenPayload;
    [PopupActionTypes.REPLACE]: OpenPayload;
    [PopupActionTypes.CLOSE]: string;
    [PopupActionTypes.ALL_CLOSE]: undefined;
    [PopupActionTypes.INIT_LAYER_KEY]: undefined;
  };

  export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
}
