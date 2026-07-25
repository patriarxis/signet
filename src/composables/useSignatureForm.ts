import { reactive, watch } from "vue";
import {
  FIELD_STYLE_FIELDS,
  defaultLogoStyle,
  defaultUserData,
  type BodyLink,
  type FieldStyle,
  type FieldStyleField,
  type LogoStyle,
  type SignatureFieldStyles,
  type UserData,
} from "../types/signature";
import { stripHtml, decodeHtmlEntities } from "../utils/html";
import {
  sanitizeCssFontFamily,
  sanitizeCssFontSize,
  sanitizeCssFontWeight,
} from "../utils/cssFont";
import { sanitizeCssColor } from "../utils/cssColor";

const STORAGE_KEY = "signet-user-data";

const PLAIN_TEXT_FIELDS = [
  ...FIELD_STYLE_FIELDS,
  "websiteUrl",
] as const satisfies readonly (keyof UserData)[];

function normalizeLength(value: unknown, fallback = ""): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? `${value}px` : fallback;
  }
  if (typeof value === "string") return value;
  return fallback;
}

function normalizeLogoStyle(value: unknown): LogoStyle {
  const base = defaultLogoStyle();
  if (!value || typeof value !== "object") return base;
  const style = value as Partial<LogoStyle> & {
    logoWidth?: unknown;
    logoHeight?: unknown;
    logoBorderRadius?: unknown;
    logoLink?: unknown;
  };
  return {
    width: normalizeLength(style.width ?? style.logoWidth, base.width),
    height: normalizeLength(style.height ?? style.logoHeight, base.height),
    borderRadius: normalizeLength(
      style.borderRadius ?? style.logoBorderRadius,
      base.borderRadius,
    ),
    link:
      typeof style.link === "string"
        ? style.link
        : typeof style.logoLink === "string"
          ? style.logoLink
          : base.link,
  };
}

function normalizeFieldStyle(value: unknown): FieldStyle | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const next: FieldStyle = {};

  if (typeof raw.color === "string") {
    const color = sanitizeCssColor(raw.color);
    if (
      color &&
      color !== "inherit" &&
      color !== "currentcolor" &&
      color !== "transparent"
    ) {
      next.color = color;
    }
  }
  if (typeof raw.fontSize === "string") {
    const fontSize = sanitizeCssFontSize(raw.fontSize);
    if (fontSize) next.fontSize = fontSize;
  }
  if (typeof raw.fontFamily === "string") {
    const fontFamily = sanitizeCssFontFamily(raw.fontFamily);
    if (fontFamily) next.fontFamily = fontFamily;
  }
  if (typeof raw.fontWeight === "string") {
    const fontWeight = sanitizeCssFontWeight(raw.fontWeight);
    if (fontWeight) next.fontWeight = fontWeight;
  }
  // Tri-state emphasis: keep explicit `true` and `false` (false overrides
  // template defaults). Only drop when the key is absent / non-boolean.
  if (raw.bold === true || raw.bold === false) next.bold = raw.bold;
  if (raw.italic === true || raw.italic === false) next.italic = raw.italic;
  if (raw.underline === true || raw.underline === false) {
    next.underline = raw.underline;
  }
  if (raw.strike === true || raw.strike === false) next.strike = raw.strike;

  return Object.keys(next).length > 0 ? next : null;
}

function normalizeFieldStyles(
  value: unknown,
): Record<string, SignatureFieldStyles> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, SignatureFieldStyles> = {};

  for (const [styleKey, fields] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!fields || typeof fields !== "object") continue;
    const normalized: SignatureFieldStyles = {};
    for (const field of FIELD_STYLE_FIELDS) {
      const entry = normalizeFieldStyle(
        (fields as Record<string, unknown>)[field],
      );
      if (entry) normalized[field] = entry;
    }
    if (Object.keys(normalized).length > 0) {
      out[styleKey] = normalized;
    }
  }

  return out;
}

function plainField(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  // Decode leftover `&amp;` / `&amp;amp;` from older buggy commits.
  return decodeHtmlEntities(stripHtml(value)).replace(/\u00a0/g, " ");
}

function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUserData();
    const parsed = JSON.parse(raw) as Partial<UserData> & {
      logoLink?: unknown;
      logoWidth?: unknown;
      logoHeight?: unknown;
      logoBorderRadius?: unknown;
    };
    const base = defaultUserData();

    let logoStyles: Record<string, LogoStyle> = {};
    if (parsed.logoStyles && typeof parsed.logoStyles === "object") {
      logoStyles = Object.fromEntries(
        Object.entries(parsed.logoStyles).map(([key, style]) => [
          key,
          normalizeLogoStyle(style),
        ]),
      );
    }

    const migrated: UserData = {
      ...base,
      name: plainField(parsed.name, base.name),
      description: plainField(parsed.description, base.description),
      companyName: plainField(parsed.companyName, base.companyName),
      companyTagline: plainField(parsed.companyTagline, base.companyTagline),
      phone: plainField(parsed.phone, base.phone),
      email: plainField(parsed.email, base.email),
      website: plainField(parsed.website, base.website),
      websiteUrl:
        typeof parsed.websiteUrl === "string"
          ? parsed.websiteUrl
          : base.websiteUrl,
      logoSrc:
        typeof parsed.logoSrc === "string" ? parsed.logoSrc : base.logoSrc,
      logoStyles,
      fieldStyles: normalizeFieldStyles(parsed.fieldStyles),
      copyrights: plainField(parsed.copyrights, base.copyrights),
      disclaimer: plainField(parsed.disclaimer, base.disclaimer),
      bodyLinks: Array.isArray(parsed.bodyLinks)
        ? parsed.bodyLinks.map(normalizeLink)
        : base.bodyLinks,
      socialLinks: Array.isArray(parsed.socialLinks)
        ? parsed.socialLinks.map(normalizeLink)
        : base.socialLinks,
    };

    return migrated;
  } catch {
    return defaultUserData();
  }
}

