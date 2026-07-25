import type { InjectionKey, Reactive } from "vue";
import type {
  BodyLink,
  FieldStyle,
  FieldStyleField,
  LogoStyle,
  UserData,
} from "../types/signature";

export type SignatureEditor = {
  userData: Reactive<UserData>;
  updateField: <K extends keyof UserData>(key: K, value: UserData[K]) => void;
  updateLogoStyle: (key: string, patch: Partial<LogoStyle>) => void;
  updateFieldStyle: (
    styleKey: string,
    field: FieldStyleField,
    patch: Partial<FieldStyle>,
  ) => void;
  updateLink: (
    list: "bodyLinks" | "socialLinks",
    index: number,
    patch: Partial<BodyLink>,
  ) => void;
};

export const signatureEditorKey: InjectionKey<SignatureEditor> =
  Symbol("signatureEditor");
