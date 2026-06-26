"use client";

import { useCallback, useState } from "react";
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
  workingDirectory?: string;
};

export function useRealTerminal({ session, projectId = "default", workingDirectory }: UseRealTerminalOptions) {
  const [output, setOutput] = useState<string[]>([
    `${session.title} ready`,
    `Current directory: ${session.currentDirectory || "/"}`,
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState(session.currentDirectory || "/");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

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

  const historyEntry = historyIndex >= 0 && historyIndex < commandHistory.length ? commandHistory[historyIndex] ?? "" : "";

  const executeCommand = useCallback(async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) {
      return { success: true, output: "", error: undefined };
    }

    pushCommandHistory(trimmed);
    setLoading(true);
    setError(null);
    setOutput((prev) => [...prev, `$ ${trimmed}`]);

    try {
      const response = await fetch("/api/terminal/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: trimmed,
          projectId,
          cwd: workingDirectory,
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
        setCurrentDirectory(data.cwd);
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
  }, [projectId, pushCommandHistory, workingDirectory]);

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
