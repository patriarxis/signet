<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

withDefaults(
  defineProps<{
    label: string;
    active?: boolean;
    pressed?: boolean;
    disabled?: boolean;
  }>(),
  {
    active: false,
    pressed: false,
    disabled: false,
  },
);

const showTip = ref(false);
let tipTimer: ReturnType<typeof setTimeout> | null = null;

const clearTip = () => {
  if (tipTimer) {
    clearTimeout(tipTimer);
    tipTimer = null;
  }
  showTip.value = false;
};

const onEnter = () => {
  clearTip();
  tipTimer = setTimeout(() => {
    showTip.value = true;
  }, 450);
};

onBeforeUnmount(clearTip);
</script>

<template>
  <button
    type="button"
    class="tool"
    :class="{ active, disabled }"
    :aria-label="label"
    :aria-pressed="pressed"
    :disabled="disabled"
    @mousedown.prevent
    @mouseenter="onEnter"
    @mouseleave="clearTip"
    @focus="onEnter"
    @blur="clearTip"
  >
    <slot />
    <span v-if="showTip" class="tooltip" role="tooltip">{{ label }}</span>
  </button>
</template>

<style scoped>
.tool {
  position: relative;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.4rem;
  border-radius: 0.45rem;
  color: var(--text-color);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tool :deep(svg) {
  display: block;
  flex-shrink: 0;
}

.tool:hover {
  background: var(--neutral-2);
}

.tool:focus-visible {
  outline: 2px solid var(--red-1);
  outline-offset: 1px;
}

.tool.active {
  background: var(--red-1);
  color: var(--neutral-0);
}

.tool.active:hover {
  background: color-mix(in srgb, var(--red-1) 85%, black);
}

.tool:disabled,
.tool.disabled {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}

.tooltip {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 70;
  padding: 0.3rem 0.5rem;
  border-radius: 0.35rem;
  background: var(--text-color);
  color: var(--page-bg);
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}
</style>
