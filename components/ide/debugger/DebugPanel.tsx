"use client";

import {
  ArrowDown,
  ArrowUp,
  Circle,
  Play,
  RotateCcw,
  SkipForward,
  Square,
} from "lucide-react";
import type { Breakpoint, DebugSession, Variable } from "../types";

interface DebugPanelProps {
  session: DebugSession;
  theme?: "dark" | "light";
  onStart: () => void;
  onStop: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onContinue: () => void;
  onToggleBreakpoint: (bp: Breakpoint) => void;
}

/**
 * Debug panel showing controls, variables, call stack, and breakpoints.
 * Requirements: 4.1, 4.2, 4.4
 */
export default function DebugPanel({
  session,
  theme = "dark",
  onStart,
  onStop,
  onStepOver,
  onStepInto,
  onStepOut,
  onContinue,
  onToggleBreakpoint,
}: DebugPanelProps) {
  const isDark = theme === "dark";
  const isRunning = session.status === "running" || session.status === "paused";

  const sectionClass = `px-3 py-1 text-xs font-semibold uppercase tracking-widest opacity-60 ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`;
  const rowClass = `px-3 py-0.5 text-xs font-mono ${isDark ? "text-zinc-300" : "text-zinc-700"}`;

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Controls */}
      <div
        className={`flex items-center gap-1 px-2 py-1 shrink-0 ${isDark ? "bg-[#252526] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-200"}`}
      >
        {!isRunning ? (
          <button
            onClick={onStart}
            className="rounded px-2 py-0.5 text-green-400 transition-colors hover:bg-green-400/10"
            aria-label="Start debugging"
            title="Start"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <>
            <button
              onClick={onContinue}
              disabled={session.status !== "paused"}
              className="rounded px-2 py-0.5 text-blue-400 transition-colors hover:bg-blue-400/10 disabled:opacity-30"
              aria-label="Continue"
              title="Continue"
            >
              <SkipForward className="h-3.5 w-3.5 fill-current" />
            </button>
            <button
              onClick={onStepOver}
              disabled={session.status !== "paused"}
              className="rounded px-2 py-0.5 opacity-70 transition-opacity hover:opacity-100 disabled:opacity-30"
              aria-label="Step over"
              title="Step Over"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onStepInto}
              disabled={session.status !== "paused"}
              className="rounded px-2 py-0.5 opacity-70 transition-opacity hover:opacity-100 disabled:opacity-30"
              aria-label="Step into"
              title="Step Into"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onStepOut}
              disabled={session.status !== "paused"}
              className="rounded px-2 py-0.5 opacity-70 transition-opacity hover:opacity-100 disabled:opacity-30"
              aria-label="Step out"
              title="Step Out"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onStop}
              className="rounded px-2 py-0.5 text-red-400 transition-colors hover:bg-red-400/10"
              aria-label="Stop debugging"
              title="Stop"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          </>
        )}
        <span className="ml-auto opacity-50 capitalize">{session.status}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Variables */}
        <div className={sectionClass}>Variables</div>
        {session.variables.length === 0 ? (
          <div className={`${rowClass} opacity-40 italic`}>No variables</div>
        ) : (
          session.variables.map((v: Variable) => (
            <div key={v.name} className={rowClass}>
              <span className="text-blue-400">{v.name}</span>
              <span className="opacity-50"> : {v.type} = </span>
              <span>{v.value}</span>
            </div>
          ))
        )}

        {/* Call Stack */}
        <div className={`${sectionClass} mt-2`}>Call Stack</div>
        {session.currentFrame ? (
          <div className={rowClass}>
            <span>{session.currentFrame.name}</span>
            <span className="opacity-50"> — line {session.currentFrame.line}</span>
          </div>
        ) : (
          <div className={`${rowClass} opacity-40 italic`}>No active frame</div>
        )}

        {/* Breakpoints */}
        <div className={`${sectionClass} mt-2`}>Breakpoints</div>
        {session.breakpoints.length === 0 ? (
          <div className={`${rowClass} opacity-40 italic`}>No breakpoints</div>
        ) : (
          session.breakpoints.map((bp: Breakpoint) => (
            <div
              key={bp.id}
              className={`${rowClass} flex items-center gap-2 cursor-pointer hover:opacity-80`}
              onClick={() => onToggleBreakpoint(bp)}
            >
              <Circle
                className={`h-2.5 w-2.5 ${bp.enabled ? "fill-red-400 text-red-400" : "opacity-30"}`}
              />
              <span>Line {bp.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
