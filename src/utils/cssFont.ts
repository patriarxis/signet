/**
 * Parse / sanitize font-size, font-family, and font-weight for the format
 * toolbar and field sanitization. Email-safe values only (no url()/expressions).
 */

function looksUnsafe(value: string): boolean {
  return /[;{}]|url\s*\(|expression\s*\(|@import|javascript:/i.test(value);
}

const FONT_SIZE_RE = /^(\d+(?:\.\d+)?)(px|pt|em|rem)$/i;

/** Common absolute sizes offered as presets in the size panel. */
export const FONT_SIZE_PRESETS = [
  "10px",
  "11px",
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "18px",
  "20px",
  "22px",
  "24px",
  "28px",
  "32px",
] as const;

/** Email-safe stacks shown in the format toolbar. */
export const EMAIL_SAFE_FONTS = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif" },
  {
    label: "System sans",
    value:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
] as const;

/** CSS-only weight choices for the inline toolbar dropdown. */
export const FONT_WEIGHT_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "400", value: "400" },
  { label: "Semibold", value: "600" },
  { label: "700", value: "700" },
  { label: "Bold", value: "bold" },
] as const;

const SAFE_FAMILY_RE = /^[a-z0-9\s'",\-_]+$/i;

/** Return a sanitized CSS font-size, or null if invalid. */
export function sanitizeCssFontSize(value: string): string | null {
  const v = value.trim().toLowerCase().replace(/\s+/g, "");
  if (!v || looksUnsafe(v)) return null;
  const match = FONT_SIZE_RE.exec(v);
  if (!match) return null;
  const num = Number(match[1]);
  if (!Number.isFinite(num) || num <= 0 || num > 200) return null;
  return `${num}${match[2]}`;
}

/**
 * Normalize typed size input: bare numbers become `px`; accept px/pt/em/rem.
 */
export function normalizeFontSizeInput(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (/^\d+(\.\d+)?$/.test(v)) return sanitizeCssFontSize(`${v}px`);
  return sanitizeCssFontSize(v);
}

/** Pull a single `font-size:` value from an inline style attribute. */
export function extractFontSizeFromStyle(style: string): string | null {
  if (!style) return null;
  const match = /(?:^|;)\s*font-size\s*:\s*([^;]+)/i.exec(style);
  if (!match) return null;
  return sanitizeCssFontSize(match[1] ?? "");
}

/** Return a sanitized CSS font-family stack, or null if invalid / unsafe. */
export function sanitizeCssFontFamily(value: string): string | null {
  const v = value.trim().replace(/\s+/g, " ");
  if (!v || looksUnsafe(v) || !SAFE_FAMILY_RE.test(v)) return null;

  const lower = v.toLowerCase().replace(/['"]/g, "");
  for (const font of EMAIL_SAFE_FONTS) {
    const label = font.label.toLowerCase();
    const stack = font.value.toLowerCase().replace(/['"]/g, "");
    if (lower === label || lower === stack || lower.startsWith(`${label},`)) {
      return font.value;
    }
  }

  // Allow other safe stacks that end with a generic family.
  if (
    /\b(serif|sans-serif|monospace|cursive|fantasy|system-ui)\s*$/i.test(v)
  ) {
    return v;
  }

  return null;
}

/** Pull a single `font-family:` value from an inline style attribute. */
export function extractFontFamilyFromStyle(style: string): string | null {
  if (!style) return null;
  const match = /(?:^|;)\s*font-family\s*:\s*([^;]+)/i.exec(style);
  if (!match) return null;
  return sanitizeCssFontFamily(match[1] ?? "");
}

/** Return a sanitized CSS font-weight, or null if invalid. */
export function sanitizeCssFontWeight(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v || looksUnsafe(v)) return null;
  if (v === "normal" || v === "bold" || v === "bolder" || v === "lighter") {
    return v;
  }
  if (/^[1-9]00$/.test(v)) return v;
  return null;
}

/** Pull a single `font-weight:` value from an inline style attribute. */
export function extractFontWeightFromStyle(style: string): string | null {
  if (!style) return null;
  const match = /(?:^|;)\s*font-weight\s*:\s*([^;]+)/i.exec(style);
  if (!match) return null;
  return sanitizeCssFontWeight(match[1] ?? "");
}

/** Map HTML `<font size="1-7">` to a CSS px size. */
export function htmlFontSizeToCss(size: string): string | null {
  const map: Record<string, string> = {
    "1": "10px",
    "2": "13px",
    "3": "16px",
    "4": "18px",
    "5": "24px",
    "6": "32px",
    "7": "48px",
  };
  return map[size.trim()] ?? null;
}

/** Short label for toolbar display (e.g. Arial from a full stack). */
export function fontFamilyLabel(family: string | null): string | null {
  if (!family) return null;
  const safe = sanitizeCssFontFamily(family);
  if (!safe) return null;
  const known = EMAIL_SAFE_FONTS.find((f) => f.value === safe);
  return known?.label ?? safe.split(",")[0]?.replace(/['"]/g, "").trim() ?? null;
}
