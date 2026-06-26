"use client";

import { useState } from "react";
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDir) {
      setExpanded((e) => !e);
    } else {
      console.log("File clicked:", node.id, node.name);
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
        className={`flex items-center gap-1 py-0.5 pr-2 cursor-pointer text-sm select-none group relative ${
          isActive
            ? isDark
              ? "bg-[#094771] text-white"
              : "bg-blue-100 text-blue-900"
            : isDark
              ? "hover:bg-[#2a2d2e] text-zinc-300"
              : "hover:bg-zinc-100 text-zinc-700"
        }`}
        onClick={handleClick}
        role={isDir ? "treeitem" : "option"}
        aria-expanded={isDir ? expanded : undefined}
        aria-selected={isActive}
      >
        {/* Icon */}
        <span className="shrink-0 text-xs w-4 text-center">
          {isDir ? (expanded ? "▾" : "▸") : "·"}
        </span>

        {/* Name / rename input */}
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
            className="flex-1 bg-transparent border border-blue-400 outline-none text-xs px-1"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-xs">{node.name}</span>
        )}

        {/* Context actions (shown on hover) */}
        {!renaming && (
          <div className="hidden group-hover:flex gap-1 ml-auto">
            {isDir && (
              <>
                <button
                  title="New file"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile(node.path);
                  }}
                  className="opacity-60 hover:opacity-100 text-xs px-0.5"
                  aria-label="New file"
                >
                  +f
                </button>
                <button
                  title="New folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(node.path);
                  }}
                  className="opacity-60 hover:opacity-100 text-xs px-0.5"
                  aria-label="New folder"
                >
                  +d
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
              className="opacity-60 hover:opacity-100 text-xs px-0.5"
              aria-label="Rename"
            >
              ✎
            </button>
            <button
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node);
              }}
              className="opacity-60 hover:opacity-100 text-xs px-0.5 text-red-400"
              aria-label="Delete"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Children */}
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
