<script setup lang="ts">
import {
  PhEyedropper,
  PhLink,
  PhTextAa,
  PhTextB,
  PhTextBolder,
  PhTextItalic,
  PhTextStrikethrough,
  PhTextT,
  PhTextUnderline,
} from "@phosphor-icons/vue";
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from "vue";
import { signatureEditorKey } from "../composables/signatureEditor";
import type { FieldStyle, FieldStyleField } from "../types/signature";
import { clampFixedBubblePosition } from "../utils/clampFixedBubble";
import {
  normalizeCssColor,
  sanitizeCssColor,
  toHexColorInput,
  toRgbaParts,
} from "../utils/cssColor";
import {
  EMAIL_SAFE_FONTS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_OPTIONS,
  fontFamilyLabel,
  normalizeFontSizeInput,
  sanitizeCssFontFamily,
  sanitizeCssFontWeight,
} from "../utils/cssFont";
import ToolButton from "./ToolButton.vue";

type Panel = "none" | "link" | "color";
type FontMenu = "size" | "family" | "weight" | null;

const editor = inject(signatureEditorKey, null);

const visible = ref(false);
const top = ref(0);
const left = ref(0);
const panel = ref<Panel>("none");
const linkUrl = ref("https://");
const linkInput = ref<HTMLInputElement | null>(null);
type ColorModel = "hex" | "rgb" | "rgba";

const COLOR_MODEL_OPTIONS: { value: ColorModel; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "rgb", label: "RGB" },
  { value: "rgba", label: "RGBA" },
];

const colorHex = ref("#333333");
const colorDraft = ref("#333333");
const colorModel = ref<ColorModel>("hex");
const colorModelOpen = ref(false);
const alpha = ref(1);
/** Discrete RGB(A) channel drafts — kept in sync with HSV / spectrum. */
const channelR = ref(51);
const channelG = ref(51);
const channelB = ref(51);
const supportsEyeDropper = ref(false);
const hue = ref(0);
const saturation = ref(0);
const brightness = ref(20);
const spectrumEl = ref<HTMLElement | null>(null);
const fontSizeDraft = ref("14px");
const fontFamilyDraft = ref<string>(EMAIL_SAFE_FONTS[0]!.value);
const fontWeightDraft = ref("normal");
/** Custom in-bubble font menu — avoids native <select> vs selection listeners. */
const fontMenuOpen = ref<FontMenu>(null);
const bubbleEl = ref<HTMLElement | null>(null);
let savedRange: Range | null = null;
/** Field that owns the open toolbar — survives toolbar control interaction. */
let lockedField: HTMLElement | null = null;

const isBold = ref(false);
const isItalic = ref(false);
const isUnderline = ref(false);
const isStrike = ref(false);
const isLink = ref(false);
const hasColor = ref(false);
const hasFontSize = ref(false);
const hasFontFamily = ref(false);
const hasFontWeight = ref(false);
const currentFontSize = ref<string | null>(null);
const currentFontFamily = ref<string | null>(null);
const currentFontWeight = ref<string | null>(null);

const iconSize = 16;
const mod = computed(() =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/i.test(navigator.userAgent)
    ? "⌘"
    : "Ctrl",
);

/** Resolved theme text color for the swatch when no explicit color is set. */
function themeTextColorHex(): string {
  if (typeof document === "undefined") return "#333333";
  const resolved =
    getComputedStyle(document.documentElement).color ||
    getComputedStyle(document.body).color ||
    "#000000";
  return toHexColorInput(resolved, "#333333");
}

const displayColor = computed(() => colorHex.value || themeTextColorHex());

const colorModelLabel = computed(
  () =>
    COLOR_MODEL_OPTIONS.find((option) => option.value === colorModel.value)
      ?.label ?? "HEX",
);

const fontSizeLabel = computed(() =>
  fontSizeDraft.value
    ? fontSizeDraft.value.replace(/px$/i, "")
    : "Size",
);

const fontFamilyTriggerLabel = computed(
  () => fontFamilyLabel(fontFamilyDraft.value) || "Font",
);

const fontWeightLabel = computed(() => {
  if (!fontWeightDraft.value) return "Weight";
  const match = FONT_WEIGHT_OPTIONS.find(
    (opt) => opt.value === fontWeightDraft.value,
  );
  return match?.label ?? fontWeightDraft.value;
});

/** Live preview color (honours alpha) for the picker swatch. */
const previewColor = computed(() => {
  const [r, g, b] = hsvToRgb(
    hue.value,
    saturation.value / 100,
    brightness.value / 100,
  );
  return `rgba(${r}, ${g}, ${b}, ${alpha.value})`;
});

function inSignetField(node: Node | null): HTMLElement | null {
  if (!node) return null;
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement;
  return el?.closest("[data-signet-field]") as HTMLElement | null;
}

function lockField(field: HTMLElement | null) {
  if (field?.isConnected) lockedField = field;
}

function clearFieldLock() {
  lockedField = null;
}

function activeField(): HTMLElement | null {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.matches("[data-signet-field]")) {
    lockField(active);
    return active;
  }
  const selection = window.getSelection();
  if (selection?.anchorNode) {
    const selected = inSignetField(selection.anchorNode);
    if (selected) {
      lockField(selected);
      return selected;
    }
  }
  if (savedRange) {
    const fromRange = inSignetField(savedRange.commonAncestorContainer);
    if (fromRange) {
      lockField(fromRange);
      return fromRange;
    }
  }
  // Fall back to the field that opened the toolbar when focus/selection left it.
  if (lockedField?.isConnected) return lockedField;
  return null;
}

function fieldIdentity(field = activeField()): {
  styleKey: string;
  field: FieldStyleField;
} | null {
  const styleKey = field?.dataset.signetStyleKey;
  const fieldName = field?.dataset.signetFieldName as FieldStyleField | undefined;
  if (!styleKey || !fieldName) return null;
  return { styleKey, field: fieldName };
}

function storedStyle(field = activeField()): FieldStyle {
  const identity = fieldIdentity(field);
  if (!identity || !editor) return {};
  return (
    editor.userData.fieldStyles[identity.styleKey]?.[identity.field] ?? {}
  );
}

function updateStoredStyle(patch: Partial<FieldStyle>, field = activeField()) {
  const identity = fieldIdentity(field);
  if (!identity || !editor) return false;
  editor.updateFieldStyle(identity.styleKey, identity.field, patch);
  return true;
}

function fieldIsEmpty(field: HTMLElement) {
  if (field.classList.contains("is-empty")) return true;
  const text = (field.textContent ?? "").replace(/\u00a0/g, " ").trim();
  return text.length === 0;
}

