<script setup lang="ts">
import { PhClipboard, PhCode, PhEye } from "@phosphor-icons/vue";
import {
  defineAsyncComponent,
  markRaw,
  nextTick,
  provide,
  reactive,
  ref,
  type Component,
  type Reactive,
} from "vue";
import {
  CleanSlate,
  CorporatePro,
  DarkEdge,
  ProfilePlus,
  TechmirionTide,
} from "../signatures";
import type {
  BodyLink,
  FieldStyle,
  FieldStyleField,
  LogoStyle,
  UserData,
} from "../types/signature";
import {
  signatureEditorKey,
  type SignatureEditor,
} from "../composables/signatureEditor";
import { useClipboardHtml } from "../composables/useClipboardHtml";
import { formatHtml } from "../utils/formatHtml";
import { sanitizeSignatureHtml } from "../utils/sanitizeSignatureHtml";
import FormatBubble from "./FormatBubble.vue";
import ImageBubble from "./ImageBubble.vue";

const HtmlCodeEditor = defineAsyncComponent(
  () => import("./HtmlCodeEditor.vue"),
);

const props = defineProps<{
  userData: UserData;
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
}>();

const { status, message, copyHtml } = useClipboardHtml();
const toastFor = ref<string | null>(null);

const editor: SignatureEditor = {
  userData: props.userData as Reactive<UserData>,
  updateField: (...args) => props.updateField(...args),
  updateLogoStyle: (...args) => props.updateLogoStyle(...args),
  updateFieldStyle: (...args) => props.updateFieldStyle(...args),
  updateLink: (...args) => props.updateLink(...args),
};

provide(signatureEditorKey, editor);

type SignatureDef = {
  id: string;
  label: string;
  component: Component;
};

const signatures: SignatureDef[] = [
  { id: "dark-edge", label: "Dark Edge", component: markRaw(DarkEdge) },
  { id: "clean-slate", label: "Clean Slate", component: markRaw(CleanSlate) },
  {
    id: "profile-plus",
    label: "Profile Plus",
    component: markRaw(ProfilePlus),
  },
  {
    id: "corporate-pro",
    label: "Corporate Pro",
    component: markRaw(CorporatePro),
  },
  {
    id: "techmirion-tide",
    label: "Techmirion Tide",
    component: markRaw(TechmirionTide),
  },
];

const signatureIds = signatures.map((s) => s.id);
const signatureRootMap = reactive<Record<string, HTMLElement | null>>(
  Object.fromEntries(signatureIds.map((id) => [id, null])),
);

type ViewMode = "preview" | "code";
const viewModes = reactive<Record<string, ViewMode>>(
  Object.fromEntries(signatureIds.map((id) => [id, "preview" as ViewMode])),
);
const codeDrafts = reactive<Record<string, string>>(
  Object.fromEntries(signatureIds.map((id) => [id, ""])),
);
const codeBaselines = reactive<Record<string, string>>(
  Object.fromEntries(signatureIds.map((id) => [id, ""])),
);
const htmlOverrides = reactive<Record<string, string | null>>(
  Object.fromEntries(signatureIds.map((id) => [id, null])),
);

function setSignatureRoot(id: string, el: unknown) {
  signatureRootMap[id] = (el as HTMLElement | null) ?? null;
}

/** Collapse whitespace so formatting-only diffs don't count as edits. */
function normalizeHtml(html: string) {
  return html.replace(/\s+/g, " ").trim();
}

async function copySignature(id: string) {
  toastFor.value = id;
  let html = "";

  if (viewModes[id] === "code") {
    html = codeDrafts[id] || "";
  } else if (htmlOverrides[id]) {
    html = htmlOverrides[id]!;
  } else {
    const root = signatureRootMap[id];
    if (!root) return;
    html = sanitizeSignatureHtml(root);
  }

  await copyHtml(html);
}

async function toggleView(id: string) {
  if (viewModes[id] === "preview") {
    let source = "";
    if (htmlOverrides[id]) {
      source = htmlOverrides[id]!;
    } else {
      await nextTick();
      const root = signatureRootMap[id];
      source = root ? sanitizeSignatureHtml(root) : codeDrafts[id] || "";
    }
    const formatted = formatHtml(source);
    codeDrafts[id] = formatted;
    codeBaselines[id] = formatted;
    viewModes[id] = "code";
    return;
  }

  const draft = codeDrafts[id]?.trim() ?? "";
  const changed =
    !!draft && normalizeHtml(draft) !== normalizeHtml(codeBaselines[id] || "");

  // Keep a static override only when HTML was actually edited.
  // Otherwise restore the live Vue signature so inline editing works again.
  htmlOverrides[id] = changed ? draft : null;
  codeBaselines[id] = "";
  viewModes[id] = "preview";
}

function clearOverrides() {
  signatureIds.forEach((id) => {
    htmlOverrides[id] = null;
    viewModes[id] = "preview";
    codeDrafts[id] = "";
    codeBaselines[id] = "";
  });
}

defineExpose({ clearOverrides });
</script>

