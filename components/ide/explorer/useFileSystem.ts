"use client";

import {
    buildFileMap,
    createNode,
    createSampleProject,
    insertNode,
    removeNode,
    renameNode,
} from "@/lib/fileSystem";
import { useCallback, useState } from "react";
import type { FileNode } from "../types";

/**
 * React hook for managing the in-memory file system state.
 * Requirements: 2.3, 2.4, 2.5
 */
export function useFileSystem() {
  const sample = createSampleProject();
  const [root, setRoot] = useState<FileNode | null>(sample.root);
  const [contents, setContents] = useState<Record<string, string>>(sample.contents);

  const fileMap = root ? buildFileMap(root) : {};

  const createFile = useCallback(
    (parentPath: string, name: string, type: "file" | "directory") => {
      const node = createNode(parentPath, name, type);
      setRoot((prev) => (prev ? insertNode(prev, parentPath, node) : prev));
      if (type === "file") {
        setContents((prev) => ({ ...prev, [node.id]: "" }));
      }
      return node;
    },
    []
  );

  const deleteFile = useCallback((node: FileNode) => {
    setRoot((prev) => (prev ? removeNode(prev, node.id) : prev));
    setContents((prev) => {
      const next = { ...prev };
      delete next[node.id];
      return next;
    });
  }, []);

  const renameFile = useCallback((node: FileNode, newName: string) => {
    setRoot((prev) => (prev ? renameNode(prev, node.id, newName) : prev));
  }, []);

  const updateContent = useCallback((fileId: string, content: string) => {
    setContents((prev) => ({ ...prev, [fileId]: content }));
  }, []);

  const getContent = useCallback(
    (fileId: string): string => contents[fileId] ?? "",
    [contents]
  );

  return {
    root,
    fileMap,
    contents,
    createFile,
    deleteFile,
    renameFile,
    updateContent,
    getContent,
  };
}