function selectionInField(field: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false;
  }
  const anchor = inSignetField(selection.anchorNode);
  return anchor === field;
}

function positionBelow(field: HTMLElement, remeasure = false) {
  const rect = field.getBoundingClientRect();
  const bw = bubbleEl.value?.offsetWidth || 240;
  const bh = bubbleEl.value?.offsetHeight || 44;
  const pos = clampFixedBubblePosition(rect, bw, bh);
  top.value = pos.top;
  left.value = pos.left;

  // Re-clamp after layout once the bubble is measurable (or after a panel expands).
  if (remeasure || !bubbleEl.value?.offsetWidth) {
    void nextTick(() => {
      requestAnimationFrame(() => {
        if (!visible.value) return;
        const measured = clampFixedBubblePosition(
          field.getBoundingClientRect(),
          bubbleEl.value?.offsetWidth || bw,
          bubbleEl.value?.offsetHeight || bh,
        );
        top.value = measured.top;
        left.value = measured.left;
      });
    });
  }
}

function selectionAnchorEl(): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const node = selection.getRangeAt(0).commonAncestorContainer;
  return node.nodeType === Node.ELEMENT_NODE
    ? (node as HTMLElement)
    : node.parentElement;
}

function readSelectionColor(): string | null {
  try {
    const raw = document.queryCommandValue("foreColor");
    if (raw && String(raw).trim()) {
      return String(raw).trim();
    }
  } catch {
    // ignore
  }

  const el = selectionAnchorEl();
  if (!el) return null;
  return window.getComputedStyle(el).color || null;
}

/**
 * True when the caret/selection is inside (or contains) one of the given
 * semantic tags within `field`. Ignores CSS font-weight / font-style /
 * text-decoration so Weight and template styles never light up Bold etc.
 */
function nodeOrAncestorHasTag(
  start: Node | null,
  tags: readonly string[],
  boundary: HTMLElement,
): boolean {
  let el: HTMLElement | null =
    start?.nodeType === Node.ELEMENT_NODE
      ? (start as HTMLElement)
      : (start?.parentElement ?? null);
  while (el && boundary.contains(el)) {
    if (tags.includes(el.tagName)) return true;
    if (el === boundary) break;
    el = el.parentElement;
  }
  return false;
}

function selectionHasSemanticTag(
  tags: readonly string[],
  field: HTMLElement,
): boolean {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const inField =
      field.contains(range.commonAncestorContainer) ||
      inSignetField(range.commonAncestorContainer) === field;
    if (inField) {
      if (nodeOrAncestorHasTag(range.startContainer, tags, field)) return true;
      if (nodeOrAncestorHasTag(range.endContainer, tags, field)) return true;
      if (!range.collapsed) {
        try {
          const fragment = range.cloneContents();
          for (const tag of tags) {
            if (fragment.querySelector(tag.toLowerCase())) return true;
          }
        } catch {
          // Some ranges cannot be cloned; fall through.
        }
      }
      // Caret/selection is in the field but not in a semantic tag.
      return false;
    }
  }

  // No usable selection (empty focused field, etc.) — any leftover tag in DOM.
  for (const tag of tags) {
    if (field.querySelector(tag.toLowerCase())) return true;
  }
  return false;
}

const BOLD_TAGS = ["B", "STRONG"] as const;
const ITALIC_TAGS = ["I", "EM"] as const;
const UNDERLINE_TAGS = ["U"] as const;
const STRIKE_TAGS = ["S", "STRIKE", "DEL"] as const;

function syncCommandState(field: HTMLElement) {
  const style = storedStyle(field);
  // Tag-only (or stored semantic flags) — never queryCommandState, which is
  // true for CSS font-weight / font-style / text-decoration alone.
  // Explicit `true` lights the button; `false`/unset rely on live tags
  // (template defaults render as tags when effective).
  isBold.value =
    selectionHasSemanticTag(BOLD_TAGS, field) || style.bold === true;
  isItalic.value =
    selectionHasSemanticTag(ITALIC_TAGS, field) || style.italic === true;
  isUnderline.value =
    selectionHasSemanticTag(UNDERLINE_TAGS, field) || style.underline === true;
  isStrike.value =
    selectionHasSemanticTag(STRIKE_TAGS, field) || style.strike === true;

  const selection = window.getSelection();
  let anchor: HTMLElement | null = null;
  if (selection && selection.rangeCount > 0) {
    const node = selection.getRangeAt(0).commonAncestorContainer;
    anchor =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement).closest("a")
        : node.parentElement?.closest("a") ?? null;
  }
  if (!anchor) {
    anchor = field.closest("a");
  }
  isLink.value = !!anchor;

  const color = style.color || readSelectionColor();
  hasColor.value = !!style.color;
  colorHex.value = toHexColorInput(
    color || themeTextColorHex(),
    themeTextColorHex(),
  );
  alpha.value = toRgbaParts(color || colorHex.value).a;
  colorDraft.value = style.color || colorHex.value;
  syncHsvFromHex(colorHex.value);
  syncChannelsFromHsv();

  const fontSize = style.fontSize || null;
  hasFontSize.value = !!fontSize;
  currentFontSize.value = fontSize;
  fontSizeDraft.value = fontSize || "";

  const fontFamily = style.fontFamily || null;
  hasFontFamily.value = !!fontFamily;
  currentFontFamily.value = fontFamily;
  fontFamilyDraft.value = fontFamily || "";

  const fontWeight = style.fontWeight || null;
  hasFontWeight.value = !!fontWeight;
  currentFontWeight.value = fontWeight;
  fontWeightDraft.value = fontWeight || "";
}

function parkToolbar(host: HTMLElement | null) {
  // Color / link panels must stay open even if the editable host briefly
  // disconnects during a reactive style commit (e.g. picking a color model).
  if (!host?.isConnected) {
    if (panel.value !== "none") visible.value = true;
    return;
  }
  lockField(host);
  visible.value = true;
  positionBelow(host);
}

