"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TerminalSession } from "../types";

interface TerminalResponse {
  success: boolean;
  output: string;
  error?: string;
  cwd?: string;
}

type UseRealTerminalOptions = {
  session: TerminalSession;
  projectId?: string;
  initialDirectory?: string;
  localMode?: boolean;
  onCwdChange?: (sessionId: string, cwd: string) => void;
};

function formatPromptPath(cwd: string) {
  return cwd === "." ? "~" : cwd;
}

export function useRealTerminal({
  session,
  projectId = "default",
  initialDirectory,
  localMode = false,
  onCwdChange,
}: UseRealTerminalOptions) {
  const startingDirectory = initialDirectory || session.currentDirectory || ".";
  const [currentDirectory, setCurrentDirectory] = useState(startingDirectory);
  const [executionDirectory, setExecutionDirectory] = useState(localMode ? "." : startingDirectory);
  const executionDirectoryRef = useRef(localMode ? "." : startingDirectory);
  const displayDirectoryRef = useRef(startingDirectory);
  const previousInitialDirectory = useRef(startingDirectory);

  useEffect(() => {
    displayDirectoryRef.current = currentDirectory;
  }, [currentDirectory]);

  useEffect(() => {
    executionDirectoryRef.current = executionDirectory;
  }, [executionDirectory]);

  const [output, setOutput] = useState<string[]>(() => [
    `${session.title} ready`,
    `Current directory: ${formatPromptPath(startingDirectory)}`,
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useEffect(() => {
    if (!initialDirectory || previousInitialDirectory.current === initialDirectory) return;

    previousInitialDirectory.current = initialDirectory;
    setCurrentDirectory(initialDirectory);
    if (!localMode) {
      setExecutionDirectory(initialDirectory);
      executionDirectoryRef.current = initialDirectory;
    }
    onCwdChange?.(session.id, initialDirectory);
    setOutput((prev) => [
      ...prev,
      `Working directory set to: ${formatPromptPath(initialDirectory)}`,
      "",
    ]);
  }, [initialDirectory, localMode, onCwdChange, session.id]);

  const updateCwd = useCallback(
    (cwd: string) => {
      setExecutionDirectory(cwd);
      executionDirectoryRef.current = cwd;

      if (!localMode) {
        setCurrentDirectory(cwd);
        displayDirectoryRef.current = cwd;
        onCwdChange?.(session.id, cwd);
      }
    },
    [localMode, onCwdChange, session.id]
  );

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const pushCommandHistory = useCallback((command: string) => {
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);
  }, []);

  const historyUp = useCallback(() => {
    setHistoryIndex((current) =>
      commandHistory.length === 0 ? -1 : current < 0 ? commandHistory.length - 1 : Math.max(0, current - 1)
    );
  }, [commandHistory]);

  const historyDown = useCallback(() => {
    setHistoryIndex((current) => {
      if (commandHistory.length === 0) return -1;
      if (current < 0) return -1;
      const nextIndex = current + 1;
      return nextIndex >= commandHistory.length ? -1 : nextIndex;
    });
  }, [commandHistory]);

  const historyEntry =
    historyIndex >= 0 && historyIndex < commandHistory.length ? commandHistory[historyIndex] ?? "" : "";

  const executeCommand = useCallback(
    async (command: string) => {
      const trimmed = command.trim();
      if (!trimmed) {
        return { success: true, output: "", error: undefined };
      }

      pushCommandHistory(trimmed);
      setLoading(true);
      setError(null);
      setOutput((prev) => [
        ...prev,
        `$ ${formatPromptPath(displayDirectoryRef.current)} > ${trimmed}`,
      ]);

      try {
        const response = await fetch("/api/terminal/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: trimmed,
            projectId,
            cwd: executionDirectoryRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to execute command");
        }

        const data: TerminalResponse = await response.json();

        if (data.output) {
          setOutput((prev) => [...prev, data.output, ""]);
        }

        if (data.error) {
          setOutput((prev) => [...prev, `Error: ${data.error}`, ""]);
        }

        if (data.cwd) {
          updateCwd(data.cwd);
        }

        return data;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown terminal error";
        setError(errorMessage);
        setOutput((prev) => [...prev, `Error: ${errorMessage}`, ""]);
        return { success: false, output: "", error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [projectId, pushCommandHistory, updateCwd]
  );

  return {
    output,
    loading,
    error,
    currentDirectory,
    commandHistory,
    historyIndex,
    historyEntry,
    setHistoryIndex,
    executeCommand,
    clearOutput,
    historyUp,
    historyDown,
  };
}
