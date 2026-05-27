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
    let mounted = true;

    (async () => {
      try {
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        const { WebLinksAddon } = await import("@xterm/addon-web-links");

        if (!mounted) return;

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
          fontFamily: "var(--font-roboto-mono), 'Courier New', monospace",
          fontSize: 13,
          cursorBlink: true,
          convertEol: true,
          allowTransparency: true,
        });

        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(new WebLinksAddon());

        if (containerRef.current && mounted) {
          terminal.open(containerRef.current);
          setTimeout(() => fitAddon.fit(), 10); // Small delay to ensure container is ready
        }

        // Write history
        if (session.history.length > 0) {
          const historyText = session.history.join("");
          terminal.write(historyText);
        } else {
          // Always show prompt if no history
          terminal.write(`\x1b[32m${session.currentDirectory}\x1b[0m $ `);
        }

        terminal.onData((data) => {
          terminal.write(data);
          onInput?.(session.id, data);
        });

        terminal.onKey((e) => {
          const ev = e.domEvent;
          const key = ev.key;
          
          // Handle control keys
          if (ev.ctrlKey && key === 'l') {
            // Ctrl+L to clear
            ev.preventDefault();
            terminal.clear();
            terminal.write(`\x1b[32m${session.currentDirectory}\x1b[0m $ `);
            return;
          }
          
          // Handle special keys that need custom handling
          if (key === 'Backspace') {
            ev.preventDefault();
            terminal.write('\b \b');
            onInput?.(session.id, '\b');
          } else if (key === 'Enter') {
            ev.preventDefault();
            terminal.write('\r\n');
            onInput?.(session.id, '\r\n'); // Send both carriage return and newline
          } else if (key === 'Delete') {
            ev.preventDefault();
            // Delete key - simpler handling
            terminal.write('\x1b[3~');
            onInput?.(session.id, '\x1b[3~');
          } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            // Prevent default for arrow keys to avoid scrolling
            ev.preventDefault();
            // You could implement command history navigation here
          } else if (key.length === 1) {
            // Regular character - let onData handle it
            // Don't prevent default to allow normal typing
          }
        });

        termRef.current = terminal;
        fitRef.current = fitAddon;
      } catch (error) {
        console.error("Failed to load xterm.js:", error);
      }
    })();

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => fitRef.current?.fit(), 10);
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      mounted = false;
      resizeObserver.disconnect();
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, theme]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ display: isActive ? "block" : "none" }}
      aria-label={`Terminal: ${session.title}`}
    />
  );
}
