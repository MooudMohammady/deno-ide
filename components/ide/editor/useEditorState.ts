"use client";

import { useCallback, useState } from "react";
import type { EditorState } from "../types";

const initialState: EditorState = {
  activeFileId: null,
  openFiles: [],
  cursorPosition: { line: 1, column: 1 },
};

/**
 * Manages editor state: active file, open tabs, cursor position, selection.
 * Requirements: 1.2, 1.3
 */
export function useEditorState() {
  const [state, setState] = useState<EditorState>(initialState);

  const openFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      activeFileId: fileId,
      openFiles: prev.openFiles.includes(fileId)
        ? prev.openFiles
        : [...prev.openFiles, fileId],
    }));
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setState((prev) => {
      const openFiles = prev.openFiles.filter((id) => id !== fileId);
      const activeFileId =
        prev.activeFileId === fileId
          ? (openFiles[openFiles.length - 1] ?? null)
          : prev.activeFileId;
      return { ...prev, openFiles, activeFileId };
    });
  }, []);

  const setActiveFile = useCallback((fileId: string | null) => {
    setState((prev) => ({ ...prev, activeFileId: fileId }));
  }, []);

  const updateEditorState = useCallback((partial: Partial<EditorState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return { state, openFile, closeFile, setActiveFile, updateEditorState };
}
