<script setup lang="ts">
import { html } from "@codemirror/lang-html";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  HighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const host = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;
let applyingExternal = false;

const LINE_HEIGHT = "20px";

const CARET_DOWN =
  "M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z";
const CARET_RIGHT =
  "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z";

function caretMarker(open: boolean) {
  const wrapper = document.createElement("span");
  wrapper.className = "cm-fold-marker";
  wrapper.innerHTML = `<svg viewBox="0 0 256 256" width="10" height="10" aria-hidden="true"><path d="${
    open ? CARET_DOWN : CARET_RIGHT
  }" fill="currentColor"/></svg>`;
  return wrapper;
}

const highlightStyle = HighlightStyle.define([
  { tag: tags.tagName, color: "var(--code-tag)" },
  { tag: tags.angleBracket, color: "var(--code-punct)" },
  { tag: tags.attributeName, color: "var(--code-attr)" },
  { tag: tags.attributeValue, color: "var(--code-string)" },
  { tag: tags.string, color: "var(--code-string)" },
  { tag: tags.comment, color: "var(--code-comment)", fontStyle: "italic" },
  { tag: tags.number, color: "var(--code-number)" },
  { tag: tags.unit, color: "var(--code-number)" },
  { tag: tags.keyword, color: "var(--code-keyword)" },
  { tag: tags.propertyName, color: "var(--code-attr)" },
  { tag: tags.variableName, color: "var(--code-keyword)" },
  { tag: tags.definitionOperator, color: "var(--code-punct)" },
  { tag: tags.punctuation, color: "var(--code-punct)" },
  { tag: tags.documentMeta, color: "var(--code-comment)" },
  { tag: tags.content, color: "var(--text-color)" },
]);

function createTheme() {
  return EditorView.theme({
    "&": {
      height: "100%",
      minHeight: "18rem",
      fontSize: "13px",
      backgroundColor: "var(--surface)",
      color: "var(--text-color)",
    },
    ".cm-scroller": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      lineHeight: LINE_HEIGHT,
      overflow: "auto",
    },
    ".cm-content": {
      padding: "12px 0",
      caretColor: "var(--text-color)",
      fontFamily: "inherit",
      lineHeight: LINE_HEIGHT,
      userSelect: "text",
      WebkitUserSelect: "text",
    },
    ".cm-line": {
      padding: "0 12px",
      lineHeight: LINE_HEIGHT,
    },
    ".cm-gutters": {
      backgroundColor: "var(--page-bg)",
      color: "var(--neutral-5)",
      border: "none",
      borderRight: "1px solid var(--border)",
      padding: "0",
      lineHeight: LINE_HEIGHT,
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
      pointerEvents: "none",
    },
    ".cm-foldGutter": {
      pointerEvents: "auto",
    },
    ".cm-gutterElement": {
      lineHeight: LINE_HEIGHT,
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 12px",
      minWidth: "2rem",
      textAlign: "right",
      userSelect: "none",
    },
    ".cm-foldGutter .cm-gutterElement": {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      width: "16px",
      padding: "0",
      lineHeight: LINE_HEIGHT,
    },
    ".cm-fold-marker": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: LINE_HEIGHT,
      width: "100%",
      color: "var(--neutral-5)",
      cursor: "pointer",
      userSelect: "none",
    },
    ".cm-fold-marker:hover": {
      color: "var(--text-color)",
    },
    ".cm-fold-marker svg": {
      display: "block",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--code-active-line)",
      color: "var(--text-color)",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--code-active-line)",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--code-selection) !important",
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      {
        backgroundColor: "var(--code-selection) !important",
      },
    ".cm-content ::selection, .cm-content *::selection": {
      backgroundColor: "var(--red-1) !important",
      color: "var(--selection-fg) !important",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--text-color)",
      borderLeftWidth: "2px",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "var(--page-bg)",
      border: "1px solid var(--border)",
      color: "var(--neutral-5)",
      borderRadius: "0.2rem",
      padding: "0 0.25rem",
    },
  });
}

/** Page Select All often skips contenteditable; mirror it visually. */
let pointerDown = false;

function selectionLeavesEditor(
  selection: Selection,
  editor: HTMLElement,
): boolean {
  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  const anchorOutside = !!anchor && !editor.contains(anchor);
  const focusOutside = !!focus && !editor.contains(focus);
  return anchorOutside || focusOutside;
}

