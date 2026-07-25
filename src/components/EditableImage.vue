<script setup lang="ts">
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { signatureEditorKey } from "../composables/signatureEditor";
import { DEFAULT_LOGO_SRC, defaultLogoStyle } from "../types/signature";

const props = withDefaults(
  defineProps<{
    imageKey: string;
    width: number;
    height: number;
    display?: "block" | "inline-block";
    alt?: string;
  }>(),
  {
    display: "block",
    alt: "Logo",
  },
);

const editorCtx = inject(signatureEditorKey);
if (!editorCtx) {
  throw new Error("EditableImage requires signature editor context");
}
const editor = editorCtx;

const selected = ref(false);
const rootEl = ref<HTMLElement | null>(null);

const style = computed(
  () => editor.userData.logoStyles[props.imageKey] ?? defaultLogoStyle(),
);

const width = computed(() => style.value.width.trim() || `${props.width}px`);
const height = computed(() => style.value.height.trim() || `${props.height}px`);
const radius = computed(() => style.value.borderRadius.trim() || "0px");

function htmlDimension(value: string) {
  return value.endsWith("px") ? value.slice(0, -2) : value;
}

function isStockPlaceholder(src: string) {
  return (
    !src ||
    src === DEFAULT_LOGO_SRC ||
    /^https:\/\/placehold\.co\/\d+x\d+/i.test(src)
  );
}

/** Stock placeholder matches this signature's rendered size (40, 48, 56…). */
const src = computed(() => {
  const stored = editor.userData.logoSrc;
  if (isStockPlaceholder(stored)) {
    const placeholderWidth = width.value.endsWith("px")
      ? htmlDimension(width.value)
      : String(props.width);
    const placeholderHeight = height.value.endsWith("px")
      ? htmlDimension(height.value)
      : String(props.height);
    return `https://placehold.co/${placeholderWidth}x${placeholderHeight}`;
  }
  return stored;
});

const href = computed(() => {
  const link = style.value.link.trim();
  return link && link !== "https://" ? link : "";
});
const label = computed(
  () => props.alt || editor.userData.website || "Logo",
);

const imgStyle = computed(() => {
  const parts = [
    `display: ${props.display}`,
    "border: 0",
    "outline: none",
    "text-decoration: none",
    "width: 100%",
    "height: 100%",
    "max-width: none",
    "object-fit: cover",
    `border-radius: ${radius.value}`,
  ];
  return `${parts.join("; ")};`;
});

const wrapperStyle = computed(
  () =>
    `display: inline-block; width: ${width.value}; height: ${height.value}; text-decoration: none; line-height: 0; border-radius: ${radius.value};`,
);

function onSelect(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  selected.value = true;
  rootEl.value?.focus({ preventScroll: true });
  window.dispatchEvent(
    new CustomEvent("signet-image-select", {
      detail: { el: rootEl.value },
    }),
  );
}

function onPeerSelect(event: Event) {
  const detail = (event as CustomEvent<{ el: HTMLElement | null }>).detail;
  if (detail?.el !== rootEl.value) {
    selected.value = false;
  }
}

function onDocPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-signet-image], .image-bubble")) return;
  selected.value = false;
}

onMounted(() => {
  window.addEventListener("signet-image-select", onPeerSelect);
  document.addEventListener("pointerdown", onDocPointerDown);
});

onUnmounted(() => {
  window.removeEventListener("signet-image-select", onPeerSelect);
  document.removeEventListener("pointerdown", onDocPointerDown);
});
</script>

<template>
  <a
    v-if="src && href"
    ref="rootEl"
    data-signet-image="true"
    :data-signet-image-key="imageKey"
    :data-signet-image-width="width"
    :data-signet-image-height="height"
    :data-signet-image-radius="radius"
    class="editable-image"
    :class="{ 'is-selected': selected }"
    :href="href"
    target="_blank"
    :style="wrapperStyle"
    @click="onSelect"
  >
    <img
      :src="src"
      :width="htmlDimension(width)"
      :height="htmlDimension(height)"
      border="0"
      :alt="label"
      :style="imgStyle"
      draggable="false"
    />
  </a>
  <span
    v-else-if="src"
    ref="rootEl"
    data-signet-image="true"
    :data-signet-image-key="imageKey"
    :data-signet-image-width="width"
    :data-signet-image-height="height"
    :data-signet-image-radius="radius"
    class="editable-image"
    :class="{ 'is-selected': selected }"
    :style="wrapperStyle"
    role="button"
    tabindex="0"
    @click="onSelect"
    @keydown.enter.prevent="onSelect"
  >
    <img
      :src="src"
      :width="htmlDimension(width)"
      :height="htmlDimension(height)"
      border="0"
      :alt="label"
      :style="imgStyle"
      draggable="false"
    />
  </span>
  <button
    v-else
    ref="rootEl"
    type="button"
    data-signet-image="true"
    :data-signet-image-key="imageKey"
    :data-signet-image-width="width"
    :data-signet-image-height="height"
    :data-signet-image-radius="radius"
    class="editable-image editable-image--empty"
    :class="{ 'is-selected': selected }"
    :style="{
      width,
      height,
      display: 'inline-flex',
      borderRadius: radius,
    }"
    :aria-label="`Add ${label}`"
    @click="onSelect"
  >
    <span aria-hidden="true">+</span>
  </button>
</template>

<style scoped>
.editable-image {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: top;
  cursor: pointer;
  box-sizing: content-box;
  outline: 1px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 0 transparent;
  transition:
    outline-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
  line-height: 0;
}

.editable-image:hover:not(.is-selected) {
  outline: 1px dashed rgba(239, 65, 54, 0.4);
  outline-offset: 2px;
}

.editable-image:focus,
.editable-image:focus-visible {
  outline: 1px solid rgba(239, 65, 54, 0.7);
  outline-offset: 2px;
  background: rgba(239, 65, 54, 0.08);
}

.editable-image.is-selected {
  outline: none;
  background: transparent;
  box-shadow: 0 0 0 2px var(--red-1);
}

.editable-image--empty {
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px dashed color-mix(in srgb, var(--red-1) 55%, var(--border));
  background: color-mix(in srgb, var(--red-1) 8%, var(--surface));
  color: var(--red-1);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1;
}

.editable-image--empty:focus,
.editable-image--empty:focus-visible {
  background: rgba(239, 65, 54, 0.12);
}

.editable-image img {
  display: block;
  vertical-align: top;
  max-width: none;
  width: inherit;
  height: inherit;
}
</style>
