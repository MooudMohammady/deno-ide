"use client";

import type { LintDiagnostic } from "@/lib/linting";
import { lintContent } from "@/lib/linting";
import { useCallback, useState } from "react";

/**
 * Runs linting on file content and tracks diagnostics per file.
 * Requirements: 8.1, 8.2, 8.3
 */
export function useLinting() {
  const [diagnostics, setDiagnostics] = useState<Record<string, LintDiagnostic[]>>({});

  const lintFile = useCallback((fileId: string, content: string, language: string) => {
    const results = lintContent(content, language);
    setDiagnostics((prev) => ({ ...prev, [fileId]: results }));
    return results;
  }, []);

  const clearDiagnostics = useCallback((fileId: string) => {
    setDiagnostics((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  }, []);

  const getDiagnosticsForFile = useCallback(
    (fileId: string): LintDiagnostic[] => diagnostics[fileId] ?? [],
    [diagnostics]
  );

  const totalErrors = Object.values(diagnostics)
    .flat()
    .filter((d) => d.severity === "error").length;

  const totalWarnings = Object.values(diagnostics)
    .flat()
    .filter((d) => d.severity === "warning").length;

  return { diagnostics, lintFile, clearDiagnostics, getDiagnosticsForFile, totalErrors, totalWarnings };
}
