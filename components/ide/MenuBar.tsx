"use client";

import { useState } from "react";
import { Bug, Menu, TerminalSquare } from "lucide-react";

interface MenuBarProps {
  theme?: "dark" | "light";
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onToggleDebugPanel: () => void;
  onNewFile?: () => void;
  onOpenFile?: () => void;
  onOpenFolder?: () => void;
  onSaveFile?: () => void;
  onSaveAll?: () => void;
  onCloseFile?: () => void;
  onCloseAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onRun?: () => void;
  onDebug?: () => void;
  onStop?: () => void;
  onNewTerminal?: () => void;
  onSplitTerminal?: () => void;
  onClearTerminal?: () => void;
  onAbout?: () => void;
  onDocumentation?: () => void;
}

interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: () => void;
  type?: "separator";
}

export default function MenuBar({
  theme = "dark",
  onToggleSidebar,
  onToggleTerminal,
  onToggleDebugPanel,
  onNewFile,
  onOpenFile,
  onOpenFolder,
  onSaveFile,
  onSaveAll,
  onCloseFile,
  onCloseAll,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onFind,
  onReplace,
  onRun,
  onDebug,
  onStop,
  onNewTerminal,
  onSplitTerminal,
  onClearTerminal,
  onAbout,
  onDocumentation,
}: MenuBarProps) {
  const isDark = theme === "dark";
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems: Array<{label: string, items: MenuItem[]}> = [
    {
      label: "File",
      items: [
        { label: "New File", shortcut: "Ctrl+N", action: onNewFile },
        { label: "Open File...", shortcut: "Ctrl+O", action: onOpenFile },
        { label: "Open Folder...", shortcut: "Ctrl+K Ctrl+O", action: onOpenFolder },
        { label: "Save", shortcut: "Ctrl+S", action: onSaveFile },
        { label: "Save All", shortcut: "Ctrl+Shift+S", action: onSaveAll },
        { type: "separator" },
        { label: "Close File", shortcut: "Ctrl+W", action: onCloseFile },
        { label: "Close All", shortcut: "Ctrl+Shift+W", action: onCloseAll },
        { type: "separator" },
        { label: "Exit", shortcut: "Alt+F4", action: () => {} },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", shortcut: "Ctrl+Z", action: onUndo },
        { label: "Redo", shortcut: "Ctrl+Y", action: onRedo },
        { type: "separator" },
        { label: "Cut", shortcut: "Ctrl+X", action: onCut },
        { label: "Copy", shortcut: "Ctrl+C", action: onCopy },
        { label: "Paste", shortcut: "Ctrl+V", action: onPaste },
        { type: "separator" },
        { label: "Find", shortcut: "Ctrl+F", action: onFind },
        { label: "Replace", shortcut: "Ctrl+H", action: onReplace },
        { type: "separator" },
        { label: "Select All", shortcut: "Ctrl+A", action: () => {} },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Toggle Sidebar", shortcut: "Ctrl+B", action: onToggleSidebar },
        { label: "Toggle Terminal", shortcut: "Ctrl+`", action: onToggleTerminal },
        { label: "Toggle Debug Panel", action: onToggleDebugPanel },
        { type: "separator" },
        { label: "Zoom In", shortcut: "Ctrl+=", action: () => {} },
        { label: "Zoom Out", shortcut: "Ctrl+-", action: () => {} },
        { label: "Reset Zoom", shortcut: "Ctrl+0", action: () => {} },
      ],
    },
    {
      label: "Run",
      items: [
        { label: "Run", shortcut: "F5", action: onRun },
        { label: "Debug", shortcut: "F9", action: onDebug },
        { label: "Stop", shortcut: "Shift+F5", action: onStop },
        { type: "separator" },
        { label: "Step Over", shortcut: "F10", action: () => {} },
        { label: "Step Into", shortcut: "F11", action: () => {} },
        { label: "Step Out", shortcut: "Shift+F11", action: () => {} },
      ],
    },
    {
      label: "Terminal",
      items: [
        { label: "New Terminal", shortcut: "Ctrl+Shift+`", action: onNewTerminal },
        { label: "Split Terminal", shortcut: "Ctrl+\\", action: onSplitTerminal },
        { label: "Clear Terminal", shortcut: "Ctrl+L", action: onClearTerminal },
        { type: "separator" },
        { label: "Kill Terminal", action: () => {} },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Documentation", action: onDocumentation },
        { label: "About", action: onAbout },
      ],
    },
  ];

  const handleMenuClick = (menuLabel: string) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel);
  };

  const handleItemClick = (action?: () => void) => {
    setActiveMenu(null);
    action?.();
  };

  return (
    <div className={`flex items-center justify-between px-4 h-9 shrink-0 text-xs select-none ${isDark ? "bg-[#323233] border-b border-[#3c3c3c]" : "bg-zinc-100 border-b border-zinc-300"}`}>
      <span className="font-semibold tracking-wide">Web IDE</span>
      
      {/* Main Menu Bar */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 relative">
          {menuItems.map((menu) => (
            <div key={menu.label} className="relative">
              <button
                onClick={() => handleMenuClick(menu.label)}
                onMouseEnter={() => setActiveMenu(menu.label)}
                className={`px-3 py-1.5 hover:bg-opacity-20 ${isDark ? "hover:bg-white" : "hover:bg-black"} ${activeMenu === menu.label ? (isDark ? "bg-white bg-opacity-10" : "bg-black bg-opacity-10") : ""}`}
                aria-label={menu.label}
              >
                {menu.label}
              </button>
              
              {/* Dropdown Menu */}
              {activeMenu === menu.label && (
                <div
                  className={`absolute top-full left-0 z-50 min-w-48 py-1 mt-1 ${isDark ? "bg-[#252526] border border-[#3c3c3c] shadow-lg" : "bg-white border border-zinc-300 shadow-lg"}`}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  {menu.items.map((item, index) => {
                    if (item.type === "separator") {
                      return (
                        <div key={index} className={`h-px my-1 ${isDark ? "bg-[#3c3c3c]" : "bg-zinc-300"}`} />
                      );
                    } else if (item.label) {
                      return (
                        <button
                          key={index}
                          onClick={() => handleItemClick(item.action)}
                          className={`flex items-center justify-between w-full px-3 py-1.5 text-left ${isDark ? "hover:bg-[#094771]" : "hover:bg-blue-100"} ${isDark ? "text-zinc-200" : "text-zinc-900"}`}
                          disabled={!item.action}
                        >
                          <span>{item.label}</span>
                          {item.shortcut && (
                            <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="h-4 w-px bg-gray-500 opacity-30"></div>
        
        <div className="flex gap-3">
          <button onClick={onToggleSidebar} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Toggle sidebar" title="Toggle Sidebar (Ctrl+B)">
            <Menu className="h-4 w-4" />
          </button>
          <button onClick={onToggleTerminal} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Toggle terminal" title="Toggle Terminal (Ctrl+`)">
            <TerminalSquare className="h-4 w-4" />
          </button>
          <button onClick={onToggleDebugPanel} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Toggle debug panel" title="Toggle Debug Panel">
            <Bug className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
