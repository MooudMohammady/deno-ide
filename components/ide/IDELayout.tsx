"use client";

import { debounce } from "@/lib/debounce";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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
import SettingsPanel from "./settings/SettingsPanel";
import { useIDESettings } from "./settings/useIDESettings";
import TerminalPanel from "./terminal/TerminalPanel";
import type { FileNode } from "./types";

const CodeEditor = dynamic(() => import("./editor/CodeEditor"), { ssr: false });

interface IDELayoutProps {
  initialSettings?: Partial<import("./types").IDESettings>;
}

export default function IDELayout({ initialSettings: _initialSettings }: IDELayoutProps) {
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

  const { root, fileMap, getContent, updateContent, createFile, deleteFile, renameFile } =
    useFileSystem();

  const { state: editorState, openFile, closeFile, updateEditorState } = useEditorState();

  const [dirtyFiles, setDirtyFiles] = useState<Record<string, boolean>>({});

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

  const handleFileOpen = (node: FileNode) => {
    if (node.type === "file") openFile(node.id);
  };

  const handleEditorChange = (value: string) => {
    if (editorState.activeFileId) {
      updateContent(editorState.activeFileId, value);
      setDirtyFiles((prev) => ({ ...prev, [editorState.activeFileId!]: true }));
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

  const activeFile = editorState.activeFileId ? fileMap[editorState.activeFileId] : null;
  const activeContent = editorState.activeFileId ? getContent(editorState.activeFileId) : "";
  const activeLanguage = activeFile ? detectLanguage(activeFile.name) : "plaintext";

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isDark ? "bg-[#1e1e1e] text-zinc-100" : "bg-white text-zinc-900"}`}>
      <div className={`flex items-center justify-between px-4 h-9 shrink-0 text-xs select-none ${isDark ? "bg-[#323233] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-300"}`}>
        <span className="font-semibold tracking-wide">Web IDE</span>
        <div className="flex gap-3">
          <button onClick={toggleSidebar} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Toggle sidebar">☰</button>
          <button onClick={toggleTerminal} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Toggle terminal">⌨</button>
          <button onClick={toggleDebugPanel} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Toggle debug panel">🐛</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {layout.showSidebar && (
          <aside style={{ width: layout.sidebarWidth }} className={`shrink-0 flex flex-col overflow-hidden ${isDark ? "bg-[#252526] border-r border-[#3c3c3c]" : "bg-zinc-50 border-r border-zinc-200"}`}>
            {/* Sidebar view tabs */}
            <div className={`flex shrink-0 text-xs ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}>
              <button
                onClick={() => setSidebarView("explorer")}
                className={`px-3 py-1.5 ${sidebarView === "explorer" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                aria-label="Explorer"
              >
                📁
              </button>
              <button
                onClick={() => setSidebarView("extensions")}
                className={`px-3 py-1.5 ${sidebarView === "extensions" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                aria-label="Extensions"
              >
                🧩
              </button>
              <button
                onClick={() => setSidebarView("settings")}
                className={`px-3 py-1.5 ${sidebarView === "settings" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                aria-label="Settings"
              >
                ⚙
              </button>
              <button
                onClick={() => setSidebarView("git")}
                className={`px-3 py-1.5 ${sidebarView === "git" ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
                aria-label="Git"
              >
                ⎇
              </button>
            </div>
            {sidebarView === "explorer" ? (
              <FileExplorer
                root={root}
                activeFileId={editorState.activeFileId}
                theme={theme}
                onFileOpen={handleFileOpen}
                onFileCreate={(parentPath, name, type) => createFile(parentPath, name, type)}
                onFileDelete={deleteFile}
                onFileRename={renameFile}
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
            <div style={{ height: layout.terminalHeight }} className={`shrink-0 overflow-hidden flex flex-col ${isDark ? "bg-[#1e1e1e] border-t border-[#3c3c3c]" : "bg-zinc-50 border-t border-zinc-200"}`} aria-label="Terminal">
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
                  <TerminalPanel theme={theme} />
                ) : (
                  <ProblemsPanel
                    diagnostics={lintDiagnostics}
                    fileMap={fileMap}
                    theme={theme}
                  />
                )}
              </div>
            </div>
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
          <span className={`${debugSession.status !== "inactive" ? "" : "ml-auto"} flex gap-2`}>
            {totalErrors > 0 && <span className="text-red-300">✕ {totalErrors}</span>}
            {totalWarnings > 0 && <span className="text-yellow-300">⚠ {totalWarnings}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