<template>
  <div class="signatures-container">
    <FormatBubble />
    <ImageBubble />

    <div class="signatures">
      <div
        v-for="sig in signatures"
        :key="sig.id"
        class="signature-item window"
      >
        <div class="window-top">
          <h3 class="window-title">{{ sig.label }}</h3>
          <div class="window-actions">
            <button
              type="button"
              class="icon-button"
              :title="
                viewModes[sig.id] === 'preview'
                  ? 'Edit HTML code'
                  : 'Preview signature'
              "
              :aria-label="
                viewModes[sig.id] === 'preview'
                  ? 'Edit HTML code'
                  : 'Preview signature'
              "
              @click="toggleView(sig.id)"
            >
              <PhCode
                v-if="viewModes[sig.id] === 'preview'"
                :size="16"
                weight="bold"
              />
              <PhEye v-else :size="16" weight="fill" />
            </button>
            <div class="copy-wrap">
              <button
                type="button"
                class="icon-button"
                title="Copy signature HTML"
                aria-label="Copy signature HTML"
                @click="copySignature(sig.id)"
              >
                <PhClipboard :size="16" weight="bold" />
              </button>
              <p
                v-if="message && toastFor === sig.id"
                class="copy-tooltip"
                :data-status="status"
                role="status"
                aria-live="polite"
              >
                {{ message }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="window-body"
          :class="{ 'window-body--code': viewModes[sig.id] === 'code' }"
        >
          <HtmlCodeEditor
            v-if="viewModes[sig.id] === 'code'"
            v-model="codeDrafts[sig.id]"
          />
          <div
            v-else-if="htmlOverrides[sig.id]"
            class="signature-root signature-override"
            v-html="htmlOverrides[sig.id]"
          />
          <div
            v-else
            :ref="(el) => setSignatureRoot(sig.id, el)"
            class="signature-root"
          >
            <component :is="sig.component" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signatures-container {
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Extra top padding clears fixed reset/theme controls over the first card. */
  padding: 4.5rem 1rem 3rem;
  overflow-y: auto;
  min-width: 0;
  width: 100%;
  height: 100%;
  background-color: var(--page-bg);
  /* Subtle planner-style dot grid */
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, var(--text-color) 14%, transparent) 0.7px,
    transparent 0.8px
  );
  background-size: 14px 14px;
  background-position: 0 0;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.signatures-container::-webkit-scrollbar {
  width: 0.5rem;
}

.signatures-container::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 999px;
}

.signatures {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 680px;
}

.window {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  overflow: visible;
}

.window-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0.6rem;
  border-bottom: 1px solid var(--border);
  background: var(--page-bg);
  border-radius: 0.5rem 0.5rem 0 0;
  position: relative;
  z-index: 2;
}

.window-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.window-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.copy-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-tooltip {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  margin: 0;
  padding: 0.3rem 0.55rem;
  border-radius: 0.3rem;
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  background: #e6e6e6;
  color: #333333;
  border: 1px solid #cccccc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.copy-tooltip[data-status="error"] {
  color: var(--red-1);
}

.window-body {
  padding: 1.5rem;
  background-color: var(--surface);
  border-radius: 0 0 0.5rem 0.5rem;
  overflow: hidden;
}

.window-body--code {
  padding: 0;
  min-height: 18rem;
}

.signature-root {
  display: flex;
  justify-content: center;
  width: 100%;
  color: var(--text-color);
}

/* Center only the outer signature table — nested social/link tables stay left. */
.signature-root :deep(> table) {
  margin-left: auto;
  margin-right: auto;
}

.signature-override :deep(table) {
  max-width: 100%;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: transparent;
  border: none;
  cursor: pointer;
  border-radius: 0.35rem;
  color: var(--text-color);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.icon-button:hover {
  color: var(--red-1);
  background-color: color-mix(in srgb, var(--red-1) 10%, transparent);
}

@media screen and (max-width: 1024px) {
  .signatures-container {
    padding: 4.5rem 0.75rem 1.25rem;
    align-items: center;
  }

  .signatures {
    gap: 1rem;
    width: 100%;
    max-width: min(100%, 680px);
    margin-inline: auto;
  }

  .window {
    width: 100%;
    max-width: 100%;
    margin-inline: auto;
  }

  .window-body:not(.window-body--code) {
    padding: 1rem 0.75rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Center signatures; allow in-card horizontal scroll when tables are wider. */
  .signature-root {
    display: flex;
    justify-content: center;
    width: max-content;
    min-width: 100%;
    margin-inline: auto;
  }

  .signature-root :deep(> table) {
    margin-left: auto;
    margin-right: auto;
  }

  .icon-button {
    width: 2.5rem;
    height: 2.5rem;
  }

  .copy-tooltip {
    max-width: min(70vw, 14rem);
    white-space: normal;
  }
}

@media screen and (max-width: 480px) {
  .signatures-container {
    padding: 4.25rem 0.5rem 1rem;
  }

  .window-body:not(.window-body--code) {
    padding: 0.75rem 0.5rem;
  }

  .window-body--code {
    min-height: 14rem;
  }
}
</style>
