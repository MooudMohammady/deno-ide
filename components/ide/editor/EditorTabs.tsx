"use client";

import { Circle, X } from "lucide-react";
import type { FileNode } from "../types";

interface EditorTabsProps {
  openFiles: string[];
  activeFileId: string | null;
  fileMap: Record<string, FileNode>;
  isDirty?: Record<string, boolean>;
  theme?: "dark" | "light";
  onSelect: (fileId: string) => void;
  onClose: (fileId: string) => void;
}

export default function EditorTabs({
  openFiles,
  activeFileId,
  fileMap,
  isDirty = {},
  theme = "dark",
  onSelect,
  onClose,
}: EditorTabsProps) {
  const isDark = theme === "dark";

  if (openFiles.length === 0) return null;

  return (
    <div
      className={`flex overflow-x-auto shrink-0 ${isDark ? "bg-[#252526] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-300"}`}
      role="tablist"
      aria-label="Open files"
    >
      {openFiles.map((fileId) => {
        const file = fileMap[fileId];
        const isActive = fileId === activeFileId;
        const dirty = isDirty[fileId] ?? false;

        return (
          <div
            key={fileId}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(fileId)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer shrink-0 select-none border-r ${
              isDark
                ? `border-[#3c3c3c] ${isActive ? "bg-[#1e1e1e] text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`
                : `border-zinc-300 ${isActive ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`
            }`}
          >
            <span>{file?.name ?? fileId}</span>
            {dirty && <Circle className="h-2 w-2 fill-yellow-400 text-yellow-400" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(fileId);
              }}
              className="ml-1 opacity-50 transition-opacity hover:opacity-100"
              aria-label={`Close ${file?.name ?? fileId}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