function updateState() {
  const field = activeField();
  const focusInBubble = !!(
    bubbleEl.value &&
    document.activeElement instanceof Node &&
    bubbleEl.value.contains(document.activeElement)
  );

  // Keep toolbar while a custom font/color menu is open (selection often
  // collapses when clicking toolbar controls — that must not hide us).
  if (fontMenuOpen.value || colorModelOpen.value) {
    parkToolbar(
      field ||
        (savedRange && inSignetField(savedRange.commonAncestorContainer)) ||
        (lockedField?.isConnected ? lockedField : null),
    );
    return;
  }

  // Keep toolbar while interacting with bubble controls (inputs, link, color).
  if (focusInBubble && field) {
    parkToolbar(field);
    return;
  }

  if (panel.value !== "none") {
    // Keep toolbar parked under the field that owned the selection.
    parkToolbar(
      field ||
        (savedRange && inSignetField(savedRange.commonAncestorContainer)) ||
        (lockedField?.isConnected ? lockedField : null),
    );
    return;
  }

  if (!field || document.activeElement !== field) {
    // Allow selection-driven show even if focus moved oddly, but require field
    if (!field) {
      visible.value = false;
      clearFieldLock();
      return;
    }
  }

  const focused = document.activeElement === field;
  const hasSelection = selectionInField(field);
  const empty = fieldIsEmpty(field);

  if ((focused && empty) || hasSelection) {
    lockField(field);
    positionBelow(field);
    syncCommandState(field);
    visible.value = true;
    return;
  }

  visible.value = false;
  clearFieldLock();
}

function notifyField() {
  const field = activeField();
  field?.dispatchEvent(new Event("input", { bubbles: true }));
}

function run(command: string, value?: string) {
  const field = activeField();
  if (["bold", "italic", "underline", "strikeThrough"].includes(command)) {
    // Force semantic tags (<b>/<i>/<u>/<s>) instead of CSS declarations.
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      // Optional legacy API.
    }
  }
  document.execCommand(command, false, value);
  const semanticKey: Record<string, keyof FieldStyle> = {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikeThrough: "strike",
  };
  const tagSets: Record<string, readonly string[]> = {
    bold: BOLD_TAGS,
    italic: ITALIC_TAGS,
    underline: UNDERLINE_TAGS,
    strikeThrough: STRIKE_TAGS,
  };
  const key = semanticKey[command];
  const tags = tagSets[command];
  if (key && tags && field) {
    // Persist from actual tags — never queryCommandState (CSS weight looks "bold").
    // Explicit `false` overrides template `emphasize` defaults on re-render/blur.
    const active = selectionHasSemanticTag(tags, field);
    updateStoredStyle({ [key]: active } as Partial<FieldStyle>, field);
  }
  notifyField();
  updateState();
}

function restoreSelection() {
  if (!savedRange) return;
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(savedRange);
}

function saveSelection() {
  const selection = window.getSelection();
  savedRange =
    selection && selection.rangeCount > 0
      ? selection.getRangeAt(0).cloneRange()
      : null;
}

function closeFontMenus() {
  fontMenuOpen.value = null;
}

function closePanel() {
  panel.value = "none";
  colorModelOpen.value = false;
  closeFontMenus();
  savedRange = null;
  updateState();
}

function toggleFontMenu(menu: Exclude<FontMenu, null>, event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  const field = activeField();
  if (!field && !lockedField) return;
  lockField(field || lockedField);
  saveSelection();
  colorModelOpen.value = false;
  fontMenuOpen.value = fontMenuOpen.value === menu ? null : menu;
  parkToolbar(field || lockedField);
}

function pickFontSize(value: string) {
  fontSizeDraft.value = value;
  closeFontMenus();
  applyFontSize();
}

function pickFontFamily(value: string) {
  fontFamilyDraft.value = value;
  closeFontMenus();
  applyFontFamily();
}

function pickFontWeight(value: string) {
  fontWeightDraft.value = value;
  closeFontMenus();
  applyFontWeight();
}

function applyFontChange(
  apply: (field: HTMLElement) => boolean,
) {
  const field = activeField();
  if (!field) return;
  lockField(field);
  if (!apply(field)) return;
  syncCommandState(field);
  visible.value = true;
  positionBelow(field);
}

function openLink() {
  const field = activeField();
  if (!field) return;

  closeFontMenus();
  lockField(field);
  saveSelection();

  let anchor: HTMLAnchorElement | null = null;
  if (savedRange) {
    const node = savedRange.commonAncestorContainer;
    anchor =
      (node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement).closest("a")
        : node.parentElement?.closest("a")) as HTMLAnchorElement | null;
  }
  if (!anchor) {
    anchor = field.closest("a");
  }

  linkUrl.value = anchor?.getAttribute("href") || "https://";
  panel.value = "link";
  visible.value = true;
  positionBelow(field, true);
  requestAnimationFrame(() => {
    linkInput.value?.focus();
    linkInput.value?.select();
  });
}

function applyLink() {
  const href = linkUrl.value.trim();
  if (!href || href === "https://") {
    closePanel();
    return;
  }
  restoreSelection();
  run("createLink", href);
  panel.value = "none";
  savedRange = null;
}

function removeLink() {
  restoreSelection();
  run("unlink");
  panel.value = "none";
  savedRange = null;
}

function openColor() {
  const field = activeField();
  if (!field) return;

  closeFontMenus();
  lockField(field);
  saveSelection();
  syncCommandState(field);
  const stored = storedStyle(field).color || colorHex.value;
  const parts = toRgbaParts(stored);
  alpha.value = parts.a;
  syncHsvFromHex(colorHex.value);
  syncChannelsFromHsv();
  colorModel.value = parts.a < 1 ? "rgba" : detectColorModel(stored);
  colorDraft.value = composeColor();
  colorModelOpen.value = false;
  panel.value = "color";
  visible.value = true;
  positionBelow(field, true);
}

function detectColorModel(value: string): ColorModel {
  const lower = value.trim().toLowerCase();
  if (lower.startsWith("rgba")) return "rgba";
  if (lower.startsWith("rgb")) return "rgb";
  return "hex";
}

/** Commit a resolved CSS color to the active field's stored style. */
function commitColor(raw: string) {
  const trimmed = raw.trim();
  const sanitized = sanitizeCssColor(trimmed);
  if (!sanitized || sanitized === "transparent") return false;

  if (sanitized === "inherit" || sanitized === "currentcolor") {
    updateStoredStyle({ color: undefined });
    hasColor.value = false;
  } else {
    // Keep rgb/rgba functional forms (normalizeCssColor drops alpha via canvas).
    const isFunc = /^(rgba?|hsla?)\(/i.test(sanitized);
    const normalized = isFunc
      ? sanitized
      : normalizeCssColor(sanitized) || sanitized;
    updateStoredStyle({ color: normalized });
    hasColor.value = true;
    colorHex.value = toHexColorInput(normalized, colorHex.value);
  }
  return true;
}

function onColorValueInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  colorDraft.value = value;
  const normalized = normalizeCssColor(value) || sanitizeCssColor(value);
  if (!normalized || normalized === "transparent") return;

  colorModel.value = detectColorModel(value);
  const parts = toRgbaParts(normalized);
  alpha.value = parts.a;
  syncHsvFromRgb(parts.r, parts.g, parts.b);
  syncChannelsFromHsv();
  commitColor(value);
}

