"use client";

import { debounce } from "@/lib/debounce";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  AlertTriangle,
  FolderTree,
  GitBranch,
  Puzzle,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import ResizeHandle from "@/components/ui/ResizeHandle";
import ProblemsPanel from "./analysis/ProblemsPanel";
import { useLinting } from "./analysis/useLinting";
import DebugPanel from "./debugger/DebugPanel";
import { useDebugger } from "./debugger/useDebugger";
import EditorTabs from "./editor/EditorTabs";
import { detectLanguage } from "./editor/languageDetector";
import { useEditorState } from "./editor/useEditorState";
import FileExplorer from "./explorer/FileExplorer";
import { useFileSystem } from "./explorer/useFileSystem";
import ExtensionMarketplace from "./extensions/ExtensionMarketplace";
import { useExtensions } from "./extensions/useExtensions";
import GitPanel from "./git/GitPanel";
import { useGit } from "./git/useGit";
import MenuBar from "./MenuBar";
import SettingsPanel from "./settings/SettingsPanel";
import { useIDESettings } from "./settings/useIDESettings";
import TerminalPanel from "./terminal/TerminalPanel";
import type { FileNode } from "./types";

const CodeEditor = dynamic(() => import("./editor/CodeEditor"), { ssr: false });

type LocalHandleMap = Record<string, FileSystemFileHandle>;
type LocalDirectoryHandleMap = Record<string, FileSystemDirectoryHandle>;
type LocalWorkspace = {
  root: FileNode;
  fileMap: Record<string, FileNode>;
  handleMap: LocalHandleMap;
  dirHandleMap: LocalDirectoryHandleMap;
};

async function readFileAsText(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function buildLocalWorkspace(
  handle: FileSystemDirectoryHandle,
  parentPath = ""
): Promise<LocalWorkspace> {
  const rootPath = parentPath ? `${parentPath}/${handle.name}` : handle.name;
  const root: FileNode = {
    id: `local-${rootPath.replace(/\//g, "-")}`,
    name: handle.name,
    path: rootPath,
    type: "directory",
    children: [],
  };

  const fileMap: Record<string, FileNode> = { [root.id]: root };
  const handleMap: LocalHandleMap = {};
  const dirHandleMap: LocalDirectoryHandleMap = { [root.id]: handle };

  const walk = async (dirHandle: FileSystemDirectoryHandle, dirNode: FileNode, basePath: string) => {
    for await (const [entryName, entryHandle] of dirHandle.entries()) {
      const entryPath = basePath ? `${basePath}/${entryName}` : entryName;
      if (entryHandle.kind === "directory") {
        const childDir: FileNode = {
          id: `local-${entryPath.replace(/\//g, "-")}`,
          name: entryName,
          path: entryPath,
          type: "directory",
          children: [],
        };
        dirNode.children = dirNode.children ?? [];
        dirNode.children.push(childDir);
        fileMap[childDir.id] = childDir;
        dirHandleMap[childDir.id] = entryHandle;
        await walk(entryHandle, childDir, entryPath);
      } else {
        const fileNode: FileNode = {
          id: `local-${entryPath.replace(/\//g, "-")}`,
          name: entryName,
          path: entryPath,
          type: "file",
        };
        dirNode.children = dirNode.children ?? [];
        dirNode.children.push(fileNode);
        fileMap[fileNode.id] = fileNode;
        handleMap[fileNode.id] = entryHandle;
      }
    }
  };

  await walk(handle, root, handle.name);
  return { root, fileMap, handleMap, dirHandleMap };
}

async function importWorkspaceToServer(
  files: Array<{ path: string; content: string }>,
  projectId = "default",
  rootDirectory?: string
) {
  if (rootDirectory) {
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createDirectory", projectId, path: rootDirectory }),
    });
  }

  if (files.length === 0) return;

  const response = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "importFiles", projectId, files }),
  });

  if (!response.ok) {
    throw new Error("Failed to sync opened folder to server");
  }
}

async function syncLocalWorkspaceToServer(workspace: LocalWorkspace, projectId = "default") {
  const files: Array<{ path: string; content: string }> = [];

  for (const [fileId, node] of Object.entries(workspace.fileMap)) {
    if (node.type !== "file") continue;
    const handle = workspace.handleMap[fileId];
    if (!handle) continue;
    const file = await handle.getFile();
    const content = await file.text();
    files.push({ path: node.path, content });
  }

  await importWorkspaceToServer(files, projectId, workspace.root.path);
}