function syncPageSelection() {
  if (!view || !host.value) return;
  const editor = view.dom;

  // While a click is held, the browser may stretch selection from the editor
  // to the click target — ignore that so unfocus doesn't flash red.
  if (pointerDown) {
    editor.classList.remove("cm-page-selected");
    return;
  }

  const selection = window.getSelection();
  let pageSelected = false;

  if (
    selection &&
    selection.rangeCount > 0 &&
    !selection.isCollapsed &&
    !view.hasFocus &&
    selectionLeavesEditor(selection, editor)
  ) {
    try {
      pageSelected = selection.getRangeAt(0).intersectsNode(editor);
    } catch {
      pageSelected = false;
    }
  }

  editor.classList.toggle("cm-page-selected", pageSelected);
}

function clearNativeSelectionIfTouchesEditor(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
  try {
    if (selection.getRangeAt(0).intersectsNode(editor)) {
      selection.removeAllRanges();
    }
  } catch {
    /* ignore */
  }
}

function onPointerDown(event: PointerEvent) {
  pointerDown = true;
  const editor = view?.dom;
  if (!editor) return;

  editor.classList.remove("cm-page-selected");

  const target = event.target as Node | null;
  // Clicking outside after selecting code: drop native selection immediately
  // so dark-mode ::selection (black text) can't linger without the red bg.
  if (target && !editor.contains(target)) {
    clearNativeSelectionIfTouchesEditor(editor);
    const head = view!.state.selection.main.head;
    view!.dispatch({ selection: EditorSelection.cursor(head) });
  }
}

function onPointerUp() {
  pointerDown = false;
  syncPageSelection();
}

onMounted(() => {
  if (!host.value) return;

  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        foldGutter({
          markerDOM: caretMarker,
        }),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        history(),
        syntaxHighlighting(highlightStyle, { fallback: true }),
        html(),
        createTheme(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
        EditorView.domEventHandlers({
          blur(_event, editorView) {
            requestAnimationFrame(() => {
              if (editorView.hasFocus) return;
              const head = editorView.state.selection.main.head;
              editorView.dispatch({
                selection: EditorSelection.cursor(head),
              });
              clearNativeSelectionIfTouchesEditor(editorView.dom);
              editorView.dom.classList.remove("cm-page-selected");
            });
          },
          focus() {
            view?.dom.classList.remove("cm-page-selected");
          },
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || applyingExternal) return;
          emit("update:modelValue", update.state.doc.toString());
        }),
        EditorView.lineWrapping,
      ],
    }),
  });

  document.addEventListener("selectionchange", syncPageSelection);
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointercancel", onPointerUp, true);
});

watch(
  () => props.modelValue,
  (value) => {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    applyingExternal = true;
    view.dispatch({
      changes: {
        from: 0,
        to: current.length,
        insert: value,
      },
    });
    applyingExternal = false;
  },
);

onBeforeUnmount(() => {
  document.removeEventListener("selectionchange", syncPageSelection);
  document.removeEventListener("pointerdown", onPointerDown, true);
  document.removeEventListener("pointerup", onPointerUp, true);
  document.removeEventListener("pointercancel", onPointerUp, true);
  view?.destroy();
  view = null;
});
</script>

<template>
  <div ref="host" class="html-code-editor" />
</template>

<style scoped>
.html-code-editor {
  width: 100%;
  min-height: 18rem;
  height: 100%;
  background: var(--surface);
  overflow: hidden;
}

.html-code-editor :deep(.cm-editor) {
  height: 100%;
  max-width: 100%;
}

.html-code-editor :deep(.cm-scroller) {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.html-code-editor :deep(.cm-gutters) {
  user-select: none;
  -webkit-user-select: none;
}

/* When the page selection covers this editor but CM isn't focused,
   paint the code like a normal red selection (contenteditable is skipped). */
.html-code-editor :deep(.cm-editor.cm-page-selected .cm-content),
.html-code-editor :deep(.cm-editor.cm-page-selected .cm-line),
.html-code-editor :deep(.cm-editor.cm-page-selected .cm-line *) {
  background-color: var(--red-1) !important;
  color: var(--selection-fg) !important;
}

.html-code-editor :deep(.cm-editor.cm-page-selected .cm-gutters) {
  background-color: color-mix(in srgb, var(--red-1) 85%, black);
  color: var(--selection-fg);
  border-right-color: transparent;
}

.html-code-editor :deep(.cm-editor.cm-page-selected .cm-activeLine),
.html-code-editor :deep(.cm-editor.cm-page-selected .cm-activeLineGutter) {
  background-color: transparent;
}

@media screen and (max-width: 480px) {
  .html-code-editor {
    min-height: 14rem;
  }

  .html-code-editor :deep(.cm-editor) {
    font-size: 12px;
  }
}
</style>
