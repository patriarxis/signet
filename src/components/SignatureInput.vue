<script setup lang="ts">
import { PhPlus, PhX } from "@phosphor-icons/vue";
import { ref, watch } from "vue";
import type { UserData } from "../types/signature";
import { useScrollShadows } from "../composables/useScrollShadows";
import { stripHtml, decodeHtmlEntities } from "../utils/html";

const props = defineProps<{
  userData: UserData;
  drawerOpen?: boolean;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  "update:field": [key: keyof UserData, value: UserData[keyof UserData]];
  "update:link": [
    list: "bodyLinks" | "socialLinks",
    index: number,
    patch: { text?: string; url?: string },
  ];
  "add:link": [list: "bodyLinks" | "socialLinks"];
  "remove:link": [list: "bodyLinks" | "socialLinks", index: number];
  "close-drawer": [];
}>();

const asideRef = ref<HTMLElement | null>(null);
const scrollContent = ref<HTMLElement | null>(null);
const { canScrollUp, canScrollDown, update } = useScrollShadows(scrollContent);

watch(
  () => props.userData,
  () => update(),
  { deep: true },
);

watch(
  () => props.drawerOpen,
  () => {
    // Recalc shadows after drawer opens and layout settles.
    requestAnimationFrame(() => update());
  },
);

function onField(key: keyof UserData, event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  emit("update:field", key, target.value);
}

function plain(value: string) {
  return decodeHtmlEntities(stripHtml(value));
}

function focusDrawer() {
  const root = asideRef.value;
  if (!root) return;
  const first = root.querySelector<HTMLElement>(
    'input:not([type="hidden"]), textarea, button:not([aria-hidden="true"])',
  );
  (first ?? root).focus();
}

defineExpose({ focusDrawer });
</script>

