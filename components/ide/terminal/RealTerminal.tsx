"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import type { TerminalSession } from "../types";
import { useRealTerminal } from "./useRealTerminal";

interface RealTerminalProps {
  theme?: "dark" | "light";
  projectId?: string;
  session: TerminalSession;
  onClose?: (sessionId: string) => void;
  clearSignal?: number;
  workingDirectory?: string;
}

export default function RealTerminal({
  theme = "dark",
  projectId = "default",
  session,
  onClose,
  clearSignal,
  workingDirectory,
}: RealTerminalProps) {
  const isDark = theme === "dark";
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const historyCursorRef = useRef<number>(-1);

  const {
    output,
    loading,
    error,
    currentDirectory,
    commandHistory,
    executeCommand,
    clearOutput,
    setHistoryIndex,
  } = useRealTerminal({ session, projectId, clearSignal, workingDirectory });

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [session.id]);

  const handleExecute = async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    if (trimmed === "clear") {
      clearOutput();
      setInput("");
      return;
    }

    if (trimmed === "exit") {
      onClose?.(session.id);
      return;
    }

    await executeCommand(trimmed);
    setInput("");
    setHistoryIndex(-1);
    historyCursorRef.current = -1;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleExecute(input);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      historyCursorRef.current =
        historyCursorRef.current < 0
          ? commandHistory.length - 1
          : Math.max(0, historyCursorRef.current - 1);
      setInput(commandHistory[historyCursorRef.current] ?? "");
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyCursorRef.current < 0) return;

      historyCursorRef.current = Math.min(
        commandHistory.length - 1,
        historyCursorRef.current + 1
      );

      if (historyCursorRef.current >= commandHistory.length - 1) {
        historyCursorRef.current = -1;
        setInput("");
        return;
      }

      setInput(commandHistory[historyCursorRef.current] ?? "");
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  const cwd = workingDirectory || currentDirectory;

  return (
    <div className={`flex h-full flex-col ${isDark ? "bg-[#1e1e1e] text-zinc-100" : "bg-white text-zinc-900"}`}>
      <div
        className={`flex items-center justify-between px-3 py-1 text-xs ${
          isDark ? "bg-[#252526] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span>Real Terminal</span>
          <span className="opacity-60">({session.title})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-60">📁 {cwd}</span>
          {loading && <span className="animate-pulse">⏳</span>}
          {error && <span className="text-red-400">⚠</span>}
        </div>
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm whitespace-pre-wrap"
        style={{ fontFamily: "monospace" }}
      >
        {output.map((line, index) => (
          <div key={`${session.id}-${index}`} className="mb-1">
            {line}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-blue-400">
            <span className="animate-spin">⏳</span>
            <span>Executing command...</span>
          </div>
        )}
        {error && <div className="text-red-400">Error: {error}</div>}
      </div>

      <div className={`flex items-center p-3 border-t ${isDark ? "border-[#3c3c3c]" : "border-zinc-300"}`}>
        <span className="mr-2 text-green-400">$</span>
        <span className="mr-2 text-blue-400 opacity-80">{cwd}</span>
        <span className="mr-2 text-green-400">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistoryIndex(-1);
            historyCursorRef.current = -1;
          }}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent border-none outline-none font-mono text-sm ${
            isDark ? "text-zinc-100" : "text-zinc-900"
          }`}
          placeholder="Type a command..."
          spellCheck="false"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          disabled={loading}
        />
        {loading && <span className="ml-2 animate-spin text-blue-400">⏳</span>}
      </div>

      <div
        className={`border-t p-2 text-xs ${
          isDark ? "border-[#3c3c3c] text-zinc-400" : "border-zinc-300 text-zinc-500"
        }`}
      >
        <div className="flex justify-between gap-3">
          <span>Real terminal connected to server. Commands execute on the server.</span>
          <span className="flex gap-2">
            <button onClick={() => handleExecute("help")} className="opacity-60 hover:opacity-100">
              help
            </button>
            <button onClick={() => handleExecute("clear")} className="opacity-60 hover:opacity-100">
              clear
            </button>
            <button onClick={() => handleExecute("ls")} className="opacity-60 hover:opacity-100">
              ls
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
