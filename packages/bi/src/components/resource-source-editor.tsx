import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redo,
  redoDepth,
  undo,
  undoDepth,
} from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  StreamLanguage,
  syntaxHighlighting,
} from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import {
  highlightSelectionMatches,
  openSearchPanel,
  search,
  searchKeymap,
} from "@codemirror/search";
import { countColumn, EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
const phrases = {
  Find: "查找",
  Replace: "替换",
  next: "下一处",
  previous: "上一处",
  all: "全部",
  "match case": "区分大小写",
  "by word": "全字匹配",
  regexp: "正则表达式",
  replace: "替换",
  "replace all": "全部替换",
  close: "关闭",
  "No matches found": "未找到匹配",
  "Go to line": "跳转到行",
};
const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      backgroundColor: "var(--color-background-workspace)",
      color: "var(--color-text-primary)",
      fontSize: "13px",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "ui-monospace, SFMono-Regular, monospace",
    },
    ".cm-content": {
      padding: "16px 0",
      caretColor: "var(--color-text-primary)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-background-workspace)",
      color: "var(--color-text-muted)",
      border: "none",
    },
    ".cm-activeLine,.cm-activeLineGutter": {
      backgroundColor: "var(--color-interaction-hover)",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-cursor": { borderLeftColor: "var(--color-text-primary)" },
    ".cm-panels": {
      backgroundColor: "var(--color-background-surface)",
      color: "var(--color-text-primary)",
      borderColor: "var(--color-border-subtle)",
    },
    ".cm-search input": {
      background: "var(--color-background-card)",
      color: "var(--color-text-primary)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "4px",
    },
    ".cm-button": {
      background: "var(--color-background-neutral-action)",
      color: "var(--color-text-primary)",
      border: "none",
      borderRadius: "4px",
    },
  },
  { dark: true },
);
export type ResourceEditorStatus = {
  line: number;
  column: number;
  lines: number;
  selected: number;
  canUndo: boolean;
  canRedo: boolean;
};
function cursorStatus(state: EditorState): ResourceEditorStatus {
  const selection = state.selection.main,
    line = state.doc.lineAt(selection.head);
  return {
    canUndo: undoDepth(state) > 0,
    canRedo: redoDepth(state) > 0,
    line: line.number,
    column:
      countColumn(
        line.text.slice(0, selection.head - line.from),
        state.tabSize,
      ) + 1,
    lines: state.doc.lines,
    selected: Array.from(state.sliceDoc(selection.from, selection.to)).length,
  };
}
export type ResourceEditorActions = {
  find: () => void;
  undo: () => void;
  redo: () => void;
};
export const ResourceSourceEditor = forwardRef<
  ResourceEditorActions,
  {
    path: string;
    initialText: string;
    readOnly?: boolean;
    onMount?: (text: string) => void;
    onChange: (text: string) => void;
    onSave: () => void;
    onStatus: (status: ResourceEditorStatus) => void;
  }
>(function ResourceSourceEditor(
  { path, initialText, readOnly = false, onMount, onChange, onSave, onStatus },
  ref,
) {
  const parent = useRef<HTMLDivElement>(null),
    view = useRef<EditorView | null>(null),
    callbacks = useRef({ onChange, onSave, onStatus });
  callbacks.current = { onChange, onSave, onStatus };
  useImperativeHandle(
    ref,
    () => ({
      find: () => {
        if (view.current) openSearchPanel(view.current);
      },
      undo: () => {
        if (view.current) {
          undo(view.current);
          view.current.focus();
        }
      },
      redo: () => {
        if (view.current) {
          redo(view.current);
          view.current.focus();
        }
      },
    }),
    [],
  );
  useEffect(() => {
    if (!parent.current) return;
    const ext = path.split(".").at(-1)?.toLowerCase();
    const language =
      ext === "md" || ext === "markdown"
        ? markdown()
        : ext === "json"
          ? json()
          : ext === "yaml" || ext === "yml"
            ? yaml()
            : ["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext || "")
              ? javascript({
                  typescript: ext === "ts" || ext === "tsx",
                  jsx: ext === "jsx" || ext === "tsx",
                })
              : ext === "sh"
                ? StreamLanguage.define(shell)
                : [];
    const editor = new EditorView({
      parent: parent.current,
      state: EditorState.create({
        doc: initialText,
        extensions: [
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          drawSelection(),
          history(),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle),
          language,
          search({ top: true }),
          highlightSelectionMatches(),
          EditorState.phrases.of(phrases),
          editorTheme,
          EditorView.contentAttributes.of({ "aria-label": "资源源码" }),
          keymap.of([
            {
              key: "Mod-s",
              run: () => {
                callbacks.current.onSave();
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              callbacks.current.onChange(update.state.doc.toString());
            if (update.docChanged || update.selectionSet)
              callbacks.current.onStatus(cursorStatus(update.state));
          }),
        ],
      }),
    });
    view.current = editor;
    onMount?.(initialText);
    callbacks.current.onStatus(cursorStatus(editor.state));
    return () => {
      editor.destroy();
      view.current = null;
    };
    // One editor instance per file/edit session; parent changes text through CodeMirror transactions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return (
    <div className="wrb-source-editor">
      <div className="wrb-editor-mount" ref={parent} />
    </div>
  );
});