<template>
  <aside
    id="editor-drawer"
    ref="asideRef"
    class="aside"
    :class="{ 'aside--open': drawerOpen }"
    :aria-hidden="isMobile && !drawerOpen ? true : undefined"
    :inert="isMobile && !drawerOpen ? true : undefined"
    tabindex="-1"
  >
    <header class="header">
      <div class="header-top">
        <h1 class="title">Signet</h1>
        <button
          v-if="isMobile"
          type="button"
          class="drawer-close"
          title="Close editor"
          aria-label="Close editor"
          @click="emit('close-drawer')"
        >
          <PhX :size="18" weight="bold" />
        </button>
      </div>
      <p class="description">
        Edit in the sidebar or on a signature. Select text to bold, italic,
        underline, strike, or link. Click an image to replace, link, or remove
        it. Toggle code to edit HTML.
      </p>
    </header>

    <div
      class="scroll-container"
      :class="{
        'can-scroll-up': canScrollUp,
        'can-scroll-down': canScrollDown,
      }"
    >
      <div class="scroll-shadow-top"></div>
      <div class="scroll-shadow-bottom"></div>
      <div ref="scrollContent" class="scroll-content">
        <div class="inputs">
          <div class="input-group">
            <label for="name">Name</label>
            <input
              id="name"
              type="text"
              :value="plain(userData.name)"
              placeholder="Add name"
              @input="onField('name', $event)"
            />
          </div>

          <div class="input-group">
            <label for="description">Description</label>
            <input
              id="description"
              type="text"
              :value="plain(userData.description)"
              placeholder="Add title"
              @input="onField('description', $event)"
            />
          </div>

          <div class="input-group">
            <label for="companyName">Company</label>
            <input
              id="companyName"
              type="text"
              :value="plain(userData.companyName)"
              placeholder="Add company"
              @input="onField('companyName', $event)"
            />
          </div>

          <div class="input-group">
            <label for="companyTagline">Tagline</label>
            <input
              id="companyTagline"
              type="text"
              :value="plain(userData.companyTagline)"
              placeholder="Add tagline"
              @input="onField('companyTagline', $event)"
            />
          </div>

          <div class="input-group">
            <label for="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              :value="plain(userData.phone)"
              placeholder="Add phone"
              @input="onField('phone', $event)"
            />
          </div>

          <div class="input-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              :value="plain(userData.email)"
              placeholder="Add email"
              @input="onField('email', $event)"
            />
          </div>

          <div class="input-group">
            <label for="website">Website</label>
            <div class="link-inputs">
              <input
                id="website"
                type="text"
                :value="plain(userData.website)"
                placeholder="Website name"
                @input="onField('website', $event)"
              />
              <input
                class="link-href"
                type="url"
                id="websiteUrl"
                :value="userData.websiteUrl"
                placeholder="URL"
                @input="onField('websiteUrl', $event)"
              />
            </div>
          </div>

          <div class="input-group">
            <label>Body Links</label>
            <div class="links">
              <div
                v-for="(link, index) in userData.bodyLinks"
                :key="`body-${index}`"
                class="link"
              >
                <div class="link-inputs">
                  <input
                    class="link-name"
                    type="text"
                    placeholder="Link text"
                    :value="plain(link.text)"
                    @input="
                      emit('update:link', 'bodyLinks', index, {
                        text: ($event.target as HTMLInputElement).value,
                      })
                    "
                  />
                  <input
                    class="link-href"
                    type="url"
                    placeholder="URL"
                    :value="link.url"
                    @input="
                      emit('update:link', 'bodyLinks', index, {
                        url: ($event.target as HTMLInputElement).value,
                      })
                    "
                  />
                </div>
                <button
                  type="button"
                  class="remove-link"
                  title="Remove link"
                  aria-label="Remove body link"
                  @click="emit('remove:link', 'bodyLinks', index)"
                >
                  <PhX :size="14" weight="bold" />
                </button>
              </div>
              <button
                type="button"
                class="add-link"
                @click="emit('add:link', 'bodyLinks')"
              >
                <PhPlus :size="14" weight="bold" />
                Add Body Link
              </button>
            </div>
          </div>

          <div class="input-group">
            <label>Social Links</label>
            <div class="links">
              <div
                v-for="(link, index) in userData.socialLinks"
                :key="`social-${index}`"
                class="link"
              >
                <div class="link-inputs">
                  <input
                    class="link-name"
                    type="text"
                    placeholder="Link text"
                    :value="plain(link.text)"
                    @input="
                      emit('update:link', 'socialLinks', index, {
                        text: ($event.target as HTMLInputElement).value,
                      })
                    "
                  />
                  <input
                    class="link-href"
                    type="url"
                    placeholder="URL"
                    :value="link.url"
                    @input="
                      emit('update:link', 'socialLinks', index, {
                        url: ($event.target as HTMLInputElement).value,
                      })
                    "
                  />
                </div>
                <button
                  type="button"
                  class="remove-link"
                  title="Remove link"
                  aria-label="Remove social link"
                  @click="emit('remove:link', 'socialLinks', index)"
                >
                  <PhX :size="14" weight="bold" />
                </button>
              </div>
              <button
                type="button"
                class="add-link"
                @click="emit('add:link', 'socialLinks')"
              >
                <PhPlus :size="14" weight="bold" />
                Add Social Link
              </button>
            </div>
          </div>

          <div class="input-group">
            <label for="copyrights">Copyrights</label>
            <input
              id="copyrights"
              type="text"
              :value="plain(userData.copyrights)"
              placeholder="Add copyright"
              @input="onField('copyrights', $event)"
            />
          </div>

          <div class="input-group input-group--disclaimer">
            <label for="disclaimer">Disclaimer</label>
            <textarea
              id="disclaimer"
              :value="plain(userData.disclaimer)"
              placeholder="Add disclaimer"
              @input="onField('disclaimer', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.aside {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: 400px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background-color: var(--surface);
}

.header {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 0.5rem;
  padding: 1.5rem;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
}

.drawer-close {
  display: none;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-color);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.drawer-close:hover {
  background-color: var(--neutral-2);
  color: var(--red-1);
}

