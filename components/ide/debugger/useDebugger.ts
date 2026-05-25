"use client";

import { useCallback, useState } from "react";
import type { Breakpoint, DebugSession } from "../types";

let _bpCounter = 1;

function createSession(): DebugSession {
  return {
    id: `debug-${Date.now()}`,
    status: "inactive",
    breakpoints: [],
    currentFrame: undefined,
    variables: [],
  };
}

/**
 * Manages debug session state: breakpoints, execution control, variables.
 * Requirements: 4.3, 4.5
 */
export function useDebugger() {
  const [session, setSession] = useState<DebugSession>(createSession);

  const startSession = useCallback(() => {
    setSession((prev) => ({ ...prev, status: "running" }));
  }, []);

  const stopSession = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      status: "inactive",
      currentFrame: undefined,
      variables: [],
    }));
  }, []);

  const pauseSession = useCallback(() => {
    setSession((prev) =>
      prev.status === "running" ? { ...prev, status: "paused" } : prev
    );
  }, []);

  const continueSession = useCallback(() => {
    setSession((prev) =>
      prev.status === "paused" ? { ...prev, status: "running" } : prev
    );
  }, []);

  const stepOver = useCallback(() => {
    // Advance line in current frame (simulated)
    setSession((prev) => {
      if (prev.status !== "paused" || !prev.currentFrame) return prev;
      return {
        ...prev,
        currentFrame: { ...prev.currentFrame, line: prev.currentFrame.line + 1 },
      };
    });
  }, []);

  const stepInto = useCallback(() => {
    setSession((prev) => {
      if (prev.status !== "paused") return prev;
      return prev; // Real implementation would push a new frame
    });
  }, []);

  const stepOut = useCallback(() => {
    setSession((prev) => {
      if (prev.status !== "paused") return prev;
      return prev; // Real implementation would pop the current frame
    });
  }, []);

  const addBreakpoint = useCallback((fileId: string, line: number) => {
    const bp: Breakpoint = {
      id: `bp-${_bpCounter++}`,
      fileId,
      line,
      enabled: true,
    };
    setSession((prev) => ({
      ...prev,
      breakpoints: [...prev.breakpoints, bp],
    }));
    return bp;
  }, []);

  const removeBreakpoint = useCallback((bpId: string) => {
    setSession((prev) => ({
      ...prev,
      breakpoints: prev.breakpoints.filter((bp) => bp.id !== bpId),
    }));
  }, []);

  const toggleBreakpoint = useCallback((bp: Breakpoint) => {
    setSession((prev) => ({
      ...prev,
      breakpoints: prev.breakpoints.map((b) =>
        b.id === bp.id ? { ...b, enabled: !b.enabled } : b
      ),
    }));
  }, []);

  return {
    session,
    startSession,
    stopSession,
    pauseSession,
    continueSession,
    stepOver,
    stepInto,
    stepOut,
    addBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
  };
}
