"use client";

import { useEffect, useRef } from "react";
import type { TerminalSession } from "../types";

interface TerminalPaneProps {
  session: TerminalSession;
  isActive: boolean;
  theme?: "dark" | "light";
  onInput?: (sessionId: string, data: string) => void;
}

/**
 * Renders a single xterm.js terminal instance.
 * Requirements: 3.1
 */
export default function TerminalPane({
  session,
  isActive,
  theme = "dark",
  onInput,
}: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let terminal: import("@xterm/xterm").Terminal;
    let fitAddon: import("@xterm/addon-fit").FitAddon;

    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      terminal = new Terminal({
        theme:
          theme === "dark"
            ? {
                background: "#1e1e1e",
                foreground: "#cccccc",
                cursor: "#aeafad",
              }
            : {
                background: "#ffffff",
                foreground: "#333333",
                cursor: "#333333",
              },
        fontFamily: "var(--font-geist-mono), 'Courier New', monospace",
        fontSize: 13,
        cursorBlink: true,
        convertEol: true,
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());

      if (containerRef.current) {
        terminal.open(containerRef.current);
        fitAddon.fit();
      }

      // Write history
      if (session.history.length > 0) {
        terminal.write(session.history.join("\r\n") + "\r\n");
      }

      terminal.write(`\x1b[32m${session.currentDirectory}\x1b[0m $ `);

      terminal.onData((data) => {
        onInput?.(session.id, data);
      });

      termRef.current = terminal;
      fitRef.current = fitAddon;
    })();

    const resizeObserver = new ResizeObserver(() => {
      fitRef.current?.fit();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ display: isActive ? "block" : "none" }}
      aria-label={`Terminal: ${session.title}`}
    />
  );
}