function onColorModelChange() {
  colorDraft.value = composeColor();
  syncChannelsFromHsv();
  commitColor(colorDraft.value);
}

function toggleColorModelMenu(event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  closeFontMenus();
  colorModelOpen.value = !colorModelOpen.value;
}

/**
 * Switch HEX/RGB/RGBA. Must only close the model submenu — never the color
 * popover. Clicks use mousedown.prevent + stopPropagation so document-level
 * outside handlers cannot treat the option as "outside".
 */
function selectColorModel(model: ColorModel, event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  colorModel.value = model;
  colorModelOpen.value = false;
  panel.value = "color";
  visible.value = true;
  onColorModelChange();
  const field =
    activeField() || (lockedField?.isConnected ? lockedField : null);
  if (field) {
    lockField(field);
    positionBelow(field, true);
  }
}

/** Close the model menu on outside click without dismissing the color popover. */
function onColorModelOutside(event: Event) {
  if (!colorModelOpen.value) return;
  const target = event.target as Node | null;
  const root = bubbleEl.value?.querySelector(".color-model-dropdown");
  if (!root || !target || root.contains(target)) return;
  colorModelOpen.value = false;
}

function onColorPanelEscape() {
  if (colorModelOpen.value) {
    colorModelOpen.value = false;
    return;
  }
  closePanel();
}