.description {
  font-size: 0.95rem;
  color: var(--neutral-6);
}

.scroll-container {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  min-height: 0;
}

.scroll-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.scroll-shadow-top,
.scroll-shadow-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 2rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 20;
}

.scroll-shadow-top {
  top: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.15) 0%,
    rgba(0, 0, 0, 0) 100%
  );
}

.scroll-shadow-bottom {
  bottom: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.15) 0%,
    rgba(0, 0, 0, 0) 100%
  );
}

.can-scroll-up .scroll-shadow-top,
.can-scroll-down .scroll-shadow-bottom {
  opacity: 1;
}

.inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  flex: 1 0 auto;
}

.input-group {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex-shrink: 0;
}

.input-group:not(:last-child) {
  border-bottom: 1px solid var(--border);
}

.input-group--disclaimer {
  flex: 1 1 auto;
  min-height: 12.5rem;
}

label {
  flex-basis: 35%;
  flex-shrink: 0;
  padding: 0.5rem;
  font-weight: 500;
  font-size: 0.825rem;
  border-right: 1px solid var(--border);
  color: var(--neutral-5);
}

input,
textarea {
  position: relative;
  flex-grow: 1;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid transparent;
  font-size: 0.825rem;
  background-color: var(--surface);
  color: var(--text-color);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

textarea {
  width: auto;
  flex: 1 1 auto;
  align-self: stretch;
  height: 100%;
  min-height: 12.5rem;
  resize: none;
  line-height: 1.45;
}

.scroll-content,
textarea {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.scroll-content::-webkit-scrollbar,
textarea::-webkit-scrollbar {
  width: 0.5rem;
}

.scroll-content::-webkit-scrollbar-thumb,
textarea::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 999px;
}

input:focus,
textarea:focus {
  border-color: var(--red-1);
  box-shadow: 0 0 0 0.15rem rgba(239, 65, 54, 0.2);
  z-index: 1;
}

.links {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
}

.link {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.link:not(:last-child) {
  border-bottom: 1px solid var(--border);
}

.link-inputs {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding-right: 1.75rem;
}

.link-href {
  background-color: var(--page-bg);
  color: var(--neutral-7);
  padding: 0.25rem;
  margin: 0 0.5rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
}

.remove-link {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  color: var(--neutral-5);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.remove-link:hover {
  color: var(--red-1);
  background-color: var(--page-bg);
}

.add-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: 0.5rem;
  padding: 0.4rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.7rem;
  color: var(--neutral-7);
  background-color: var(--page-bg);
  border: 1px solid var(--border);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.add-link:hover {
  color: #f2f2f2;
  background-color: var(--red-1);
  border-color: var(--red-1);
}

@media screen and (max-width: 1024px) {
  .aside {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: min(90vw, 400px);
    max-width: min(90vw, 400px);
    height: 100%;
    height: 100dvh;
    border-right: 1px solid var(--border);
    border-bottom: none;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    pointer-events: none;
  }

  .aside--open {
    transform: translateX(0);
    pointer-events: auto;
  }

  .drawer-close {
    display: flex;
  }

  .header {
    padding: 1.25rem 1.25rem 1rem;
  }

  .remove-link {
    width: 2.5rem;
    height: 2.5rem;
    top: 0.25rem;
    right: 0.15rem;
  }

  .link-inputs {
    padding-right: 2.75rem;
  }

  .add-link {
    min-height: 2.5rem;
    padding: 0.55rem;
  }

  input,
  textarea {
    font-size: 1rem;
    padding: 0.65rem 0.5rem;
  }

  label {
    padding: 0.65rem 0.5rem;
  }
}

@media screen and (max-width: 480px) {
  .aside {
    width: 100vw;
    max-width: none;
    border-right: none;
    box-shadow: none;
  }

  .description {
    font-size: 0.875rem;
  }

  .input-group--disclaimer,
  textarea {
    min-height: 10rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .aside {
    transition: none;
  }
}
</style>
