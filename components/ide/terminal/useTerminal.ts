"use client";

import { useCallback, useState } from "react";
import type { TerminalSession } from "../types";

let _sessionCounter = 1;

function createSession(cwd = "~"): TerminalSession {
  return {
    id: `terminal-${_sessionCounter++}`,
    title: `Terminal ${_sessionCounter - 1}`,
    history: [],
    currentDirectory: cwd,
    isActive: true,
  };
}

/**
 * Manages multiple terminal sessions.
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
export function useTerminal() {
  const [sessions, setSessions] = useState<TerminalSession[]>(() => [
    createSession(),
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => sessions[0]?.id ?? ""
  );

  const newSession = useCallback(() => {
    const session = createSession();
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(session.id);
    return session;
  }, []);

  const closeSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      return remaining;
    });
    setActiveSessionId((prev) => {
      if (prev !== sessionId) return prev;
      const remaining = sessions.filter((s) => s.id !== sessionId);
      return remaining[remaining.length - 1]?.id ?? "";
    });
  }, [sessions]);

  const appendHistory = useCallback((sessionId: string, line: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, history: [...s.history, line] }
          : s
      )
    );
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return {
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    newSession,
    closeSession,
    appendHistory,
  };
}
