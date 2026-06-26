"use client";

import { useCallback, useRef } from "react";

interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  invert?: boolean;
  className?: string;
}

export default function ResizeHandle({
  direction,
  value,
  onChange,
  min = 120,
  max = 800,
  invert = false,
  className = "",
}: ResizeHandleProps) {
  const dragRef = useRef<{ startPos: number; startValue: number } | null>(null);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const startPos = direction === "horizontal" ? event.clientX : event.clientY;
      dragRef.current = { startPos, startValue: value };

      const cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.cursor = cursor;
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return;
        const currentPos = direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - dragRef.current.startPos;
        const signedDelta = invert ? -delta : delta;
        const next = Math.min(max, Math.max(min, dragRef.current.startValue + signedDelta));
        onChange(next);
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [direction, invert, max, min, onChange, value]
  );

  const baseClass =
    direction === "horizontal"
      ? "w-1 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500/60"
      : "h-1 cursor-row-resize hover:bg-blue-500/40 active:bg-blue-500/60";

  return (
    <div
      role="separator"
      aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
      onMouseDown={handleMouseDown}
      className={`shrink-0 transition-colors ${baseClass} ${className}`}
    />
  );
}
