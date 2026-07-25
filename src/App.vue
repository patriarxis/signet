<script setup lang="ts">
import {
  PhArrowCounterClockwise,
  PhMoon,
  PhSidebar,
} from "@phosphor-icons/vue";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import SignatureInput from "./components/SignatureInput.vue";
import SignaturePreview from "./components/SignaturePreview.vue";
import { useSignatureForm } from "./composables/useSignatureForm";
import { useTheme } from "./composables/useTheme";
import type { UserData } from "./types/signature";

const MOBILE_MQ = "(max-width: 1024px)";

const { isDark, toggleTheme } = useTheme();
const {
  userData,
  updateField,
  updateLogoStyle,
  updateFieldStyle,
  updateLink,
  addLink,
  removeLink,
  resetToDefaults,
} = useSignatureForm();

const previewRef = ref<InstanceType<typeof SignaturePreview> | null>(null);
const inputRef = ref<InstanceType<typeof SignatureInput> | null>(null);
const editorOpenRef = ref<HTMLButtonElement | null>(null);

const isMobile = ref(false);
const drawerOpen = ref(false);

let mobileMql: MediaQueryList | null = null;

function onUpdateField(key: keyof UserData, value: UserData[keyof UserData]) {
  updateField(key, value);
}

function onReset() {
  resetToDefaults();
  previewRef.value?.clearOverrides();
}

function setDrawerOpen(open: boolean) {
  if (!isMobile.value && open) return;
  drawerOpen.value = open;
}

function openDrawer() {
  setDrawerOpen(true);
}

function onMobileChange(event: MediaQueryListEvent) {
  isMobile.value = event.matches;
  if (!event.matches) {
    drawerOpen.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && drawerOpen.value) {
    event.preventDefault();
    setDrawerOpen(false);
  }
}

watch(drawerOpen, async (open) => {
  document.body.classList.toggle("drawer-open", open);

  if (open) {
    await nextTick();
    inputRef.value?.focusDrawer();
  } else if (isMobile.value) {
    editorOpenRef.value?.focus();
  }
});

onMounted(() => {
  mobileMql = window.matchMedia(MOBILE_MQ);
  isMobile.value = mobileMql.matches;
  mobileMql.addEventListener("change", onMobileChange);
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  mobileMql?.removeEventListener("change", onMobileChange);
  document.removeEventListener("keydown", onKeydown);
  document.body.classList.remove("drawer-open");
});
</script>

<template>
  <div class="app">
    <div class="app-actions">
      <button
        ref="editorOpenRef"
        type="button"
        class="action-btn editor-open"
        title="Open editor"
        aria-label="Open editor"
        :aria-expanded="drawerOpen"
        :aria-hidden="!isMobile"
        :tabindex="isMobile ? 0 : -1"
        aria-controls="editor-drawer"
        @click="openDrawer"
      >
        <PhSidebar :size="20" weight="fill" />
      </button>
      <button
        type="button"
        class="action-btn"
        title="Reset to defaults"
        aria-label="Reset to defaults"
        @click="onReset"
      >
        <PhArrowCounterClockwise :size="20" weight="fill" />
      </button>
      <button
        type="button"
        class="action-btn"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <svg
          v-if="isDark"
          class="action-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        <PhMoon v-else :size="20" weight="fill" />
      </button>
    </div>

    <div
      class="drawer-backdrop"
      :class="{ 'drawer-backdrop--visible': isMobile && drawerOpen }"
      aria-hidden="true"
      @click="setDrawerOpen(false)"
    />

    <div class="container">
      <SignatureInput
        ref="inputRef"
        :user-data="userData"
        :drawer-open="drawerOpen"
        :is-mobile="isMobile"
        @close-drawer="setDrawerOpen(false)"
        @update:field="onUpdateField"
        @update:link="updateLink"
        @add:link="addLink"
        @remove:link="removeLink"
      />
      <SignaturePreview
        ref="previewRef"
        :user-data="userData"
        :update-field="updateField"
        :update-logo-style="updateLogoStyle"
        :update-field-style="updateFieldStyle"
        :update-link="updateLink"
      />
    </div>
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  position: relative;
}

.app-actions {
  position: fixed;
  top: 1rem;
  right: 1rem;
  /* Below drawer (50) and backdrop (40) so tools sit under the scrim when open. */
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.action-btn {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.action-btn:hover {
  background-color: var(--neutral-2);
}

.action-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: block;
}

.editor-open {
  display: none;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

.drawer-backdrop--visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.container {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .drawer-backdrop {
    transition: none;
  }
}

@media screen and (max-width: 1024px) {
  .editor-open {
    display: flex;
  }

  .app-actions {
    top: max(0.75rem, env(safe-area-inset-top, 0px));
    right: max(0.75rem, env(safe-area-inset-right, 0px));
  }

  .action-btn {
    background-color: transparent;
    border: none;
    box-shadow: none;
  }

  .action-btn:hover {
    background-color: color-mix(in srgb, var(--neutral-2) 55%, transparent);
  }

  .action-btn:focus-visible {
    background-color: color-mix(in srgb, var(--neutral-2) 45%, transparent);
  }
}
</style>
