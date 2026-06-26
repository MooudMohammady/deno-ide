"use client";

import type { LintDiagnostic } from "@/lib/linting";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface ProblemsPanelProps {
  diagnostics: Record<string, LintDiagnostic[]>;
  fileMap: Record<string, { name: string }>;
  theme?: "dark" | "light";
  onJumpTo?: (fileId: string, line: number) => void;
}

/**
 * Problems panel showing lint diagnostics across all open files.
 * Requirements: 8.1, 8.3
 */
export default function ProblemsPanel({
  diagnostics,
  fileMap,
  theme = "dark",
  onJumpTo,
}: ProblemsPanelProps) {
  const isDark = theme === "dark";
  const entries = Object.entries(diagnostics).filter(([, diags]) => diags.length > 0);

  const severityIcon = (s: LintDiagnostic["severity"]) => {
    if (s === "error") return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />;
    if (s === "warning") return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-400" />;
    return <Info className="h-3.5 w-3.5 shrink-0 text-blue-400" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-widest opacity-60 shrink-0 ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}>
        Problems
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-3 py-2 text-xs opacity-40 italic">No problems detected</div>
        ) : (
          entries.map(([fileId, diags]) => (
            <div key={fileId}>
              <div className={`px-3 py-0.5 text-xs font-medium ${isDark ? "text-zinc-300 bg-[#2a2d2e]" : "text-zinc-700 bg-zinc-100"}`}>
                {fileMap[fileId]?.name ?? fileId}
              </div>
              {diags.map((d, i) => (
                <div
                  key={i}
                  onClick={() => onJumpTo?.(fileId, d.line)}
                  className={`flex items-start gap-2 px-4 py-0.5 text-xs cursor-pointer ${isDark ? "hover:bg-[#2a2d2e] text-zinc-300" : "hover:bg-zinc-50 text-zinc-700"}`}
                >
                  {severityIcon(d.severity)}
                  <span className="flex-1">{d.message}</span>
                  <span className="opacity-40 shrink-0">Ln {d.line}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
