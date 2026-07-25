<script setup lang="ts">
import {
  PhImage,
  PhLink,
  PhTrash,
  PhUploadSimple,
} from "@phosphor-icons/vue";
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { signatureEditorKey } from "../composables/signatureEditor";
import { defaultLogoStyle } from "../types/signature";
import { clampFixedBubblePosition } from "../utils/clampFixedBubble";
import ToolButton from "./ToolButton.vue";

const editorCtx = inject(signatureEditorKey);
if (!editorCtx) {
  throw new Error("ImageBubble requires signature editor context");
}
const editor = editorCtx;

const visible = ref(false);
const top = ref(0);
const left = ref(0);
const showLink = ref(false);
const linkUrl = ref("https://");
const linkInput = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const bubbleEl = ref<HTMLElement | null>(null);
const activeEl = ref<HTMLElement | null>(null);
const activeKey = ref<string | null>(null);

const widthDraft = ref("48px");
const heightDraft = ref("48px");
const radiusDraft = ref("0px");

const iconSize = 16;
const MAX_BYTES = 1_200_000;

const activeStyle = computed(() => {
  if (!activeKey.value) return defaultLogoStyle();
  return editor.userData.logoStyles[activeKey.value] ?? defaultLogoStyle();
});

const hasLink = computed(() => {
  const link = activeStyle.value.link.trim();
  return !!link && link !== "https://";
});

const hasImage = computed(() => !!editor.userData.logoSrc);

function positionBelow(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const bw = bubbleEl.value?.offsetWidth || 320;
  const bh = bubbleEl.value?.offsetHeight || 44;
  const pos = clampFixedBubblePosition(rect, bw, bh);
  top.value = pos.top;
  left.value = pos.left;

  if (!bubbleEl.value?.offsetWidth) {
    void nextTick(() => {
      requestAnimationFrame(() => {
        if (!visible.value || !activeEl.value) return;
        const measured = clampFixedBubblePosition(
          activeEl.value.getBoundingClientRect(),
          bubbleEl.value?.offsetWidth || bw,
          bubbleEl.value?.offsetHeight || bh,
        );
        top.value = measured.top;
        left.value = measured.left;
      });
    });
  }
}

function syncSizeDrafts(el: HTMLElement) {
  widthDraft.value =
    el.dataset.signetImageWidth || activeStyle.value.width || "48px";
  heightDraft.value =
    el.dataset.signetImageHeight || activeStyle.value.height || "48px";
  radiusDraft.value =
    el.dataset.signetImageRadius ||
    activeStyle.value.borderRadius ||
    "0px";
}

function clearToolbar() {
  visible.value = false;
  activeEl.value = null;
  activeKey.value = null;
  showLink.value = false;
}

function selectImage(el: HTMLElement) {
  activeEl.value = el;
  activeKey.value = el.dataset.signetImageKey || null;
  syncSizeDrafts(el);
  positionBelow(el);
  visible.value = true;
  showLink.value = false;
}

function deselectAll() {
  clearToolbar();
  window.dispatchEvent(
    new CustomEvent("signet-image-select", { detail: { el: null } }),
  );
}

function onImageSelect(event: Event) {
  const detail = (event as CustomEvent<{ el: HTMLElement | null }>).detail;
  if (!detail?.el) {
    clearToolbar();
    return;
  }
  selectImage(detail.el);
}

function onDocPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest(".image-bubble, [data-signet-image]")) return;
  deselectAll();
}

function onScrollOrResize() {
  if (activeEl.value && visible.value) {
    positionBelow(activeEl.value);
  }
}

function normalizeLength(value: string, allowZero = false): string | null {
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*(px|%)?$/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount === 0)) {
    return null;
  }

  return `${amount}${match[2] || "px"}`;
}

function patchActiveStyle(patch: Partial<{ width: string; height: string; borderRadius: string; link: string }>) {
  if (!activeKey.value) return;
  editor.updateLogoStyle(activeKey.value, patch);
}