function normalizeLink(link: Partial<BodyLink>): BodyLink {
  return {
    text: decodeHtmlEntities(stripHtml(String(link?.text ?? ""))).replace(
      /\u00a0/g,
      " ",
    ),
    url: String(link?.url ?? ""),
  };
}

function persist(data: UserData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function isFieldStyleField(key: string): key is FieldStyleField {
  return (FIELD_STYLE_FIELDS as readonly string[]).includes(key);
}

const EMPHASIS_KEYS = ["bold", "italic", "underline", "strike"] as const;

function pruneFieldStyle(style: FieldStyle): FieldStyle | null {
  const next: FieldStyle = {};
  if (style.color) next.color = style.color;
  if (style.fontSize) next.fontSize = style.fontSize;
  if (style.fontFamily) next.fontFamily = style.fontFamily;
  if (style.fontWeight) next.fontWeight = style.fontWeight;
  // Persist explicit false so template defaults can be overridden.
  if (style.bold === true || style.bold === false) next.bold = style.bold;
  if (style.italic === true || style.italic === false) next.italic = style.italic;
  if (style.underline === true || style.underline === false) {
    next.underline = style.underline;
  }
  if (style.strike === true || style.strike === false) next.strike = style.strike;
  return Object.keys(next).length > 0 ? next : null;
}

export function useSignatureForm() {
  const userData = reactive<UserData>(loadUserData());

  const updateField = <K extends keyof UserData>(
    key: K,
    value: UserData[K],
  ) => {
    if (
      typeof value === "string" &&
      (PLAIN_TEXT_FIELDS as readonly string[]).includes(key as string)
    ) {
      userData[key] = decodeHtmlEntities(stripHtml(value)).replace(
        /\u00a0/g,
        " ",
      ) as UserData[K];
      return;
    }
    userData[key] = value;
  };

  const updateLogoStyle = (key: string, patch: Partial<LogoStyle>) => {
    const current = userData.logoStyles[key] ?? defaultLogoStyle();
    userData.logoStyles[key] = { ...current, ...patch };
  };

  const updateFieldStyle = (
    styleKey: string,
    field: FieldStyleField,
    patch: Partial<FieldStyle>,
  ) => {
    if (!styleKey || !isFieldStyleField(field)) return;

    const sigStyles = { ...(userData.fieldStyles[styleKey] ?? {}) };
    const current = { ...(sigStyles[field] ?? {}) };

    (Object.keys(patch) as (keyof FieldStyle)[]).forEach((key) => {
      const value = patch[key];
      const isEmphasis = (EMPHASIS_KEYS as readonly string[]).includes(key);

      if (value === undefined || value === null) {
        delete current[key];
        return;
      }
      // Emphasis is tri-state: explicit `false` must persist (override template).
      if (isEmphasis && typeof value === "boolean") {
        current[key] = value as never;
        return;
      }
      if (value === false || value === "") {
        delete current[key];
        return;
      }
      current[key] = value as never;
    });

    const pruned = pruneFieldStyle(current);
    if (!pruned) {
      delete sigStyles[field];
    } else {
      sigStyles[field] = pruned;
    }

    if (Object.keys(sigStyles).length === 0) {
      delete userData.fieldStyles[styleKey];
    } else {
      userData.fieldStyles[styleKey] = sigStyles;
    }
  };

  const updateLink = (
    list: "bodyLinks" | "socialLinks",
    index: number,
    patch: Partial<BodyLink>,
  ) => {
    const current = userData[list][index];
    if (!current) return;
    const next = { ...current, ...patch };
    if (typeof patch.text === "string") {
      next.text = decodeHtmlEntities(stripHtml(patch.text)).replace(
        /\u00a0/g,
        " ",
      );
    }
    userData[list][index] = next;
  };

  const addLink = (list: "bodyLinks" | "socialLinks") => {
    userData[list].push({ text: "", url: "" });
  };

  const removeLink = (list: "bodyLinks" | "socialLinks", index: number) => {
    userData[list].splice(index, 1);
  };

  const resetToDefaults = () => {
    const defaults = defaultUserData();
    userData.name = defaults.name;
    userData.description = defaults.description;
    userData.companyName = defaults.companyName;
    userData.companyTagline = defaults.companyTagline;
    userData.phone = defaults.phone;
    userData.email = defaults.email;
    userData.website = defaults.website;
    userData.websiteUrl = defaults.websiteUrl;
    userData.logoSrc = defaults.logoSrc;
    userData.logoStyles = {};
    userData.fieldStyles = {};
    userData.copyrights = defaults.copyrights;
    userData.disclaimer = defaults.disclaimer;
    userData.bodyLinks.splice(
      0,
      userData.bodyLinks.length,
      ...defaults.bodyLinks,
    );
    userData.socialLinks.splice(
      0,
      userData.socialLinks.length,
      ...defaults.socialLinks,
    );
  };

  watch(userData, (value) => persist(value), { deep: true });

  return {
    userData,
    updateField,
    updateLogoStyle,
    updateFieldStyle,
    updateLink,
    addLink,
    removeLink,
    resetToDefaults,
  };
}
