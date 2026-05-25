"use client";

import { useState } from "react";
import type { FileNode } from "../types";
import FileTreeNode from "./FileTreeNode";

export interface FileExplorerProps {
  root: FileNode | null;
  activeFileId?: string | null;
  theme?: "dark" | "light";
  onFileOpen: (node: FileNode) => void;
  onFileCreate: (parentPath: string, name: string, type: "file" | "directory") => void;
  onFileDelete: (node: FileNode) => void;
  onFileRename: (node: FileNode, newName: string) => void;
}

export default function FileExplorer({
  root,
  activeFileId,
  theme = "dark",
  onFileOpen,
  onFileCreate,
  onFileDelete,
  onFileRename,
}: FileExplorerProps) {
  const isDark = theme === "dark";
  const [pendingCreate, setPendingCreate] = useState<{
    parentPath: string;
    type: "file" | "directory";
  } | null>(null);
  const [newName, setNewName] = useState("");

  const handleCreateFile = (parentPath: string) => {
    setPendingCreate({ parentPath, type: "file" });
    setNewName("");
  };

  const handleCreateFolder = (parentPath: string) => {
    setPendingCreate({ parentPath, type: "directory" });
    setNewName("");
  };

  const submitCreate = () => {
    const trimmed = newName.trim();
    if (trimmed && pendingCreate) {
      onFileCreate(pendingCreate.parentPath, trimmed, pendingCreate.type);
    }
    setPendingCreate(null);
    setNewName("");
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      role="tree"
      aria-label="File explorer"
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 shrink-0 ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}
      >
        <span className="text-xs font-semibold uppercase tracking-widest opacity-60">
          Explorer
        </span>
        {root && (
          <div className="flex gap-1">
            <button
              onClick={() => handleCreateFile(root.path)}
              className="opacity-60 hover:opacity-100 text-xs"
              aria-label="New file"
              title="New file"
            >
              +f
            </button>
            <button
              onClick={() => handleCreateFolder(root.path)}
              className="opacity-60 hover:opacity-100 text-xs"
              aria-label="New folder"
              title="New folder"
            >
              +d
            </button>
          </div>
        )}
      </div>

      {/* Inline create input */}
      {pendingCreate && (
        <div className="px-3 py-1">
          <input
            autoFocus
            placeholder={pendingCreate.type === "file" ? "filename.ts" : "folder name"}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={submitCreate}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCreate();
              if (e.key === "Escape") setPendingCreate(null);
            }}
            className={`w-full text-xs px-2 py-0.5 border outline-none ${
              isDark
                ? "bg-[#3c3c3c] border-blue-400 text-zinc-100"
                : "bg-white border-blue-400 text-zinc-900"
            }`}
          />
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        {root ? (
          <FileTreeNode
            node={root}
            depth={0}
            activeFileId={activeFileId}
            isDark={isDark}
            onFileClick={onFileOpen}
            onRename={onFileRename}
            onDelete={onFileDelete}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
          />
        ) : (
          <div className="px-3 py-2 text-xs opacity-40 italic">
            No folder open
          </div>
        )}
      </div>
    </div>
  );
}