function normalizeTerminalDirectory(rootPath?: string | null) {
  if (!rootPath || rootPath === "/" || rootPath === "") {
    return ".";
  }
  return rootPath.replace(/\\/g, "/").replace(/^\//, "");
}

function normalizeProjectPath(parentPath: string, name: string) {
  return `${parentPath}/${name}`.replace(/\/+/g, "/").replace(/^\/+/, "");
}

interface IDELayoutProps {
  initialSettings?: Partial<import("./types").IDESettings>;
}

export default function IDELayout({}: IDELayoutProps) {
  const {
    settings: ideSettings,
    setTheme,
    setFontSize,
    setTabSize,
    setWordWrap,
    setMinimap,
    updateLayout,
    resetSettings,
  } = useIDESettings();

  const { layout, theme } = ideSettings;
  const isDark = theme === "dark";

  // Use real file system with server-side API
  const { root, fileMap, getContent, updateContent, createFile, deleteFile, renameFile } =
    useFileSystem();

  const { state: editorState, openFile, closeFile, updateEditorState } = useEditorState();

  const [dirtyFiles, setDirtyFiles] = useState<Record<string, boolean>>({});
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [localWorkspace, setLocalWorkspace] = useState<LocalWorkspace | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Extensions
  const { extensions, install, uninstall, toggle: toggleExt } = useExtensions();
  const [sidebarView, setSidebarView] = useState<"explorer" | "extensions" | "settings" | "git">("explorer");

  // Git
  const { status: gitStatus, currentBranch, branches, stageFile, unstageFile, commit, createBranch, checkout } = useGit();

  // Linting
  const { lintFile, diagnostics: lintDiagnostics, totalErrors, totalWarnings } = useLinting();
  const [bottomTab, setBottomTab] = useState<"terminal" | "problems">("terminal");

  // Debounced lint — avoids running on every keystroke
  const debouncedLint = useRef(debounce(lintFile, 500)).current;

  const {
    session: debugSession,
    startSession,
    stopSession,
    continueSession,
    stepOver,
    stepInto,
    stepOut,
    toggleBreakpoint,
  } = useDebugger();

  const displayRoot = localWorkspace?.root ?? root;
  const displayFileMap = localWorkspace?.fileMap ?? fileMap;

  const handleFileOpen = async (node: FileNode) => {
    if (node.type === "file") {
      console.log("Opening file:", node.id, node.name);
      openFile(node.id);
      
      if (localWorkspace?.handleMap[node.id]) {
        const file = await localWorkspace.handleMap[node.id].getFile();
        const content = await file.text();
        setFileContents((prev) => ({ ...prev, [node.id]: content }));
        return;
      }

      if (!fileContents[node.id]) {
        getContent(node.id)
          .then((content) => {
            setFileContents((prev) => ({ ...prev, [node.id]: content }));
          })
          .catch((error) => {
            console.error("Error loading file content:", error);
            setFileContents((prev) => ({ ...prev, [node.id]: "" }));
          });
      }
    }
  };

  const handleEditorChange = (value: string) => {
    if (editorState.activeFileId) {
      if (!localWorkspace?.fileMap[editorState.activeFileId]) {
        updateContent(editorState.activeFileId, value);
      }
      setDirtyFiles((prev) => ({ ...prev, [editorState.activeFileId!]: true }));
      setFileContents((prev) => ({ ...prev, [editorState.activeFileId!]: value }));
      // Debounced lint on change
      debouncedLint(editorState.activeFileId, value, activeLanguage);
    }
  };

  const handleTabClose = (fileId: string) => {
    closeFile(fileId);
    setDirtyFiles((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  };

  const toggleSidebar = () => updateLayout({ showSidebar: !layout.showSidebar });
  const toggleTerminal = () => updateLayout({ showTerminal: !layout.showTerminal });
  const toggleDebugPanel = () => updateLayout({ showDebugPanel: !layout.showDebugPanel });

  const handleSidebarResize = useCallback(
    (width: number) => updateLayout({ sidebarWidth: width }),
    [updateLayout]
  );

  const handleTerminalResize = useCallback(
    (height: number) => updateLayout({ terminalHeight: height }),
    [updateLayout]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "`") {
          e.preventDefault();
          updateLayout({ showTerminal: !layout.showTerminal });
        }
        if (e.key === "b") {
          e.preventDefault();
          updateLayout({ showSidebar: !layout.showSidebar });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [layout.showTerminal, layout.showSidebar, updateLayout]);

  const activeFile = editorState.activeFileId ? displayFileMap[editorState.activeFileId] : null;
  const activeContent = editorState.activeFileId ? fileContents[editorState.activeFileId] || '' : '';
  const activeLanguage = activeFile ? detectLanguage(activeFile.name) : "plaintext";
  const terminalWorkingDirectory = normalizeTerminalDirectory(displayRoot?.path ?? root?.path);

  const handleOpenFile = () => fileInputRef.current?.click();
  const handleOpenFolder = async () => {
    if ("showDirectoryPicker" in window) {
      const dirHandle = await window.showDirectoryPicker();
      const workspace = await buildLocalWorkspace(dirHandle);
      setLocalWorkspace(workspace);
      setFileContents({});
      setDirtyFiles({});
      try {
        await syncLocalWorkspaceToServer(workspace);
      } catch (error) {
        console.error("Failed to sync folder for terminal:", error);
      }
      return;
    }
    folderInputRef.current?.click();
  };

  const handleSaveFile = async () => {
    const fileId = editorState.activeFileId;
    if (!fileId) return;

    const content = fileContents[fileId] ?? "";
    if (localWorkspace?.handleMap[fileId]) {
      const writable = await localWorkspace.handleMap[fileId].createWritable();
      await writable.write(content);
      await writable.close();
    } else {
      await updateContent(fileId, content);
    }

    setDirtyFiles((prev) => ({ ...prev, [fileId]: false }));
  };

  const handleSaveAll = async () => {
    const dirtyIds = Object.entries(dirtyFiles)
      .filter(([, dirty]) => dirty)
      .map(([fileId]) => fileId);

    for (const fileId of dirtyIds) {
      const content = fileContents[fileId] ?? "";
      if (localWorkspace?.handleMap[fileId]) {
        const writable = await localWorkspace.handleMap[fileId].createWritable();
        await writable.write(content);
        await writable.close();
      } else {
        await updateContent(fileId, content);
      }
    }

    setDirtyFiles({});
  };

  const createLocalEntry = async (parentPath: string, name: string, type: "file" | "directory") => {
    if (!localWorkspace) return;

    const parentDirId = Object.keys(localWorkspace.dirHandleMap).find((id) => {
      const node = localWorkspace.fileMap[id];
      return node?.path === parentPath;
    });
    if (!parentDirId) {
      throw new Error(`Parent folder not found: ${parentPath}`);
    }

    const parentHandle = localWorkspace.dirHandleMap[parentDirId];
    if (!parentHandle) {
      throw new Error(`No directory handle available for: ${parentPath}`);
    }

    if (type === "file") {
      const fileHandle = await parentHandle.getFileHandle(name, { create: true });
      const fileId = `local-${normalizeProjectPath(parentPath, name).replace(/\//g, "-")}`;
      const fileNode: FileNode = {
        id: fileId,
        name,
        path: normalizeProjectPath(parentPath, name),
        type: "file",
      };

      const fileMap = { ...localWorkspace.fileMap, [fileId]: fileNode };
      const handleMap = { ...localWorkspace.handleMap, [fileId]: fileHandle };
      const root = structuredClone(localWorkspace.root);
      const insertIntoTree = (node: FileNode): boolean => {
        if (node.path === parentPath && node.type === "directory") {
          node.children = node.children ?? [];
          node.children.push(fileNode);
          return true;
        }
        return node.children?.some(insertIntoTree) ?? false;
      };
      insertIntoTree(root);
      setLocalWorkspace({ ...localWorkspace, root, fileMap, handleMap });
      setFileContents((prev) => ({ ...prev, [fileId]: "" }));
      return fileNode;
    }

    const dirHandle = await parentHandle.getDirectoryHandle(name, { create: true });
    const dirId = `local-${normalizeProjectPath(parentPath, name).replace(/\//g, "-")}`;
    const dirNode: FileNode = {
      id: dirId,
      name,
      path: normalizeProjectPath(parentPath, name),
      type: "directory",
      children: [],
    };

    const fileMap = { ...localWorkspace.fileMap, [dirId]: dirNode };
    const dirHandleMap = { ...localWorkspace.dirHandleMap, [dirId]: dirHandle };
    const root = structuredClone(localWorkspace.root);
    const insertIntoTree = (node: FileNode): boolean => {
      if (node.path === parentPath && node.type === "directory") {
        node.children = node.children ?? [];
        node.children.push(dirNode);
        return true;
      }
      return node.children?.some(insertIntoTree) ?? false;
    };
    insertIntoTree(root);
    setLocalWorkspace({ ...localWorkspace, root, fileMap, dirHandleMap });
    return dirNode;
  };

  const handleOpenFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const content = await readFileAsText(file);
    const node: FileNode = {
      id: `local-${file.name.replace(/\//g, "-")}`,
      name: file.name,
      path: file.name,
      type: "file",
    };
    setLocalWorkspace({
      root: {
        id: "local-root",
        name: file.name,
        path: file.name,
        type: "directory",
        children: [node],
      },
      fileMap: { [node.id]: node, "local-root": {
        id: "local-root",
        name: file.name,
        path: file.name,
        type: "directory",
        children: [node],
      } },
      handleMap: {},
      dirHandleMap: {},
    });
    setFileContents((prev) => ({ ...prev, [node.id]: content }));
    openFile(node.id);
  };

  const handleOpenFolderChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;
    const folderName = files[0].webkitRelativePath.split("/")[0] || files[0].name || "Folder";
    const treeRoot: FileNode = {
      id: `local-${folderName.replace(/\s+/g, "-")}`,
      name: folderName,
      path: folderName,
      type: "directory",
      children: [],
    };
    const fileMapOverride: Record<string, FileNode> = { [treeRoot.id]: treeRoot };
    const importFiles: Array<{ path: string; content: string }> = [];
    for (const file of files) {
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split("/").filter(Boolean);
      const fileName = parts.pop() ?? file.name;
      let current = treeRoot;
      let currentPath = folderName;
      for (const part of parts) {
        currentPath = `${currentPath}/${part}`;
        let existing = current.children?.find((child) => child.name === part && child.type === "directory");
        if (!existing) {
          existing = {
            id: `local-${currentPath.replace(/\//g, "-")}`,
            name: part,
            path: currentPath,
            type: "directory",
            children: [],
          };
          current.children = current.children ?? [];
          current.children.push(existing);
          fileMapOverride[existing.id] = existing;
        }
        current = existing;
      }
      const fileNode: FileNode = {
        id: `local-${relativePath.replace(/\//g, "-")}`,
        name: fileName,
        path: relativePath,
        type: "file",
      };
      current.children = current.children ?? [];
      current.children.push(fileNode);
      fileMapOverride[fileNode.id] = fileNode;
      const content = await readFileAsText(file);
      importFiles.push({ path: relativePath, content });
      setFileContents((prev) => ({ ...prev, [fileNode.id]: content }));
    }

    setLocalWorkspace({ root: treeRoot, fileMap: fileMapOverride, handleMap: {}, dirHandleMap: {} });
    try {
      await importWorkspaceToServer(importFiles, "default", folderName);
    } catch (error) {
      console.error("Failed to sync folder for terminal:", error);
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isDark ? "bg-[#1e1e1e] text-zinc-100" : "bg-white text-zinc-900"}`}>
      <MenuBar
        theme={theme}
        onToggleSidebar={toggleSidebar}
        onToggleTerminal={toggleTerminal}
        onToggleDebugPanel={toggleDebugPanel}
        onNewFile={() => {
          if (root) {
            createFile(root.path, "newfile.ts", "file").then(file => {
              if (file) {
                openFile(file.id);
              }
            });
          }
        }}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onSaveFile={handleSaveFile}
        onSaveAll={handleSaveAll}
        onCloseFile={() => {
          if (editorState.activeFileId) {
            closeFile(editorState.activeFileId);
          }
        }}
        onCloseAll={() => {
          editorState.openFiles.forEach((fileId) => closeFile(fileId));
        }}
        onUndo={() => console.log("Undo")}
        onRedo={() => console.log("Redo")}
        onCut={() => console.log("Cut")}
        onCopy={() => console.log("Copy")}
        onPaste={() => console.log("Paste")}
        onFind={() => console.log("Find")}
        onReplace={() => console.log("Replace")}
        onRun={() => startSession()}
        onDebug={() => startSession()}
        onStop={() => stopSession()}
        onNewTerminal={() => {
          // This would be handled by TerminalPanel's newSession
          console.log("New terminal");
        }}
        onSplitTerminal={() => console.log("Split terminal")}
        onClearTerminal={() => console.log("Clear terminal")}
        onAbout={() => alert("Web IDE v0.1.0\nA web-based IDE built with Next.js")}
        onDocumentation={() => window.open("https://github.com/your-repo/web-ide", "_blank")}
      />

      <div className="flex flex-1 overflow-hidden">
        {layout.showSidebar && (
          <>
            <aside
              style={{ width: layout.sidebarWidth }}
              className={`flex shrink-0 flex-col overflow-hidden ${isDark ? "bg-[#252526] border-r border-[#3c3c3c]" : "bg-zinc-50 border-r border-zinc-200"}`}
            >
              <div className={`flex shrink-0 text-xs ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}>
                <button
                  onClick={() => setSidebarView("explorer")}
                  className={`px-3 py-1.5 ${sidebarView === "explorer" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                  aria-label="Explorer"
                >
                  <FolderTree className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSidebarView("extensions")}
                  className={`px-3 py-1.5 ${sidebarView === "extensions" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                  aria-label="Extensions"
                >
                  <Puzzle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSidebarView("settings")}
                  className={`px-3 py-1.5 ${sidebarView === "settings" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSidebarView("git")}
                  className={`px-3 py-1.5 ${sidebarView === "git" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                  aria-label="Git"
                >
                  <GitBranch className="h-4 w-4" />
                </button>
              </div>
            {sidebarView === "explorer" ? (
              <FileExplorer
                root={displayRoot}
                activeFileId={editorState.activeFileId}
                theme={theme}
                onFileOpen={handleFileOpen}
                onFileCreate={(parentPath, name, type) => {
                  if (localWorkspace) {
                    void createLocalEntry(parentPath, name, type);
                    return;
                  }
                  createFile(parentPath, name, type);
                }}
                onFileDelete={(node) => {
                  if (!localWorkspace) deleteFile(node);
                }}
                onFileRename={(node, newName) => {
                  if (!localWorkspace) renameFile(node, newName);
                }}
              />
            ) : sidebarView === "extensions" ? (
              <ExtensionMarketplace
                extensions={extensions}
                theme={theme}
                onInstall={install}
                onUninstall={uninstall}
                onToggle={toggleExt}
              />
            ) : sidebarView === "git" ? (
              <GitPanel
                status={gitStatus}
                currentBranch={currentBranch}
                branches={branches}
                theme={theme}
                onCommit={commit}
                onCreateBranch={createBranch}
                onCheckout={checkout}
                onStage={stageFile}
                onUnstage={unstageFile}
              />
            ) : (
              <SettingsPanel
                settings={ideSettings}
                theme={theme}
                onThemeChange={setTheme}
                onFontSizeChange={setFontSize}
                onTabSizeChange={setTabSize}
                onWordWrapChange={setWordWrap}
                onMinimapChange={setMinimap}
                onReset={resetSettings}
              />
            )}
            </aside>
            <ResizeHandle
              direction="horizontal"
              value={layout.sidebarWidth}
              onChange={handleSidebarResize}
              min={160}
              max={480}
              className={isDark ? "bg-[#3c3c3c]" : "bg-zinc-200"}
            />
          </>
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          <EditorTabs
            openFiles={editorState.openFiles}
            activeFileId={editorState.activeFileId}
            fileMap={fileMap}
            isDirty={dirtyFiles}
            theme={theme}
            onSelect={openFile}
            onClose={handleTabClose}
          />

          <main className={`flex-1 overflow-hidden ${isDark ? "bg-[#1e1e1e]" : "bg-white"}`} aria-label="Code editor">
            {editorState.activeFileId ? (
              <CodeEditor
                fileId={editorState.activeFileId}
                content={activeContent}
                language={activeLanguage}
                theme={theme}
                fontSize={ideSettings.fontSize}
                tabSize={ideSettings.tabSize}
                wordWrap={ideSettings.wordWrap}
                minimap={ideSettings.minimap}
                onChange={handleEditorChange}
                onStateChange={updateEditorState}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm opacity-40">Open a file to start editing</div>
            )}
          </main>

          {layout.showTerminal && (
            <>
              <ResizeHandle
                direction="vertical"
                value={layout.terminalHeight}
                onChange={handleTerminalResize}
                min={120}
                max={560}
                invert
                className={isDark ? "bg-[#3c3c3c]" : "bg-zinc-200"}
              />
              <div
                style={{ height: layout.terminalHeight }}
                className={`flex shrink-0 flex-col overflow-hidden ${isDark ? "bg-[#1e1e1e] border-t border-[#3c3c3c]" : "bg-zinc-50 border-t border-zinc-200"}`}
                aria-label="Terminal"
              >
              {/* Bottom panel tabs */}
              <div className={`flex shrink-0 text-xs ${isDark ? "border-b border-[#3c3c3c] bg-[#252526]" : "border-b border-zinc-200 bg-zinc-100"}`}>
                <button
                  onClick={() => setBottomTab("terminal")}
                  className={`px-3 py-1 ${bottomTab === "terminal" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                >
                  Terminal
                </button>
                <button
                  onClick={() => setBottomTab("problems")}
                  className={`px-3 py-1 flex items-center gap-1 ${bottomTab === "problems" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                >
                  Problems
                  {totalErrors > 0 && <span className="text-red-400 text-xs">{totalErrors}</span>}
                  {totalWarnings > 0 && <span className="text-yellow-400 text-xs">{totalWarnings}</span>}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {bottomTab === "terminal" ? (
                  <TerminalPanel theme={theme} projectId="default" workingDirectory={terminalWorkingDirectory} />
                ) : (
                  <ProblemsPanel
                    diagnostics={lintDiagnostics}
                    fileMap={displayFileMap}
                    theme={theme}
                  />
                )}
              </div>
            </div>
            </>
          )}
        </div>

        {layout.showDebugPanel && (
          <aside className={`w-64 shrink-0 flex flex-col overflow-hidden ${isDark ? "bg-[#252526] border-l border-[#3c3c3c]" : "bg-zinc-50 border-l border-zinc-200"}`} aria-label="Debug panel">
            <DebugPanel
              session={debugSession}
              theme={theme}
              onStart={startSession}
              onStop={stopSession}
              onContinue={continueSession}
              onStepOver={stepOver}
              onStepInto={stepInto}
              onStepOut={stepOut}
              onToggleBreakpoint={toggleBreakpoint}
            />
          </aside>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleOpenFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        multiple
        // @ts-expect-error webkitdirectory is non-standard but supported in Chromium-based browsers
        webkitdirectory="true"
        onChange={handleOpenFolderChange}
      />

      <div className={`flex items-center px-4 h-6 shrink-0 text-xs select-none gap-4 ${isDark ? "bg-[#007acc] text-white" : "bg-blue-600 text-white"}`} aria-label="Status bar">
        <span>Web IDE</span>
        {activeFile && <span>{activeLanguage}</span>}
        {editorState.activeFileId && (
          <span>Ln {editorState.cursorPosition.line}, Col {editorState.cursorPosition.column}</span>
        )}
        {debugSession.status !== "inactive" && (
          <span className="ml-auto capitalize text-yellow-200">Debug: {debugSession.status}</span>
        )}
        {(totalErrors > 0 || totalWarnings > 0) && (
          <span className={`${debugSession.status !== "inactive" ? "" : "ml-auto"} flex items-center gap-2`}>
            {totalErrors > 0 && (
              <span className="flex items-center gap-1 text-red-300">
                <AlertCircle className="h-3 w-3" />
                {totalErrors}
              </span>
            )}
            {totalWarnings > 0 && (
              <span className="flex items-center gap-1 text-yellow-300">
                <AlertTriangle className="h-3 w-3" />
                {totalWarnings}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
