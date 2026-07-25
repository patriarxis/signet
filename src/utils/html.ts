import {
  extractColorFromStyle,
  sanitizeCssColor,
} from "./cssColor";
import {
  extractFontFamilyFromStyle,
  extractFontSizeFromStyle,
  extractFontWeightFromStyle,
  htmlFontSizeToCss,
  sanitizeCssFontFamily,
} from "./cssFont";

/**
 * Decode HTML character entities to plain text (`&amp;` → `&`, `&lt;` → `<`, …).
 * Loops so corrupted localStorage values like `&amp;amp;` fully unwind.
 * Does not interpret markup tags.
 */
export function decodeHtmlEntities(value: string): string {
  if (!value || !value.includes("&")) return value;

  let current = value;
  // Bound the loop — each pass peels one entity encoding layer.
  for (let i = 0; i < 8; i++) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = current;
    const next = textarea.value;
    if (next === current) break;
    current = next;
  }
  return current;
}

/**
 * Strip tags and return decoded plain text.
 * Always decodes entities — even when the string has no `<` — so committing
 * contenteditable `innerHTML` (`Founder &amp; CEO`) never stores the entity
 * literally.
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  if (html.includes("<")) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\u00a0/g, " ");
  }

  return decodeHtmlEntities(html).replace(/\u00a0/g, " ");
}

const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "S",
  "STRIKE",
  "A",
  "BR",
  "SPAN",
]);

function unwrapElement(el: HTMLElement, walk: (node: Node) => void) {
  const parent = el.parentNode;
  if (!parent) return;
  const children = Array.from(el.childNodes);
  children.forEach((child) => parent.insertBefore(child, el));
  parent.removeChild(el);
  children.forEach(walk);
}

function replaceFontWithStyledSpan(
  el: HTMLElement,
  doc: Document,
  walk: (node: Node) => void,
) {
  const parent = el.parentNode;
  if (!parent) return;

  const parts: string[] = [];

  const rawColor = el.getAttribute("color") || "";
  const safeColor = sanitizeCssColor(rawColor);
  if (
    safeColor &&
    safeColor !== "inherit" &&
    safeColor !== "currentcolor" &&
    safeColor !== "transparent"
  ) {
    parts.push(`color: ${safeColor}`);
  }

  const face = sanitizeCssFontFamily(el.getAttribute("face") || "");
  if (face) parts.push(`font-family: ${face}`);

  const sizeCss = htmlFontSizeToCss(el.getAttribute("size") || "");
  if (sizeCss) parts.push(`font-size: ${sizeCss}`);

  if (parts.length === 0) {
    unwrapElement(el, walk);
    return;
  }

  const span = doc.createElement("span");
  span.setAttribute("style", parts.join("; "));
  while (el.firstChild) {
    span.appendChild(el.firstChild);
  }
  parent.replaceChild(span, el);
  Array.from(span.childNodes).forEach(walk);
}

function buildSafeSpanStyle(styleAttr: string): string | null {
  const parts: string[] = [];

  const color = extractColorFromStyle(styleAttr);
  if (
    color &&
    color !== "inherit" &&
    color !== "currentcolor" &&
    color !== "transparent"
  ) {
    parts.push(`color: ${color}`);
  }

  const fontSize = extractFontSizeFromStyle(styleAttr);
  if (fontSize) parts.push(`font-size: ${fontSize}`);

  const fontFamily = extractFontFamilyFromStyle(styleAttr);
  if (fontFamily) parts.push(`font-family: ${fontFamily}`);

  const fontWeight = extractFontWeightFromStyle(styleAttr);
  if (fontWeight) parts.push(`font-weight: ${fontWeight}`);

  return parts.length > 0 ? parts.join("; ") : null;
}

export function sanitizeFieldHtml(html: string): string {
  const doc = new DOMParser().parseFromString(
    `<div>${html}</div>`,
    "text/html",
  );
  const root = doc.body.firstElementChild;
  if (!root) return stripHtml(html).trim();

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // Browsers often emit <font …> from execCommand. Normalize to a span
      // with safe inline styles for email HTML.
      if (el.tagName === "FONT") {
        replaceFontWithStyledSpan(el, doc, walk);
        return;
      }

      const children = Array.from(el.childNodes);
      if (!ALLOWED_TAGS.has(el.tagName)) {
        unwrapElement(el, walk);
        return;
      }

      if (el.tagName === "A") {
        const href = el.getAttribute("href") || "";
        Array.from(el.attributes).forEach((attr) =>
          el.removeAttribute(attr.name),
        );
        if (href && href !== "#") {
          el.setAttribute("href", href);
          el.setAttribute("target", "_blank");
        }
      } else if (el.tagName === "SPAN") {
        const safeStyle = buildSafeSpanStyle(el.getAttribute("style") || "");
        Array.from(el.attributes).forEach((attr) =>
          el.removeAttribute(attr.name),
        );
        if (safeStyle) {
          el.setAttribute("style", safeStyle);
          children.forEach(walk);
          return;
        }
        // Utility / empty spans from the editor — unwrap.
        unwrapElement(el, walk);
        return;
      } else {
        Array.from(el.attributes).forEach((attr) =>
          el.removeAttribute(attr.name),
        );
      }

      children.forEach(walk);
    }
  };

  Array.from(root.childNodes).forEach(walk);
  return root.innerHTML.replace(/\u00a0/g, " ").trim();
}

export function isHtmlEmpty(html: string): boolean {
  return !stripHtml(html).trim();
}