function applyWidth() {
  const next = normalizeLength(widthDraft.value);
  if (!next) {
    widthDraft.value =
      activeEl.value?.dataset.signetImageWidth ||
      activeStyle.value.width ||
      "48px";
    return;
  }
  widthDraft.value = next;
  patchActiveStyle({ width: next });
  requestAnimationFrame(() => {
    if (activeEl.value) positionBelow(activeEl.value);
  });
}

function applyHeight() {
  const next = normalizeLength(heightDraft.value);
  if (!next) {
    heightDraft.value =
      activeEl.value?.dataset.signetImageHeight ||
      activeStyle.value.height ||
      "48px";
    return;
  }
  heightDraft.value = next;
  patchActiveStyle({ height: next });
  requestAnimationFrame(() => {
    if (activeEl.value) positionBelow(activeEl.value);
  });
}

function applyRadius() {
  const next = normalizeLength(radiusDraft.value, true);
  if (!next) {
    radiusDraft.value =
      activeEl.value?.dataset.signetImageRadius ||
      activeStyle.value.borderRadius ||
      "0px";
    return;
  }
  radiusDraft.value = next;
  patchActiveStyle({ borderRadius: next });
}

function onSizeKeydown(event: KeyboardEvent, apply: () => void) {
  if (event.key === "Enter") {
    event.preventDefault();
    apply();
    (event.target as HTMLInputElement).blur();
  }
}

function pickImage() {
  fileInput.value?.click();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !file.type.startsWith("image/")) {
    input.value = "";
    return;
  }

  if (file.size > MAX_BYTES) {
    window.alert("Image is too large. Please use an image under ~1.2MB.");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result;
    if (typeof src === "string") {
      editor.updateField("logoSrc", src);
      requestAnimationFrame(() => {
        const next = document.querySelector(
          "[data-signet-image].is-selected",
        ) as HTMLElement | null;
        if (next) selectImage(next);
      });
    }
  };
  reader.readAsDataURL(file);
  input.value = "";
}

function openLink() {
  linkUrl.value = hasLink.value ? activeStyle.value.link : "https://";
  showLink.value = true;
  requestAnimationFrame(() => {
    linkInput.value?.focus();
    linkInput.value?.select();
  });
}

function applyLink() {
  const href = linkUrl.value.trim();
  if (!href || href === "https://") {
    showLink.value = false;
    return;
  }
  patchActiveStyle({ link: href });
  showLink.value = false;
  requestAnimationFrame(() => {
    const next = document.querySelector(
      "[data-signet-image].is-selected",
    ) as HTMLElement | null;
    if (next) selectImage(next);
  });
}

function removeLink() {
  patchActiveStyle({ link: "" });
  showLink.value = false;
  linkUrl.value = "https://";
  requestAnimationFrame(() => {
    const next = document.querySelector(
      "[data-signet-image].is-selected",
    ) as HTMLElement | null;
    if (next) selectImage(next);
  });
}

function removeImage() {
  editor.updateField("logoSrc", "");
  requestAnimationFrame(() => {
    const next = document.querySelector(
      "[data-signet-image].is-selected",
    ) as HTMLElement | null;
    if (next) selectImage(next);
    else deselectAll();
  });
}

function onBubbleMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("input, .link-action, .size-input")) return;
  event.preventDefault();
}

watch(
  () => activeStyle.value,
  () => {
    if (activeEl.value) {
      requestAnimationFrame(() => {
        if (activeEl.value) positionBelow(activeEl.value);
      });
    }
  },
  { deep: true },
);

onMounted(() => {
  window.addEventListener("signet-image-select", onImageSelect);
  document.addEventListener("pointerdown", onDocPointerDown);
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
});

onUnmounted(() => {
  window.removeEventListener("signet-image-select", onImageSelect);
  document.removeEventListener("pointerdown", onDocPointerDown);
  window.removeEventListener("scroll", onScrollOrResize, true);
  window.removeEventListener("resize", onScrollOrResize);
});
</script>

