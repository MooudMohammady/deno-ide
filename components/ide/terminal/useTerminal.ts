"use client";

import { useCallback, useEffect, useState } from "react";
import type { TerminalSession } from "../types";

let _sessionCounter = 1;

function createSession(cwd = "."): TerminalSession {
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
export function useTerminal(initialDirectory = ".") {
  const [sessions, setSessions] = useState<TerminalSession[]>(() => [createSession(initialDirectory)]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id ?? "");

  const newSession = useCallback(() => {
    const baseCwd = sessions.find((session) => session.id === activeSessionId)?.currentDirectory ?? initialDirectory;
    const session = createSession(baseCwd);
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(session.id);
    return session;
  }, [activeSessionId, initialDirectory, sessions]);

  const closeSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const remaining = prev.filter((session) => session.id !== sessionId);
        if (remaining.length === 0) {
          const fallback = createSession(initialDirectory);
          setActiveSessionId(fallback.id);
          return [fallback];
        }

        setActiveSessionId((current) =>
          current === sessionId ? remaining[remaining.length - 1]!.id : current
        );
        return remaining;
      });
    },
    [initialDirectory]
  );

  const appendHistory = useCallback((sessionId: string, line: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, history: [...session.history, line] } : session
      )
    );
  }, []);

  const updateHistory = useCallback((sessionId: string, newHistory: string[]) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, history: newHistory } : session))
    );
  }, []);

  const updateSessionCwd = useCallback((sessionId: string, cwd: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, currentDirectory: cwd } : session))
    );
  }, []);

  const setWorkspaceDirectory = useCallback((cwd: string) => {
    setSessions((prev) => prev.map((session) => ({ ...session, currentDirectory: cwd })));
  }, []);

  useEffect(() => {
    setWorkspaceDirectory(initialDirectory);
  }, [initialDirectory, setWorkspaceDirectory]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;

  return {
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    newSession,
    closeSession,
    appendHistory,
    updateHistory,
    updateSessionCwd,
    setWorkspaceDirectory,
  };
}
