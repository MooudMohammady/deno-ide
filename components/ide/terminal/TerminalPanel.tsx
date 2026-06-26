"use client";

import { useState } from "react";
import RealTerminal from "./RealTerminal";
import { useTerminal } from "./useTerminal";

interface TerminalPanelProps {
  theme?: "dark" | "light";
  projectId?: string;
  workingDirectory?: string;
}

export default function TerminalPanel({ theme = "dark", projectId = "default", workingDirectory }: TerminalPanelProps) {
  const isDark = theme === "dark";
  const { sessions, activeSessionId, activeSession, setActiveSessionId, newSession, closeSession } =
    useTerminal();
  const [clearVersion, setClearVersion] = useState(0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className={`flex items-center gap-2 shrink-0 border-b px-2 py-1 ${
          isDark ? "bg-[#252526] border-[#3c3c3c]" : "bg-zinc-100 border-zinc-300"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {sessions.map((session, index) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`flex items-center gap-2 rounded-t px-3 py-1 text-xs transition ${
                  isActive
                    ? isDark
                      ? "bg-[#1e1e1e] text-zinc-100"
                      : "bg-white text-zinc-900 shadow-sm"
                    : isDark
                      ? "text-zinc-400 hover:bg-[#2f2f2f] hover:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
                aria-label={`Activate ${session.title}`}
                aria-pressed={isActive}
              >
                <span className="whitespace-nowrap">{session.title || `Terminal ${index + 1}`}</span>
                <span
                  onClick={(event) => {
                    event.stopPropagation();
                    closeSession(session.id);
                  }}
                  className={`rounded px-1 text-[10px] leading-none opacity-70 hover:opacity-100 ${
                    isDark ? "hover:bg-[#3c3c3c]" : "hover:bg-zinc-300"
                  }`}
                  role="button"
                  aria-label={`Close ${session.title}`}
                  title="Close terminal"
                >
                  ×
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => newSession()}
            className={`rounded px-2 py-1 text-sm opacity-70 transition hover:opacity-100 ${
              isDark ? "text-zinc-200 hover:bg-[#3c3c3c]" : "text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-label="New terminal"
            title="New terminal"
          >
            +
          </button>
          <button
            onClick={() => setClearVersion((value) => value + 1)}
            className={`rounded px-2 py-1 text-sm opacity-70 transition hover:opacity-100 ${
              isDark ? "text-zinc-200 hover:bg-[#3c3c3c]" : "text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-label="Clear active terminal"
            title="Clear active terminal"
            disabled={!activeSession}
          >
            🗑
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeSession ? (
          <RealTerminal
            key={`${activeSession.id}-${clearVersion}-${workingDirectory ?? ""}`}
            theme={theme}
            projectId={projectId}
            session={activeSession}
            onClose={closeSession}
            workingDirectory={workingDirectory}
          />
        ) : null}
      </div>
    </div>
  );
}
