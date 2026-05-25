"use client";

import dynamic from "next/dynamic";
import { useTerminal } from "./useTerminal";

const TerminalPane = dynamic(() => import("./TerminalPane"), { ssr: false });

interface TerminalPanelProps {
  theme?: "dark" | "light";
}

/**
 * Multi-tab terminal panel.
 * Requirements: 3.1, 3.3, 3.5
 */
export default function TerminalPanel({ theme = "dark" }: TerminalPanelProps) {
  const isDark = theme === "dark";
  const { sessions, activeSessionId, setActiveSessionId, newSession, closeSession } =
    useTerminal();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div
        className={`flex items-center shrink-0 ${isDark ? "bg-[#252526] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-300"}`}
      >
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer select-none border-r ${
              isDark
                ? `border-[#3c3c3c] ${session.id === activeSessionId ? "bg-[#1e1e1e] text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`
                : `border-zinc-300 ${session.id === activeSessionId ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`
            }`}
            role="tab"
            aria-selected={session.id === activeSessionId}
          >
            <span>{session.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSession(session.id);
              }}
              className="ml-1 opacity-50 hover:opacity-100"
              aria-label={`Close ${session.title}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={newSession}
          className={`px-2 py-1 text-xs opacity-60 hover:opacity-100 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
          aria-label="New terminal"
          title="New terminal"
        >
          +
        </button>
      </div>

      {/* Terminal panes */}
      <div className="flex-1 overflow-hidden relative">
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs opacity-40">
            No terminal sessions
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="absolute inset-0"
              style={{ display: session.id === activeSessionId ? "block" : "none" }}
            >
              <TerminalPane
                session={session}
                isActive={session.id === activeSessionId}
                theme={theme}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