function onAlphaInput() {
  syncChannelsFromHsv();
  applyCurrentColor();
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clampAlpha(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}

function formatAlpha(a: number): string {
  return String(clampAlpha(a));
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgb.map((part) => Math.round((part + m) * 255)) as [
    number,
    number,
    number,
  ];
}

function hsvToHex(h: number, s: number, v: number): string {
  return `#${hsvToRgb(h, s, v)
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Format the current HSV + alpha state per the selected color model. */
function composeColor(model: ColorModel = colorModel.value): string {
  const [r, g, b] = hsvToRgb(
    hue.value,
    saturation.value / 100,
    brightness.value / 100,
  );
  if (model === "rgb") return `rgb(${r}, ${g}, ${b})`;
  if (model === "rgba")
    return `rgba(${r}, ${g}, ${b}, ${formatAlpha(alpha.value)})`;
  return hsvToHex(hue.value, saturation.value / 100, brightness.value / 100);
}

function syncChannelsFromHsv() {
  const [r, g, b] = hsvToRgb(
    hue.value,
    saturation.value / 100,
    brightness.value / 100,
  );
  channelR.value = r;
  channelG.value = g;
  channelB.value = b;
}

function syncHsvFromRgb(r: number, g: number, b: number) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;
  let nextHue = 0;
  if (delta) {
    if (max === rr) nextHue = 60 * (((gg - bb) / delta) % 6);
    else if (max === gg) nextHue = 60 * ((bb - rr) / delta + 2);
    else nextHue = 60 * ((rr - gg) / delta + 4);
  }
  hue.value = (nextHue + 360) % 360;
  saturation.value = max ? (delta / max) * 100 : 0;
  brightness.value = max * 100;
}

function syncHsvFromHex(hex: string) {
  const normalized = toHexColorInput(hex, "#333333").slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  syncHsvFromRgb(r, g, b);
}

function applyCurrentColor() {
  colorHex.value = hsvToHex(
    hue.value,
    saturation.value / 100,
    brightness.value / 100,
  );
  colorDraft.value = composeColor();
  syncChannelsFromHsv();
  commitColor(colorDraft.value);
}

function applyHsv() {
  applyCurrentColor();
}

/** Live-apply discrete R/G/B(/A) channel inputs. */
function onChannelInput() {
  channelR.value = clampByte(Number(channelR.value));
  channelG.value = clampByte(Number(channelG.value));
  channelB.value = clampByte(Number(channelB.value));
  alpha.value = clampAlpha(Number(alpha.value));
  syncHsvFromRgb(channelR.value, channelG.value, channelB.value);
  colorHex.value = hsvToHex(
    hue.value,
    saturation.value / 100,
    brightness.value / 100,
  );
  colorDraft.value = composeColor();
  commitColor(colorDraft.value);
}

async function pickEyeDropper() {
  if (!supportsEyeDropper.value) return;
  const EyeDropperCtor = (
    window as unknown as {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    }
  ).EyeDropper;
  if (!EyeDropperCtor) return;
  try {
    const { sRGBHex } = await new EyeDropperCtor().open();
    if (!sRGBHex) return;
    alpha.value = 1;
    if (colorModel.value === "rgba") colorModel.value = "hex";
    syncHsvFromHex(sRGBHex);
    syncChannelsFromHsv();
    applyCurrentColor();
  } catch {
    // user dismissed the eyedropper
  }
}

function pickSpectrum(event: PointerEvent) {
  const spectrum = spectrumEl.value;
  if (!spectrum) return;
  spectrum.setPointerCapture?.(event.pointerId);
  const rect = spectrum.getBoundingClientRect();
  saturation.value = Math.max(
    0,
    Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
  );
  brightness.value = Math.max(
    0,
    Math.min(100, 100 - ((event.clientY - rect.top) / rect.height) * 100),
  );
  applyHsv();
}

function applyFontSize() {
  applyFontChange((field) => {
    if (!fontSizeDraft.value) {
      if (!updateStoredStyle({ fontSize: undefined }, field)) return false;
      hasFontSize.value = false;
      currentFontSize.value = null;
      fontSizeDraft.value = "";
      return true;
    }
    const normalized = normalizeFontSizeInput(fontSizeDraft.value);
    if (!normalized) {
      fontSizeDraft.value = currentFontSize.value || "";
      return false;
    }
    fontSizeDraft.value = normalized;
    if (!updateStoredStyle({ fontSize: normalized }, field)) return false;
    hasFontSize.value = true;
    currentFontSize.value = normalized;
    return true;
  });
}

function applyFontFamily() {
  applyFontChange((field) => {
    if (!fontFamilyDraft.value) {
      if (!updateStoredStyle({ fontFamily: undefined }, field)) return false;
      hasFontFamily.value = false;
      currentFontFamily.value = null;
      fontFamilyDraft.value = "";
      return true;
    }
    const normalized = sanitizeCssFontFamily(fontFamilyDraft.value);
    if (!normalized) {
      fontFamilyDraft.value = currentFontFamily.value || "";
      return false;
    }
    fontFamilyDraft.value = normalized;
    if (!updateStoredStyle({ fontFamily: normalized }, field)) return false;
    hasFontFamily.value = true;
    currentFontFamily.value = normalized;
    return true;
  });
}

function applyFontWeight() {
  applyFontChange((field) => {
    if (!fontWeightDraft.value) {
      if (!updateStoredStyle({ fontWeight: undefined }, field)) return false;
      hasFontWeight.value = false;
      currentFontWeight.value = null;
      fontWeightDraft.value = "";
      return true;
    }
    const normalized = sanitizeCssFontWeight(fontWeightDraft.value);
    if (!normalized) {
      fontWeightDraft.value = currentFontWeight.value || "";
      return false;
    }
    fontWeightDraft.value = normalized;
    if (!updateStoredStyle({ fontWeight: normalized }, field)) return false;
    hasFontWeight.value = true;
    currentFontWeight.value = normalized;
    return true;
  });
}

function onBubbleMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  // Capture field + selection before focus leaves the editable.
  if (
    target?.closest("input, .font-menu, .color-model-dropdown") &&
    panel.value === "none"
  ) {
    lockField(activeField());
    saveSelection();
  }
  // Allow focusing inputs / actions; keep selection for format buttons.
  // Font/color custom menus use mousedown.prevent on their triggers.
  if (
    target?.closest(
      "input, .link-action, .font-action, .font-menu, .color-model-dropdown, .color-action",
    )
  ) {
    return;
  }
  event.preventDefault();
}

function onDocMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest(".format-bubble")) {
    // Close font menus when clicking other toolbar chrome (not the open menu).
    if (fontMenuOpen.value && !target.closest(".font-menu")) {
      closeFontMenus();
    }
    // Close only the color-model submenu when clicking elsewhere in the bubble.
    // Never dismiss the color popover itself from an inside click.
    if (
      colorModelOpen.value &&
      !target.closest(".color-model-dropdown")
    ) {
      colorModelOpen.value = false;
    }
    return;
  }
  const focusInBubble = !!(
    bubbleEl.value &&
    document.activeElement instanceof Node &&
    bubbleEl.value.contains(document.activeElement)
  );
  closeFontMenus();
  colorModelOpen.value = false;
  savedRange = null;
  if (panel.value !== "none") {
    panel.value = "none";
  }
  if (!focusInBubble) {
    clearFieldLock();
  }
}

function onBubbleKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  if (fontMenuOpen.value) {
    event.preventDefault();
    closeFontMenus();
    return;
  }
  if (panel.value === "color") {
    event.preventDefault();
    onColorPanelEscape();
  }
}

function isMod(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}

function onKeydown(event: KeyboardEvent) {
  const field = inSignetField(event.target as Node);
  if (!field) return;

  if (!isMod(event)) return;

  const key = event.key.toLowerCase();

  if (key === "b") {
    event.preventDefault();
    run("bold");
    return;
  }
  if (key === "i") {
    event.preventDefault();
    run("italic");
    return;
  }
  if (key === "u") {
    event.preventDefault();
    run("underline");
    return;
  }
  if (key === "k") {
    event.preventDefault();
    openLink();
    return;
  }
  if (key === "h" && event.shiftKey) {
    event.preventDefault();
    openColor();
    return;
  }
  if ((key === "s" || key === "x") && event.shiftKey) {
    event.preventDefault();
    run("strikeThrough");
  }
}

onMounted(() => {
  supportsEyeDropper.value =
    typeof window !== "undefined" && "EyeDropper" in window;
  document.addEventListener("selectionchange", updateState);
  document.addEventListener("mouseup", updateState);
  document.addEventListener("keyup", updateState);
  document.addEventListener("focusin", updateState);
  document.addEventListener("focusout", updateState);
  document.addEventListener("mousedown", onDocMouseDown);
  document.addEventListener("mousedown", onColorModelOutside, true);
  document.addEventListener("keydown", onKeydown);
  window.addEventListener("scroll", updateState, true);
  window.addEventListener("resize", updateState);
});

onUnmounted(() => {
  document.removeEventListener("selectionchange", updateState);
  document.removeEventListener("mouseup", updateState);
  document.removeEventListener("keyup", updateState);
  document.removeEventListener("focusin", updateState);
  document.removeEventListener("focusout", updateState);
  document.removeEventListener("mousedown", onDocMouseDown);
  document.removeEventListener("mousedown", onColorModelOutside, true);
  document.removeEventListener("keydown", onKeydown);
  window.removeEventListener("scroll", updateState, true);
  window.removeEventListener("resize", updateState);
});
</script>

<template>
  <div
    v-show="visible"
    ref="bubbleEl"
    class="format-bubble"
    role="toolbar"
    aria-label="Text formatting"
    :style="{ top: `${top}px`, left: `${left}px` }"
    @mousedown="onBubbleMouseDown"
    @keydown="onBubbleKeydown"
  >
    <template v-if="panel === 'none'">
      <ToolButton
        :label="`Bold · ${mod}+B`"
        :active="isBold"
        :pressed="isBold"
        @click="run('bold')"
      >
        <PhTextB :size="iconSize" weight="bold" />
      </ToolButton>
      <ToolButton
        :label="`Italic · ${mod}+I`"
        :active="isItalic"
        :pressed="isItalic"
        @click="run('italic')"
      >
        <PhTextItalic :size="iconSize" weight="bold" />
      </ToolButton>
      <ToolButton
        :label="`Underline · ${mod}+U`"
        :active="isUnderline"
        :pressed="isUnderline"
        @click="run('underline')"
      >
        <PhTextUnderline :size="iconSize" weight="bold" />
      </ToolButton>
      <ToolButton
        :label="`Strikethrough · ${mod}+Shift+S`"
        :active="isStrike"
        :pressed="isStrike"
        @click="run('strikeThrough')"
      >
        <PhTextStrikethrough :size="iconSize" weight="bold" />
      </ToolButton>
      <span class="divider" aria-hidden="true" />
      <div class="font-menu" :class="{ open: fontMenuOpen === 'size' }">
        <button
          type="button"
          class="font-menu-trigger size"
          title="Font size"
          aria-label="Font size"
          :aria-expanded="fontMenuOpen === 'size'"
          aria-haspopup="listbox"
          @mousedown.prevent="toggleFontMenu('size', $event)"
        >
          <PhTextAa :size="iconSize" weight="bold" aria-hidden="true" />
          <span class="font-menu-value">{{ fontSizeLabel }}</span>
        </button>
        <ul
          v-if="fontMenuOpen === 'size'"
          class="font-menu-list"
          role="listbox"
          aria-label="Font size"
        >
          <li role="option">
            <button
              type="button"
              class="font-menu-option"
              :class="{ active: !fontSizeDraft }"
              @mousedown.prevent="pickFontSize('')"
            >
              Default
            </button>
          </li>
          <li v-for="size in FONT_SIZE_PRESETS" :key="size" role="option">
            <button
              type="button"
              class="font-menu-option"
              :class="{ active: fontSizeDraft === size }"
              @mousedown.prevent="pickFontSize(size)"
            >
              {{ size.replace(/px$/i, "") }}
            </button>
          </li>
        </ul>
      </div>
      <div class="font-menu" :class="{ open: fontMenuOpen === 'family' }">
        <button
          type="button"
          class="font-menu-trigger family"
          title="Font family"
          aria-label="Font family"
          :aria-expanded="fontMenuOpen === 'family'"
          aria-haspopup="listbox"
          @mousedown.prevent="toggleFontMenu('family', $event)"
        >
          <PhTextT :size="iconSize" weight="bold" aria-hidden="true" />
          <span class="font-menu-value">{{ fontFamilyTriggerLabel }}</span>
        </button>
        <ul
          v-if="fontMenuOpen === 'family'"
          class="font-menu-list family-list"
          role="listbox"
          aria-label="Font family"
        >
          <li role="option">
            <button
              type="button"
              class="font-menu-option"
              :class="{ active: !fontFamilyDraft }"
              @mousedown.prevent="pickFontFamily('')"
            >
              Default
            </button>
          </li>
          <li
            v-for="font in EMAIL_SAFE_FONTS"
            :key="font.value"
            role="option"
          >
            <button
              type="button"
              class="font-menu-option"
              :class="{ active: fontFamilyDraft === font.value }"
              :style="{ fontFamily: font.value }"
              @mousedown.prevent="pickFontFamily(font.value)"
            >
              {{ font.label }}
            </button>
          </li>
        </ul>
      </div>
      <div class="font-menu" :class="{ open: fontMenuOpen === 'weight' }">
        <button
          type="button"
          class="font-menu-trigger weight"
          title="Font weight"
          aria-label="Font weight"
          :aria-expanded="fontMenuOpen === 'weight'"
          aria-haspopup="listbox"
          @mousedown.prevent="toggleFontMenu('weight', $event)"
        >
          <PhTextBolder :size="iconSize" weight="bold" aria-hidden="true" />
          <span class="font-menu-value">{{ fontWeightLabel }}</span>
        </button>
        <ul
          v-if="fontMenuOpen === 'weight'"
          class="font-menu-list"
          role="listbox"
          aria-label="Font weight"
        >
          <li role="option">
            <button
              type="button"
              class="font-menu-option"
              :class="{ active: !fontWeightDraft }"
              @mousedown.prevent="pickFontWeight('')"
            >
              Default
            </button>
          </li>
          <li
            v-for="opt in FONT_WEIGHT_OPTIONS"
            :key="opt.value"
            role="option"
          >
            <button
              type="button"
              class="font-menu-option"
              :class="{ active: fontWeightDraft === opt.value }"
              @mousedown.prevent="pickFontWeight(opt.value)"
            >
              {{ opt.label }}
            </button>
          </li>
        </ul>
      </div>
      <span class="color-tool">
        <ToolButton
          :label="`Text color · ${mod}+Shift+H`"
          class="color-tool-btn"
          @click="openColor"
        >
          <span
            class="color-circle"
            :style="{ background: displayColor }"
            aria-hidden="true"
          />
        </ToolButton>
      </span>
      <ToolButton
        :label="`Link · ${mod}+K`"
        :active="isLink"
        :pressed="isLink"
        @click="openLink"
      >
        <PhLink :size="iconSize" weight="bold" />
      </ToolButton>
    </template>

    <template v-else-if="panel === 'link'">
      <input
        ref="linkInput"
        v-model="linkUrl"
        class="link-input"
        type="url"
        placeholder="https://"
        aria-label="URL"
        @keydown.enter.prevent="applyLink"
        @keydown.escape.prevent="closePanel"
      />
      <button type="button" class="link-action primary" @click="applyLink">
        Apply
      </button>
      <button
        v-if="isLink"
        type="button"
        class="link-action"
        @click="removeLink"
      >
        Remove
      </button>
      <button type="button" class="link-action" @click="closePanel">
        Cancel
      </button>
    </template>

    <template v-else-if="panel === 'color'">
      <div class="color-panel" aria-label="Text color picker">
        <div class="color-spectrum-wrap">
          <div
            ref="spectrumEl"
            class="color-spectrum"
            :style="{ '--picker-hue': `hsl(${hue} 100% 50%)` }"
            role="slider"
            aria-label="Color saturation and brightness"
            :aria-valuetext="colorDraft"
            @pointerdown="pickSpectrum"
            @pointermove="($event.buttons & 1) && pickSpectrum($event)"
          >
            <span
              class="color-cursor"
              :style="{
                left: `${saturation}%`,
                top: `${100 - brightness}%`,
              }"
            />
          </div>
        </div>
        <input
          v-model.number="hue"
          class="hue-slider"
          type="range"
          min="0"
          max="359"
          aria-label="Hue"
          @input="applyHsv"
        />
        <div v-if="colorModel === 'rgba'" class="alpha-slider-wrap">
          <span
            class="alpha-slider-track"
            :style="{
              '--alpha-color': `hsl(${hue} 100% 50%)`,
            }"
          >
            <input
              v-model.number="alpha"
              class="alpha-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              aria-label="Alpha"
              @input="onAlphaInput"
            />
          </span>
        </div>
        <div class="color-value-row">
          <span class="color-preview" aria-hidden="true">
            <span
              class="color-preview-fill"
              :style="{ background: previewColor }"
            />
          </span>
          <input
            v-if="colorModel === 'hex'"
            v-model="colorDraft"
            class="color-value-input"
            type="text"
            spellcheck="false"
            aria-label="Hex color"
            placeholder="#333333"
            @input="onColorValueInput"
            @keydown.escape.prevent="closePanel"
          />
          <div
            v-else
            class="color-channels"
            role="group"
            :aria-label="colorModel === 'rgba' ? 'RGBA channels' : 'RGB channels'"
          >
            <label class="color-channel">
              <span class="color-channel-label">R</span>
              <input
                v-model.number="channelR"
                class="color-channel-input"
                type="number"
                min="0"
                max="255"
                step="1"
                inputmode="numeric"
                aria-label="Red"
                @input="onChannelInput"
                @keydown.escape.prevent="onColorPanelEscape"
              />
            </label>
            <label class="color-channel">
              <span class="color-channel-label">G</span>
              <input
                v-model.number="channelG"
                class="color-channel-input"
                type="number"
                min="0"
                max="255"
                step="1"
                inputmode="numeric"
                aria-label="Green"
                @input="onChannelInput"
                @keydown.escape.prevent="onColorPanelEscape"
              />
            </label>
            <label class="color-channel">
              <span class="color-channel-label">B</span>
              <input
                v-model.number="channelB"
                class="color-channel-input"
                type="number"
                min="0"
                max="255"
                step="1"
                inputmode="numeric"
                aria-label="Blue"
                @input="onChannelInput"
                @keydown.escape.prevent="onColorPanelEscape"
              />
            </label>
            <label v-if="colorModel === 'rgba'" class="color-channel">
              <span class="color-channel-label">A</span>
              <input
                v-model.number="alpha"
                class="color-channel-input"
                type="number"
                min="0"
                max="1"
                step="0.01"
                inputmode="decimal"
                aria-label="Alpha"
                @input="onChannelInput"
                @keydown.escape.prevent="onColorPanelEscape"
              />
            </label>
          </div>
        </div>
        <div class="color-meta-row" @keydown.escape.prevent="onColorPanelEscape">
          <div class="color-model-dropdown" title="Color model">
            <button
              type="button"
              class="color-model-trigger"
              :aria-expanded="colorModelOpen"
              aria-haspopup="listbox"
              aria-label="Color model"
              @mousedown.prevent.stop="toggleColorModelMenu"
            >
              {{ colorModelLabel }}
              <svg
                class="color-model-chevron"
                :class="{ open: colorModelOpen }"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M2.5 4.25 6 7.75 9.5 4.25"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div v-if="colorModelOpen" class="color-model-menu" role="listbox">
              <button
                v-for="option in COLOR_MODEL_OPTIONS"
                :key="option.value"
                type="button"
                role="option"
                class="color-model-item"
                :class="{ active: option.value === colorModel }"
                :aria-selected="option.value === colorModel"
                @mousedown.prevent.stop="selectColorModel(option.value, $event)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <button
            v-if="supportsEyeDropper"
            type="button"
            class="color-action eyedropper"
            title="Pick a color from the screen"
            aria-label="Eyedropper"
            @click="pickEyeDropper"
          >
            <PhEyedropper :size="iconSize" weight="bold" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.format-bubble {
  position: fixed;
  z-index: 80;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem;
  max-width: calc(100vw - 1rem);
  padding: 0.3rem;
  border-radius: 0.65rem;
  background: var(--page-bg);
  border: 1px solid var(--border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.divider {
  width: 1px;
  height: 1.25rem;
  margin: 0 0.2rem;
  background: var(--border);
}

/* Font triggers — match ImageBubble .size-input inset chrome. */
.font-menu {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.font-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 2rem;
  height: 1.5rem;
  margin: 0;
  padding: 0 0.4rem;
  border: none;
  border-radius: 0.25rem;
  background: var(--surface);
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.font-menu-trigger:hover,
.font-menu.open .font-menu-trigger {
  background: color-mix(in srgb, var(--surface) 88%, var(--text-color));
}

.font-menu-trigger:focus-visible {
  outline: 2px solid var(--red-1);
  outline-offset: 1px;
}

.font-menu-trigger :deep(svg) {
  flex-shrink: 0;
  opacity: 0.85;
}

.font-menu-value {
  max-width: 4.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-menu-trigger.family .font-menu-value {
  max-width: 5.5rem;
}

.font-menu-list {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 100%;
  max-height: min(14rem, 50vh);
  margin: 0;
  padding: 0.3rem;
  overflow-y: auto;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--page-bg);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
}

.font-menu-list.family-list {
  min-width: 9.5rem;
}

.font-menu-option {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.4rem 0.55rem;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}

.font-menu-option:hover {
  background: var(--neutral-2);
}

/* Matches color-model / SimplePad language menu: solid --red-1 selected row. */
.font-menu-option.active {
  background: var(--red-1);
  color: var(--neutral-0);
}

.font-menu-option.active:hover {
  background: color-mix(in srgb, var(--red-1) 85%, black);
}

.color-tool {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.color-circle {
  display: block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--text-color) 28%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--page-bg) 55%, transparent);
}

.color-panel {
  width: min(15rem, calc(100vw - 2rem));
  padding: 0.35rem;
  border-radius: 0.55rem;
  background: var(--page-bg);
  color: var(--text-color);
}

/*
 * Border lives on the wrapper (with overflow:hidden clipping) so it never
 * sits directly on the gradient. Drawing a border on the gradient element
 * itself produced a thin red-tinted fringe where the rounded corners meet
 * the hue background — clipping the borderless gradient avoids that bleed.
 */
.color-spectrum-wrap {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.45rem;
  line-height: 0;
}

.color-spectrum {
  position: relative;
  width: 100%;
  height: 8.5rem;
  border: 0;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent),
    var(--picker-hue);
  cursor: crosshair;
  touch-action: none;
}

.color-cursor {
  position: absolute;
  width: 0.8rem;
  height: 0.8rem;
  border: 2px solid var(--neutral-5);
  border-radius: 50%;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--neutral-5) 60%, transparent),
    0 1px 4px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hue-slider {
  width: 100%;
  height: 0.8rem;
  margin: 0.55rem 0 0.35rem;
  padding: 0;
  border-radius: 999px;
  appearance: none;
  background: linear-gradient(
    to right,
    #f00,
    #ff0,
    #0f0,
    #0ff,
    #00f,
    #f0f,
    #f00
  );
  cursor: pointer;
}

.hue-slider::-webkit-slider-thumb {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid var(--neutral-5);
  border-radius: 50%;
  appearance: none;
  background: var(--text-color);
  box-shadow: 0 0 0 1px var(--border);
}

.color-value-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* Mirror ImageBubble .size-field row: separate labeled inset inputs, no shared shell. */
.color-channels {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  gap: 0.15rem;
  height: 2rem;
}

.color-channel {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  flex: 1 1 0;
  min-width: 0;
  height: 2rem;
  margin: 0;
  padding: 0 0.15rem 0 0.3rem;
  border-radius: 0.45rem;
  border: 1px solid transparent;
}

.color-channel:focus-within {
  border-color: var(--red-1);
}

.color-channel-label {
  flex: 0 0 auto;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--neutral-5);
}

.color-channel-input {
  width: 100%;
  min-width: 0;
  height: 1.5rem;
  margin: 0;
  padding: 0 0.15rem;
  border: none;
  border-radius: 0.25rem;
  outline: none;
  background: var(--surface);
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
  /* Hide native number spinners for a denser toolbar look. */
  appearance: textfield;
  -moz-appearance: textfield;
}

.color-channel-input::-webkit-outer-spin-button,
.color-channel-input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.color-preview {
  position: relative;
  width: 1.7rem;
  height: 1.7rem;
  flex: 0 0 auto;
  overflow: hidden;
  /* Muted grey rim — avoids a bright white edge on dark popovers / near-black fills. */
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  /* Checkerboard so alpha is visible under the fill (soft greys, not pure white). */
  background-color: #c8c8c8;
  background-image:
    linear-gradient(45deg, #a3a3a3 25%, transparent 25%),
    linear-gradient(-45deg, #a3a3a3 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #a3a3a3 75%),
    linear-gradient(-45deg, transparent 75%, #a3a3a3 75%);
  background-size: 0.5rem 0.5rem;
  background-position:
    0 0,
    0 0.25rem,
    0.25rem -0.25rem,
    -0.25rem 0;
}

.color-preview-fill {
  position: absolute;
  inset: 0;
}

.alpha-slider-wrap {
  margin: 0.1rem 0 0.35rem;
}

.alpha-slider-track {
  display: block;
  border-radius: 999px;
  /* Checkerboard base + a hue-tinted transparent-to-opaque overlay. */
  background-color: #fff;
  background-image:
    linear-gradient(
      to right,
      transparent,
      var(--alpha-color, var(--text-color))
    ),
    linear-gradient(45deg, #cbcbcb 25%, transparent 25%),
    linear-gradient(-45deg, #cbcbcb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #cbcbcb 75%),
    linear-gradient(-45deg, transparent 75%, #cbcbcb 75%);
  background-size:
    100% 100%,
    0.5rem 0.5rem,
    0.5rem 0.5rem,
    0.5rem 0.5rem,
    0.5rem 0.5rem;
  background-position:
    0 0,
    0 0,
    0 0.25rem,
    0.25rem -0.25rem,
    -0.25rem 0;
}

.alpha-slider {
  display: block;
  width: 100%;
  height: 0.8rem;
  margin: 0;
  padding: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.alpha-slider::-webkit-slider-thumb {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid var(--neutral-5);
  border-radius: 50%;
  appearance: none;
  background: var(--text-color);
  box-shadow: 0 0 0 1px var(--border);
}

.alpha-slider::-moz-range-thumb {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid var(--neutral-5);
  border-radius: 50%;
  background: var(--text-color);
  box-shadow: 0 0 0 1px var(--border);
}

.color-meta-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.color-model-dropdown {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

.color-model-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  width: 100%;
  height: 2rem;
  margin: 0;
  padding: 0 0.55rem;
  border: none;
  border-radius: 0.45rem;
  background: var(--surface);
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.color-model-trigger:hover,
.color-model-trigger[aria-expanded="true"] {
  background: var(--neutral-2);
}

.color-model-trigger:focus-visible {
  outline: none;
  background: var(--neutral-2);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-color) 22%, transparent);
}

.color-model-chevron {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  opacity: 0.7;
  transition: transform 0.15s ease;
}

.color-model-chevron.open {
  transform: rotate(180deg);
}

.color-model-menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  z-index: 95;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 100%;
  padding: 0.3rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--page-bg);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
}

.color-model-item {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.4rem 0.55rem;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.color-model-item:hover {
  background: var(--neutral-2);
}

/* Matches SimplePad's language menu: solid red-1 fill for the selected row. */
.color-model-item.active {
  background: var(--red-1);
  color: var(--neutral-0);
}

.color-model-item.active:hover {
  background: color-mix(in srgb, var(--red-1) 85%, black);
}

.color-model-item:focus-visible {
  outline: 2px solid var(--red-1);
  outline-offset: 1px;
}

/* Borderless toolbar control: hit area + rounded hover only, no idle outline. */
.color-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border: none;
  border-radius: 0.45rem;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
}

.color-action:hover {
  background: var(--neutral-2);
}

.color-action:focus-visible {
  outline: none;
  background: var(--neutral-2);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-color) 22%, transparent);
}

.color-value-input {
  width: 100%;
  min-width: 0;
  height: 1.5rem;
  padding: 0 0.15rem;
  border: none;
  border-radius: 0.25rem;
  outline: none;
  background: var(--surface);
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
}

.color-value-input:focus {
  box-shadow: 0 0 0 1px var(--red-1);
}

.link-input {
  width: min(56vw, 14rem);
  min-width: min(9rem, 40vw);
  flex: 1 1 8rem;
  height: 2rem;
  padding: 0 0.65rem;
  border: 1px solid var(--border);
  border-radius: 0.45rem;
  background: var(--surface);
  color: var(--text-color);
  font: inherit;
  font-size: 0.85rem;
  outline: none;
}

.link-input.font-size-text {
  width: min(40vw, 9.5rem);
  min-width: 6.5rem;
  flex: 1 1 6.5rem;
  font-variant-numeric: tabular-nums;
}

.link-input:focus {
  border-color: var(--red-1);
}

.font-select {
  width: min(56vw, 12rem);
  min-width: min(8rem, 40vw);
  flex: 1 1 8rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--border);
  border-radius: 0.45rem;
  background: var(--surface);
  color: var(--text-color);
  font: inherit;
  font-size: 0.85rem;
  outline: none;
}

.font-select:focus {
  border-color: var(--red-1);
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem;
  max-width: 100%;
  flex: 1 1 100%;
}

.preset-chip {
  min-width: 1.7rem;
  height: 1.7rem;
  padding: 0 0.35rem;
  border-radius: 0.35rem;
  color: var(--text-color);
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.preset-chip:hover {
  background: var(--neutral-2);
}

.preset-chip.active {
  background: var(--red-1);
  color: #f2f2f2;
}

.link-action {
  height: 2rem;
  padding: 0 0.65rem;
  border-radius: 0.45rem;
  color: var(--text-color);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.link-action:hover {
  background: var(--neutral-2);
}

.link-action.primary {
  background: var(--red-1);
  color: #f2f2f2;
}

.link-action.primary:hover {
  background: color-mix(in srgb, var(--red-1) 85%, black);
}
</style>
