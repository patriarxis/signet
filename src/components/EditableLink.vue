<script setup lang="ts">
import { computed, inject } from "vue";
import { signatureEditorKey } from "../composables/signatureEditor";
import EditableText from "./EditableText.vue";

const props = defineProps<{
  list: "bodyLinks" | "socialLinks";
  index: number;
  placeholder: string;
  display?: "block" | "inline-block";
  linkStyle?: string;
}>();

const editor = inject(signatureEditorKey);
if (!editor) {
  throw new Error("EditableLink requires signature editor context");
}

const { userData, updateLink } = editor;

const link = computed(() => userData[props.list][props.index]);

function onText(value: string) {
  updateLink(props.list, props.index, { text: value });
}

function onClick(event: MouseEvent) {
  event.preventDefault();
}
</script>

<template>
  <a
    v-if="link"
    class="editable-link"
    data-signet-link="true"
    :href="link.url || '#'"
    :style="[linkStyle, { display }]"
    @click="onClick"
  >
    <EditableText
      tag="span"
      :model-value="link.text"
      :placeholder="placeholder"
      @update:model-value="onText"
    />
  </a>
</template>

<style scoped>
.editable-link {
  text-decoration: none;
  color: inherit;
  cursor: text;
}
</style>