<template>
  <div
    v-show="visible"
    ref="bubbleEl"
    class="image-bubble"
    role="toolbar"
    aria-label="Image options"
    :style="{ top: `${top}px`, left: `${left}px` }"
    @mousedown="onBubbleMouseDown"
  >
    <input
      ref="fileInput"
      class="file-input"
      type="file"
      accept="image/*"
      @change="onFileSelected"
    />

    <template v-if="!showLink">
      <ToolButton
        :label="hasImage ? 'Replace image' : 'Upload image'"
        @click="pickImage"
      >
        <PhUploadSimple v-if="!hasImage" :size="iconSize" weight="fill" />
        <PhImage v-else :size="iconSize" weight="fill" />
      </ToolButton>
      <ToolButton
        label="Link"
        :active="hasLink"
        :pressed="hasLink"
        @click="openLink"
      >
        <PhLink :size="iconSize" weight="bold" />
      </ToolButton>

      <span class="divider" aria-hidden="true" />

      <label class="size-field" title="Width — accepts px or %">
        <span class="size-label">W</span>
        <input
          v-model="widthDraft"
          class="size-input"
          type="text"
          inputmode="decimal"
          placeholder="48px"
          aria-label="Image width"
          @change="applyWidth"
          @keydown="onSizeKeydown($event, applyWidth)"
        />
      </label>
      <label class="size-field" title="Height — accepts px or %">
        <span class="size-label">H</span>
        <input
          v-model="heightDraft"
          class="size-input"
          type="text"
          inputmode="decimal"
          placeholder="48px"
          aria-label="Image height"
          @change="applyHeight"
          @keydown="onSizeKeydown($event, applyHeight)"
        />
      </label>
      <label class="size-field" title="Border radius — accepts px or %">
        <span class="size-label">R</span>
        <input
          v-model="radiusDraft"
          class="size-input"
          type="text"
          inputmode="decimal"
          placeholder="0px"
          aria-label="Image border radius"
          @change="applyRadius"
          @keydown="onSizeKeydown($event, applyRadius)"
        />
      </label>

      <span class="divider" aria-hidden="true" />

      <ToolButton
        label="Remove image"
        :disabled="!hasImage"
        @click="removeImage"
      >
        <PhTrash :size="iconSize" weight="fill" />
      </ToolButton>
    </template>

    <template v-else>
      <input
        ref="linkInput"
        v-model="linkUrl"
        class="link-input"
        type="url"
        placeholder="https://"
        aria-label="Image link URL"
        @keydown.enter.prevent="applyLink"
        @keydown.escape.prevent="showLink = false"
      />
      <button type="button" class="link-action primary" @click="applyLink">
        Apply
      </button>
      <button
        v-if="hasLink"
        type="button"
        class="link-action"
        @click="removeLink"
      >
        Remove
      </button>
      <button type="button" class="link-action" @click="showLink = false">
        Cancel
      </button>
    </template>
  </div>
</template>

<style scoped>
.image-bubble {
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

.file-input {
  display: none;
}

.divider {
  width: 1px;
  height: 1.25rem;
  margin: 0 0.2rem;
  background: var(--border);
}

.size-field {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  height: 2rem;
  padding: 0 0.25rem 0 0.4rem;
  border-radius: 0.45rem;
  border: 1px solid transparent;
}

.size-field:focus-within {
  border-color: var(--red-1);
}

.size-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--neutral-5);
}

.size-input {
  width: 3.5rem;
  height: 1.5rem;
  padding: 0 0.2rem;
  border: none;
  border-radius: 0.25rem;
  background: var(--surface);
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
  outline: none;
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

.link-input:focus {
  border-color: var(--red-1);
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

@media screen and (max-width: 480px) {
  .size-input {
    width: 2.75rem;
  }

  .size-field {
    padding: 0 0.15rem 0 0.3rem;
  }
}
</style>
