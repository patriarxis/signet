<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from "vue";
import type { CSSProperties, StyleValue } from "vue";
import type { FieldStyle, FieldStyleField } from "../types/signature";
import { signatureEditorKey } from "../composables/signatureEditor";
import { stripHtml } from "../utils/html";

const props = withDefaults(
  defineProps<{
    field?: FieldStyleField;
    styleKey?: string;
    modelValue?: string;
    placeholder: string;
    /** Host element — `div` for signature text, `span` inside links. */
    tag?: string;
    /**
     * Template baseline typography (font/size/line-height/color/…).
     * Per-signature `fieldStyles` override these on the same host.
     */
    textStyle?: string | CSSProperties;
    /** Template-level semantic emphasis wrapper kept inside the host. */
    emphasize?: "b" | "i";
    multiline?: boolean;
  }>(),
  {
    tag: "div",
    multiline: false,
    modelValue: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const editor = inject(signatureEditorKey, null);
const el = ref<HTMLElement | null>(null);

const value = computed(() => {
  if (props.field && editor) {
    const current = editor.userData[props.field];
    return typeof current === "string" ? current : "";
  }
  return props.modelValue ?? "";
});

const isEmpty = computed(() => !value.value.trim());
const fieldStyle = computed<FieldStyle>(() => {
  if (!props.field || !props.styleKey || !editor) return {};
  return editor.userData.fieldStyles[props.styleKey]?.[props.field] ?? {};
});

/** Baseline template styles + per-signature toolbar overrides on this host. */
const hostStyle = computed<StyleValue>(() => {
  const style = fieldStyle.value;
  const overrides: CSSProperties = {};
  if (style.color) overrides.color = style.color;
  if (style.fontSize) overrides.fontSize = style.fontSize;
  if (style.fontFamily) overrides.fontFamily = style.fontFamily;
  if (style.fontWeight) overrides.fontWeight = style.fontWeight;

  if (props.textStyle) {
    return [props.textStyle, overrides];
  }
  return overrides;
});

function escapeHtml(text: string): string {
  // Escape exactly once for innerHTML injection (text → entities).
  const span = document.createElement("span");
  span.textContent = text;
  return span.innerHTML;
}

/** Explicit fieldStyles flag wins; otherwise fall back to template `emphasize`. */
function effectiveEmphasis(
  flag: boolean | undefined,
  templateDefault: boolean,
): boolean {
  if (flag === true) return true;
  if (flag === false) return false;
  return templateDefault;
}

function renderedHtml(): string {
  // value is plain text (`Founder & CEO`); escape once into HTML.
  let html = escapeHtml(value.value);
  const style = fieldStyle.value;
  // Semantic emphasis stays as email-safe tags in the rendered/copy DOM.
  // Template `emphasize` is the former outer <b>/<i> wrapper, now inside the host.
  // Explicit `false` in fieldStyles overrides that template default.
  if (effectiveEmphasis(style.bold, props.emphasize === "b")) {
    html = `<b>${html}</b>`;
  }
  if (effectiveEmphasis(style.italic, props.emphasize === "i")) {
    html = `<i>${html}</i>`;
  }
  if (style.underline === true) html = `<u>${html}</u>`;
  if (style.strike === true) html = `<s>${html}</s>`;
  return html;
}

/** Commit decoded plain text — never store contenteditable entity markup. */
function commitPlainText(raw: string) {
  let cleaned = stripHtml(raw).replace(/\u00a0/g, " ");
  if (!props.multiline) cleaned = cleaned.replace(/[\r\n]+/g, " ");

  if (props.field && editor) {
    editor.updateField(props.field, cleaned);
    return;
  }
  emit("update:modelValue", cleaned);
}

function syncDom() {
  if (!el.value) return;
  if (document.activeElement === el.value) return;
  const next = renderedHtml();
  if (el.value.innerHTML !== next) {
    el.value.innerHTML = next;
  }
}

function onInput() {
  if (!el.value) return;
  // textContent is already entity-decoded; stripHtml still handles any tags.
  commitPlainText(el.value.textContent ?? "");
}

function onBlur() {
  if (!el.value) return;
  commitPlainText(el.value.textContent ?? "");
  el.value.innerHTML = renderedHtml();
}

function onKeydown(event: KeyboardEvent) {
  if (!props.multiline && event.key === "Enter") {
    event.preventDefault();
    el.value?.blur();
  }
}

watch([value, fieldStyle], async () => {
  await nextTick();
  syncDom();
});

onMounted(syncDom);

defineExpose({ stripHtml });
</script>

<template>
  <component
    :is="tag"
    ref="el"
    class="editable-text"
    :class="{ 'is-empty': isEmpty, 'is-block': tag === 'div' }"
    :style="hostStyle"
    contenteditable="true"
    :data-placeholder="placeholder"
    data-signet-field="true"
    :data-signet-field-name="field"
    :data-signet-style-key="styleKey"
    spellcheck="false"
    @input="onInput"
    @blur="onBlur"
    @keydown="onKeydown"
  />
</template>

<style>
.editable-text {
  outline: none;
  cursor: text;
  border-radius: 2px;
  min-width: 0.75rem;
  display: inline;
}

.editable-text.is-block {
  display: block;
}

.editable-text:hover {
  outline: 1px dashed rgba(239, 65, 54, 0.4);
  outline-offset: 2px;
}

.editable-text:focus {
  outline: 1px solid rgba(239, 65, 54, 0.7);
  outline-offset: 2px;
  background: rgba(239, 65, 54, 0.08);
}

.editable-text.is-empty:not(:focus)::before {
  content: attr(data-placeholder);
  opacity: 0.45;
  font-style: italic;
  pointer-events: none;
}

.editable-text a {
  color: inherit;
  text-decoration: underline;
}
</style>
