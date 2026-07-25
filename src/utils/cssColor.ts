/**
 * Parse / normalize CSS colors for the format toolbar and field sanitization.
 * Rejects unsafe values (url(), expressions, multiple declarations, etc.).
 */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC_RE =
  /^(rgb|rgba|hsl|hsla)\(\s*[-+.\d%]+\s*[,/\s]+[-+.\d%]+\s*[,/\s]+[-+.\d%]+(?:\s*[,/\s]+[-+.\d%]+\s*)?\)$/i;
const NAMED_RE = /^[a-z]+$/i;

function looksUnsafe(value: string): boolean {
  return /[;{}]|url\s*\(|expression\s*\(|@import|javascript:/i.test(value);
}

/** Return a sanitized CSS color string, or null if invalid / unsafe. */
export function sanitizeCssColor(value: string): string | null {
  const v = value.trim();
  if (!v || looksUnsafe(v)) return null;

  if (HEX_RE.test(v)) return v.toLowerCase();
  if (FUNC_RE.test(v)) return v.replace(/\s+/g, " ").trim();
  if (NAMED_RE.test(v)) {
    const lower = v.toLowerCase();
    // Keep inherit/currentColor so callers can decide to unwrap.
    if (lower === "inherit" || lower === "currentcolor") return lower;
    if (lower === "transparent") return "transparent";
    // Validate named colors via the browser when available.
    if (typeof document !== "undefined") {
      const el = document.createElement("span");
      el.style.color = "";
      el.style.color = lower;
      if (!el.style.color) return null;
    }
    return lower;
  }
  return null;
}

/** Pull a single `color:` value from an inline style attribute. */
export function extractColorFromStyle(style: string): string | null {
  if (!style) return null;
  const match = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(style);
  if (!match) return null;
  return sanitizeCssColor(match[1] ?? "");
}

/**
 * Normalize user input (hex, rgb, rgba, hsl, named) to a value suitable for
 * `document.execCommand('foreColor')`. Returns null if the color is invalid.
 * Prefers `#rrggbb` when the browser can resolve the color (alpha is dropped
 * for the native color input / foreColor path).
 */
export function normalizeCssColor(input: string): string | null {
  const safe = sanitizeCssColor(input);
  if (!safe) return null;
  if (safe === "inherit" || safe === "currentcolor" || safe === "transparent") {
    return safe;
  }

  if (typeof document === "undefined") return safe;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return safe;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = safe;
    const resolved = ctx.fillStyle;
    if (typeof resolved === "string" && HEX_RE.test(resolved)) {
      return resolved.toLowerCase();
    }
    // Canvas may return rgb(...) — keep as-is for execCommand.
    if (typeof resolved === "string" && sanitizeCssColor(resolved)) {
      return resolved;
    }
  } catch {
    // fall through
  }

  return safe;
}

export interface RgbaParts {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Resolve any CSS color to numeric `{ r, g, b, a }` parts (0-255 channels,
 * 0-1 alpha) using the browser. Returns the fallback if the color can't be
 * resolved. Used by the color picker to drive RGB/RGBA formatting + alpha.
 */
export function toRgbaParts(
  color: string,
  fallback: RgbaParts = { r: 51, g: 51, b: 51, a: 1 },
): RgbaParts {
  const safe = normalizeCssColor(color);
  if (!safe || typeof document === "undefined") return fallback;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = safe;
    const resolved = String(ctx.fillStyle);

    const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(resolved);
    if (hex) {
      return {
        r: parseInt(hex[1]!, 16),
        g: parseInt(hex[2]!, 16),
        b: parseInt(hex[3]!, 16),
        a: 1,
      };
    }
    const rgba =
      /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(
        resolved,
      );
    if (rgba) {
      return {
        r: Number(rgba[1]),
        g: Number(rgba[2]),
        b: Number(rgba[3]),
        a: rgba[4] !== undefined ? Number(rgba[4]) : 1,
      };
    }
  } catch {
    // ignore
  }
  return fallback;
}

/** Convert a CSS color to `#rrggbb` for `<input type="color">`. */
export function toHexColorInput(color: string, fallback = "#333333"): string {
  const normalized = normalizeCssColor(color);
  if (normalized && HEX_RE.test(normalized) && normalized.length === 7) {
    return normalized;
  }
  if (normalized && HEX_RE.test(normalized) && normalized.length === 4) {
    const r = normalized[1];
    const g = normalized[2];
    const b = normalized[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  if (typeof document === "undefined") return fallback;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = color;
    const resolved = String(ctx.fillStyle);
    if (/^#[0-9a-f]{6}$/i.test(resolved)) return resolved.toLowerCase();
    const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(resolved);
    if (rgb) {
      const hex = (n: string) =>
        Number(n).toString(16).padStart(2, "0");
      return `#${hex(rgb[1]!)}${hex(rgb[2]!)}${hex(rgb[3]!)}`;
    }
  } catch {
    // ignore
  }
  return fallback;
}
