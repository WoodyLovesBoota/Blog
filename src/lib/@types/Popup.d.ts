type IPopupOption = {
  isReplace?: boolean;
  dimmed?: boolean;
  [key: string]: any;
  backgroundLayer?: boolean;
};

type IPopup = {
  layerKey?: number;
  component?: React.ReactElement;
  stringKey: string;
  option?: IPopupOption;
  dimmed?: boolean;
  backgroundLayer?: boolean;
};

type PopupProps = {
  children?: React.ReactNode;
  zIndex?: number;
  layerClose?: () => void;
  dimmed?: boolean;
  backgroundLayer?: boolean;
  option?: IPopupOption;
};

type ToastPopupProps = {
  stringKey: string;
  title: string;
  iconName: React.ComponentProps<typeof Icon>["name"];
} & PopupProps;
type ToastSimplePopupProps = {
  stringKey: string;
  icons?: boolean;
  className?: string;
  icons?: boolean;
  zIndex?: number;
  hardBr?: boolean;
  onClose?: () => void;
  layerClose?: () => void;
  description?:
    | string
    | ReactElement<any, string | JSXElementConstructor<any>>
    | ReactNodeArray;
} & PopupProps;

type CenterPopupProps = {
  title?: string;
  subtitle?: string;
  dimmed?: boolean;
  negativeType?: ButtonColorType;
  positiveType?: ButtonColorType;
  description?:
    | string
    | ReactElement<any, string | JSXElementConstructor<any>>
    | ReactNodeArray;
  positiveText?: string;
  negativeText?: string;
  onPositiveClick?: () => void;
  onNegativeClick?: () => void;
  stringkey?: string;
  isAnimation?: boolean;
} & PopupProps;

type SearchPopupProps = {
  title?: string;
  dimmed?: boolean;
  negativeType?: ButtonColorType;
  positiveType?: ButtonColorType;
  description?:
    | string
    | ReactElement<any, string | JSXElementConstructor<any>>
    | ReactNodeArray;
  positiveText?: string;
  negativeText?: string;
  onPositiveClick?: () => void;
  onNegativeClick?: () => void;
  stringkey?: string;
  isAnimation?: boolean;
} & PopupProps;

type BottomSheetProps = {
  title?: string;
  subtitle?: string;
  dimmed?: boolean;
  negativeType?: ButtonColorType;
  positiveType?: ButtonColorType;
  description?:
    | string
    | ReactElement<any, string | JSXElementConstructor<any>>
    | ReactNodeArray;
  positiveText?: string;
  negativeText?: string;
  onPositiveClick?: () => void;
  onNegativeClick?: () => void;
  stringkey?: string;
  isAnimation?: boolean;
} & PopupProps;
