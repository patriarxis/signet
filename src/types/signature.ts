export interface BodyLink {
  text: string;
  url: string;
}

/** Per-signature logo chrome. The image file itself (`logoSrc`) stays shared. */
export interface LogoStyle {
  /** Empty = signature template default. Accepts px or %. */
  width: string;
  /** Empty = signature template default. Accepts px or %. */
  height: string;
  /** Empty = no radius. Accepts px or %. */
  borderRadius: string;
  /** Empty / https:// = no link. */
  link: string;
}

/**
 * Text fields whose content is shared as plain text, while presentation
 * lives in per-signature `fieldStyles`.
 */
export const FIELD_STYLE_FIELDS = [
  "name",
  "description",
  "companyName",
  "companyTagline",
  "phone",
  "email",
  "website",
  "copyrights",
  "disclaimer",
] as const;

export type FieldStyleField = (typeof FIELD_STYLE_FIELDS)[number];

/** Per-signature, per-field presentation overrides. */
export interface FieldStyle {
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  /** CSS font-weight (normal, 400, 600, 700, bold, …) — not semantic `<b>`. */
  fontWeight?: string;
  /**
   * Semantic emphasis tri-state (not CSS):
   * - `undefined` — use template `emphasize` default
   * - `true` — force on (`<b>` / `<i>` / …)
   * - `false` — force off (overrides template default)
   */
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}

export type SignatureFieldStyles = Partial<Record<FieldStyleField, FieldStyle>>;

export interface UserData {
  name: string;
  description: string;
  companyName: string;
  companyTagline: string;
  phone: string;
  email: string;
  website: string;
  websiteUrl: string;
  logoSrc: string;
  logoStyles: Record<string, LogoStyle>;
  /**
   * Per-signature field presentation.
   * Key = signature id (`dark-edge`, `clean-slate`, …).
   * Shared text content stays in the top-level string fields.
   */
  fieldStyles: Record<string, SignatureFieldStyles>;
  bodyLinks: BodyLink[];
  socialLinks: BodyLink[];
  copyrights: string;
  disclaimer: string;
}

export const DEFAULT_LOGO_SRC = "https://placehold.co/56x56";

export const defaultLogoStyle = (): LogoStyle => ({
  width: "",
  height: "",
  borderRadius: "",
  link: "",
});

export const defaultUserData = (): UserData => ({
  name: "John Doe",
  description: "Founder & CEO",
  companyName: "Best Co.",
  companyTagline: "The best company ever",
  phone: "+00 548 562 2548",
  email: "example@email.com",
  website: "website",
  websiteUrl: "https://",
  logoSrc: DEFAULT_LOGO_SRC,
  logoStyles: {},
  fieldStyles: {},
  bodyLinks: [
    { text: "Link", url: "https://" },
    { text: "Link", url: "https://" },
    { text: "Link", url: "https://" },
  ],
  socialLinks: [
    { text: "+00 548 562 2548", url: "tel:+005485622548" },
    { text: "example@email.com", url: "mailto:example@email.com" },
    { text: "LinkedIn", url: "https://" },
  ],
  copyrights: "© 2026 Best Co.",
  disclaimer:
    "This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed. Please notify the sender immediately by e-mail if you have received this e-mail by mistake and delete this e-mail from your system. If you are not the intended recipient you are notified that disclosing, copying, distributing or taking any action in reliance on the contents of this information is strictly prohibited.",
});
