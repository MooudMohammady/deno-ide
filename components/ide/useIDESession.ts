"use client";

import { useCallback, useEffect } from "react";
import type { EditorState } from "./types";

const SESSION_KEY = "web-ide-session";

interface SessionData {
  openFiles: string[];
  activeFileId: string | null;
}

function loadSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data: SessionData) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Persists editor session state (open files, active file) to sessionStorage.
 * Requirements: 6.5
 */
export function useIDESession(
  editorState: EditorState,
  onRestore: (data: SessionData) => void
) {
  // Restore session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      onRestore(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save session whenever editor state changes
  useEffect(() => {
    saveSession({
      openFiles: editorState.openFiles,
      activeFileId: editorState.activeFileId,
    });
  }, [editorState.openFiles, editorState.activeFileId]);

  const clearSession = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  return { clearSession };
}
