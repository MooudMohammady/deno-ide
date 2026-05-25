"use client";

import { useState } from "react";

interface GitFileStatus {
  path: string;
  status: "M" | "A" | "D" | "R";
}

interface GitStatus {
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: string[];
}

interface GitPanelProps {
  status: GitStatus;
  currentBranch: string;
  branches: string[];
  theme?: "dark" | "light";
  onCommit: (message: string) => void;
  onCreateBranch: (name: string) => void;
  onCheckout: (branch: string) => void;
  onStage: (file: string) => void;
  onUnstage: (file: string) => void;
}

/**
 * Git control panel — status, staging, commit, branch management.
 * Requirements: 7.1
 */
export default function GitPanel({
  status,
  currentBranch,
  branches,
  theme = "dark",
  onCommit,
  onCreateBranch,
  onCheckout,
  onStage,
  onUnstage,
}: GitPanelProps) {
  const isDark = theme === "dark";
  const [commitMsg, setCommitMsg] = useState("");
  const [newBranch, setNewBranch] = useState("");

  const sectionClass = `px-3 py-1 text-xs font-semibold uppercase tracking-widest opacity-60 ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`;
  const rowClass = `flex items-center gap-2 px-3 py-0.5 text-xs font-mono ${isDark ? "text-zinc-300 hover:bg-[#2a2d2e]" : "text-zinc-700 hover:bg-zinc-50"}`;

  const statusColor = (s: string) => {
    if (s === "M") return "text-yellow-400";
    if (s === "A") return "text-green-400";
    if (s === "D") return "text-red-400";
    if (s === "?") return "text-zinc-400";
    return "text-zinc-300";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Branch info */}
      <div className={`px-3 py-2 shrink-0 ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}>
        <div className="flex items-center gap-2 text-xs">
          <span className="opacity-60">Branch:</span>
          <select
            value={currentBranch}
            onChange={(e) => onCheckout(e.target.value)}
            className={`flex-1 text-xs px-1 py-0.5 outline-none rounded ${isDark ? "bg-[#3c3c3c] text-zinc-100" : "bg-zinc-100 text-zinc-900"}`}
            aria-label="Current branch"
          >
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 mt-1">
          <input
            placeholder="New branch name…"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newBranch.trim()) {
                onCreateBranch(newBranch.trim());
                setNewBranch("");
              }
            }}
            className={`flex-1 text-xs px-1 py-0.5 outline-none rounded ${isDark ? "bg-[#3c3c3c] text-zinc-100 placeholder-zinc-500" : "bg-zinc-100 text-zinc-900 placeholder-zinc-400"}`}
            aria-label="New branch name"
          />
          <button
            onClick={() => {
              if (newBranch.trim()) {
                onCreateBranch(newBranch.trim());
                setNewBranch("");
              }
            }}
            className="text-xs px-2 py-0.5 rounded text-blue-400 hover:bg-blue-400/10"
            aria-label="Create branch"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Staged changes */}
        <div className={sectionClass}>Staged ({status.staged.length})</div>
        {status.staged.map((f: GitFileStatus) => (
          <div key={f.path} className={rowClass}>
            <span className={`w-4 ${statusColor(f.status)}`}>{f.status}</span>
            <span className="flex-1 truncate">{f.path}</span>
            <button
              onClick={() => onUnstage(f.path)}
              className="opacity-50 hover:opacity-100 text-xs"
              aria-label={`Unstage ${f.path}`}
            >
              −
            </button>
          </div>
        ))}

        {/* Unstaged changes */}
        <div className={`${sectionClass} mt-1`}>Changes ({status.unstaged.length})</div>
        {status.unstaged.map((f: GitFileStatus) => (
          <div key={f.path} className={rowClass}>
            <span className={`w-4 ${statusColor(f.status)}`}>{f.status}</span>
            <span className="flex-1 truncate">{f.path}</span>
            <button
              onClick={() => onStage(f.path)}
              className="opacity-50 hover:opacity-100 text-xs"
              aria-label={`Stage ${f.path}`}
            >
              +
            </button>
          </div>
        ))}

        {/* Untracked */}
        {status.untracked.length > 0 && (
          <>
            <div className={`${sectionClass} mt-1`}>Untracked ({status.untracked.length})</div>
            {status.untracked.map((f: string) => (
              <div key={f} className={rowClass}>
                <span className="w-4 text-zinc-400">?</span>
                <span className="flex-1 truncate">{f}</span>
                <button
                  onClick={() => onStage(f)}
                  className="opacity-50 hover:opacity-100 text-xs"
                  aria-label={`Stage ${f}`}
                >
                  +
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Commit */}
      <div className={`px-3 py-2 shrink-0 ${isDark ? "border-t border-[#3c3c3c]" : "border-t border-zinc-200"}`}>
        <textarea
          placeholder="Commit message…"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          rows={2}
          className={`w-full text-xs px-2 py-1 outline-none rounded resize-none ${isDark ? "bg-[#3c3c3c] text-zinc-100 placeholder-zinc-500" : "bg-zinc-100 text-zinc-900 placeholder-zinc-400"}`}
          aria-label="Commit message"
        />
        <button
          onClick={() => {
            if (commitMsg.trim()) {
              onCommit(commitMsg.trim());
              setCommitMsg("");
            }
          }}
          disabled={!commitMsg.trim() || status.staged.length === 0}
          className="mt-1 w-full text-xs py-1 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-30 transition-colors"
          aria-label="Commit staged changes"
        >
          Commit
        </button>
      </div>
    </div>
  );
}
