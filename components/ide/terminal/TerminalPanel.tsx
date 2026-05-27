"use client";

import { useState } from "react";
import RealTerminal from "./RealTerminal";
import SimpleTerminal from "./SimpleTerminal";

interface TerminalPanelProps {
  theme?: "dark" | "light";
  projectId?: string;
}

/**
 * Terminal panel with real server-side execution.
 * Requirements: 3.1, 3.3, 3.5
 */
export default function TerminalPanel({ theme = "dark", projectId = "default" }: TerminalPanelProps) {
  const isDark = theme === "dark";
  const [terminalType, setTerminalType] = useState<"simple" | "real">("real");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div
        className={`flex items-center shrink-0 ${isDark ? "bg-[#252526] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-300"}`}
      >
        <div className="flex items-center">
          <div
            className={`flex items-center gap-1 px-3 py-1 text-xs select-none border-r ${
              isDark
                ? "border-[#3c3c3c] bg-[#1e1e1e] text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
            role="tab"
            aria-selected={true}
          >
            <span>Terminal</span>
            <span className="text-xs opacity-60">
              {terminalType === "real" ? "(Real)" : "(Simple)"}
            </span>
          </div>
          
          {/* Terminal type switcher */}
          <div className="flex text-xs ml-2">
            <button
              onClick={() => setTerminalType("real")}
              className={`px-2 py-1 ${terminalType === "real" ? (isDark ? "bg-[#3c3c3c] text-green-400" : "bg-zinc-200 text-green-600") : "opacity-50 hover:opacity-80"}`}
              aria-label="Real terminal"
              title="Real terminal (server-side execution)"
            >
              Real
            </button>
            <button
              onClick={() => setTerminalType("simple")}
              className={`px-2 py-1 ${terminalType === "simple" ? (isDark ? "bg-[#3c3c3c] text-blue-400" : "bg-zinc-200 text-blue-600") : "opacity-50 hover:opacity-80"}`}
              aria-label="Simple terminal"
              title="Simple terminal (client-side simulation)"
            >
              Simple
            </button>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => {
              // Could add new terminal functionality here
              console.log("New terminal requested");
            }}
            className={`px-2 py-1 text-xs opacity-60 hover:opacity-100 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
            aria-label="New terminal"
            title="New terminal"
          >
            +
          </button>
          <button
            onClick={() => {
              // Clear terminal
              console.log("Clear terminal");
            }}
            className={`px-2 py-1 text-xs opacity-60 hover:opacity-100 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
            aria-label="Clear terminal"
            title="Clear terminal"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-hidden">
        {terminalType === "real" ? (
          <RealTerminal
            theme={theme}
            projectId={projectId}
          />
        ) : (
          <SimpleTerminal
            theme={theme}
          />
        )}
      </div>
      
      {/* Info bar */}
      <div className={`p-1 text-xs text-center ${isDark ? "bg-[#252526] text-zinc-400 border-t border-[#3c3c3c]" : "bg-zinc-100 text-zinc-500 border-t border-zinc-300"}`}>
        {terminalType === "real" ? (
          <span>✅ Real terminal: Commands execute on server using Node.js child_process</span>
        ) : (
          <span>ℹ️ Simple terminal: Client-side simulation only</span>
        )}
      </div>
    </div>
  );
}
