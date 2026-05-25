"use client";

import Editor, { OnChange, OnMount, useMonaco } from "@monaco-editor/react";
import type { editor, editor as MonacoEditor } from "monaco-editor";
import { useRef } from "react";
import type { EditorState } from "../types";
import { useEditorDiagnostics } from "./useEditorDiagnostics";

export interface CodeEditorProps {
  fileId: string;
  content: string;
  language?: string;
  theme?: "dark" | "light";
  fontSize?: number;
  tabSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  onChange?: (value: string) => void;
  onStateChange?: (state: Partial<EditorState>) => void;
  onDiagnostics?: (markers: MonacoEditor.IMarker[]) => void;
}

export default function CodeEditor({
  fileId,
  content,
  language = "plaintext",
  theme = "dark",
  fontSize = 14,
  tabSize = 2,
  wordWrap = false,
  minimap = true,
  onChange,
  onStateChange,
  onDiagnostics,
}: CodeEditorProps) {
  const modelUriRef = useRef<string | null>(null);
  const monaco = useMonaco();

  useEditorDiagnostics(monaco, modelUriRef.current, onDiagnostics);

  const handleMount: OnMount = (editorInstance) => {
    const model = editorInstance.getModel();
    if (model) {
      modelUriRef.current = model.uri.toString();
    }

    editorInstance.onDidChangeCursorPosition((e) => {
      onStateChange?.({
        cursorPosition: {
          line: e.position.lineNumber,
          column: e.position.column,
        },
      });
    });

    editorInstance.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      if (!sel.isEmpty()) {
        onStateChange?.({
          selection: {
            start: { line: sel.startLineNumber, column: sel.startColumn },
            end: { line: sel.endLineNumber, column: sel.endColumn },
          },
        });
      }
    });
  };

  const handleChange: OnChange = (value) => {
    onChange?.(value ?? "");
  };

  const monacoTheme = theme === "dark" ? "vs-dark" : "vs";

  const options: editor.IStandaloneEditorConstructionOptions = {
    fontSize,
    tabSize,
    wordWrap: wordWrap ? "on" : "off",
    minimap: { enabled: minimap },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderLineHighlight: "all",
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    formatOnType: false,
    formatOnPaste: false,
    lineNumbers: "on",
    folding: true,
    bracketPairColorization: { enabled: true },
  };

  return (
    <Editor
      key={fileId}
      height="100%"
      language={language}
      value={content}
      theme={monacoTheme}
      options={options}
      onMount={handleMount}
      onChange={handleChange}
      loading={
        <div className="flex items-center justify-center h-full text-sm opacity-40">
          Loading editor…
        </div>
      }
    />
  );
}
