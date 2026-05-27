"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRealTerminal } from "./useRealTerminal";

interface RealTerminalProps {
  theme?: "dark" | "light";
  projectId?: string;
}

export default function RealTerminal({ theme = "dark", projectId = "default" }: RealTerminalProps) {
  const isDark = theme === "dark";
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const {
    output,
    loading,
    error,
    currentDirectory,
    executeCommand,
    executePythonFile,
    executeNodeFile,
    listFiles,
    clearOutput
  } = useRealTerminal(projectId);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleExecute = async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    // Handle special commands locally
    if (trimmed === "clear") {
      clearOutput();
      setInput("");
      return;
    }

    // Execute command via API
    await executeCommand(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleExecute(input);
    } else if (e.key === "ArrowUp") {
      // Could implement command history here
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Could implement tab completion here
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1e1e1e] text-zinc-100" : "bg-white text-zinc-900"}`}>
      {/* Status bar */}
      <div className={`flex items-center justify-between px-3 py-1 text-xs ${isDark ? "bg-[#252526] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-300"}`}>
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span>Real Terminal</span>
          <span className="opacity-60">({projectId})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-60">📁 {currentDirectory}</span>
          {loading && <span className="animate-pulse">⏳</span>}
          {error && <span className="text-red-400">⚠</span>}
        </div>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm whitespace-pre-wrap"
        style={{ fontFamily: "monospace" }}
      >
        {output.map((line, index) => (
          <div key={index} className="mb-1">
            {line}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-blue-400">
            <span className="animate-spin">⏳</span>
            <span>Executing command...</span>
          </div>
        )}
        {error && (
          <div className="text-red-400">
            Error: {error}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className={`flex items-center p-3 border-t ${isDark ? "border-[#3c3c3c]" : "border-zinc-300"}`}>
        <span className="mr-2 text-green-400">$</span>
        <span className="mr-2 text-blue-400 opacity-80">{currentDirectory}</span>
        <span className="mr-2 text-green-400">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent border-none outline-none font-mono text-sm ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
          placeholder="Type a command..."
          spellCheck="false"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          disabled={loading}
        />
        {loading && (
          <span className="ml-2 text-blue-400 animate-spin">⏳</span>
        )}
      </div>

      {/* Help text */}
      <div className={`p-2 text-xs border-t ${isDark ? "border-[#3c3c3c] text-zinc-400" : "border-zinc-300 text-zinc-500"}`}>
        <div className="flex justify-between">
          <span>Real terminal connected to server. Commands execute on the server.</span>
          <span className="flex gap-2">
            <button
              onClick={() => handleExecute("help")}
              className="opacity-60 hover:opacity-100"
            >
              help
            </button>
            <button
              onClick={() => handleExecute("clear")}
              className="opacity-60 hover:opacity-100"
            >
              clear
            </button>
            <button
              onClick={() => handleExecute("ls")}
              className="opacity-60 hover:opacity-100"
            >
              ls
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}