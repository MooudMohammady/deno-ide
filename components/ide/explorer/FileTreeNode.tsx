"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { getFileIcon, getFolderIcon } from "@/lib/fileIcons";
import type { FileNode } from "../types";

interface FileTreeNodeProps {
  node: FileNode;
  depth?: number;
  activeFileId?: string | null;
  isDark?: boolean;
  onFileClick: (node: FileNode) => void;
  onRename: (node: FileNode, newName: string) => void;
  onDelete: (node: FileNode) => void;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
}

export default function FileTreeNode({
  node,
  depth = 0,
  activeFileId,
  isDark = true,
  onFileClick,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
}: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

  const isDir = node.type === "directory";
  const isActive = node.id === activeFileId;
  const FileIcon = isDir ? getFolderIcon(expanded) : getFileIcon(node.name);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDir) {
      setExpanded((prev) => !prev);
    } else {
      onFileClick(node);
    }
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.name) {
      onRename(node, trimmed);
    }
    setRenaming(false);
  };

  const indent = depth * 12;

  return (
    <div>
      <div
        style={{ paddingLeft: indent + 8 }}
        className={`group relative flex cursor-pointer select-none items-center gap-1 py-0.5 pr-2 text-sm ${
          isActive
            ? isDark
              ? "bg-[#094771] text-white"
              : "bg-blue-100 text-blue-900"
            : isDark
              ? "text-zinc-300 hover:bg-[#2a2d2e]"
              : "text-zinc-700 hover:bg-zinc-100"
        }`}
        onClick={handleClick}
        role={isDir ? "treeitem" : "option"}
        aria-expanded={isDir ? expanded : undefined}
        aria-selected={isActive}
      >
        <span className="flex w-3 shrink-0 items-center justify-center">
          {isDir ? (
            expanded ? (
              <ChevronDown className="h-3 w-3 opacity-60" />
            ) : (
              <ChevronRight className="h-3 w-3 opacity-60" />
            )
          ) : null}
        </span>

        <FileIcon
          className={`h-4 w-4 shrink-0 ${
            isDir
              ? isDark
                ? "text-blue-400"
                : "text-blue-600"
              : isDark
                ? "text-zinc-400"
                : "text-zinc-500"
          }`}
        />

        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="flex-1 border border-blue-400 bg-transparent px-1 text-xs outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-xs">{node.name}</span>
        )}

        {!renaming && (
          <div className="ml-auto hidden gap-0.5 group-hover:flex">
            {isDir && (
              <>
                <button
                  title="New file"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile(node.path);
                  }}
                  className="rounded p-0.5 opacity-60 hover:bg-white/10 hover:opacity-100"
                  aria-label="New file"
                >
                  <FilePlus className="h-3.5 w-3.5" />
                </button>
                <button
                  title="New folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(node.path);
                  }}
                  className="rounded p-0.5 opacity-60 hover:bg-white/10 hover:opacity-100"
                  aria-label="New folder"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button
              title="Rename"
              onClick={(e) => {
                e.stopPropagation();
                setRenameValue(node.name);
                setRenaming(true);
              }}
              className="rounded p-0.5 opacity-60 hover:bg-white/10 hover:opacity-100"
              aria-label="Rename"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node);
              }}
              className="rounded p-0.5 text-red-400 opacity-60 hover:bg-red-400/10 hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {isDir && expanded && node.children && (
        <div role="group">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              isDark={isDark}
              onFileClick={onFileClick}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
