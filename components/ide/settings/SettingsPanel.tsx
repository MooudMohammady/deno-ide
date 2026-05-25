"use client";

import type { IDESettings } from "../types";

interface SettingsPanelProps {
  settings: IDESettings;
  theme?: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  onFontSizeChange: (size: number) => void;
  onTabSizeChange: (size: number) => void;
  onWordWrapChange: (wrap: boolean) => void;
  onMinimapChange: (show: boolean) => void;
  onReset: () => void;
}

/**
 * Settings panel for editor and layout customization.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export default function SettingsPanel({
  settings,
  theme = "dark",
  onThemeChange,
  onFontSizeChange,
  onTabSizeChange,
  onWordWrapChange,
  onMinimapChange,
  onReset,
}: SettingsPanelProps) {
  const isDark = theme === "dark";

  const labelClass = `text-xs opacity-60 mb-0.5`;
  const inputClass = `w-full text-xs px-2 py-1 outline-none rounded ${isDark ? "bg-[#3c3c3c] text-zinc-100" : "bg-zinc-100 text-zinc-900"}`;
  const sectionClass = `px-3 py-2 flex flex-col gap-1`;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest opacity-60 shrink-0 ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}>
        Settings
      </div>

      {/* Theme */}
      <div className={sectionClass}>
        <label className={labelClass}>Theme</label>
        <select
          value={settings.theme}
          onChange={(e) => onThemeChange(e.target.value as "dark" | "light")}
          className={inputClass}
          aria-label="Theme"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      {/* Font size */}
      <div className={sectionClass}>
        <label className={labelClass}>Font Size: {settings.fontSize}px</label>
        <input
          type="range"
          min={10}
          max={24}
          value={settings.fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-full"
          aria-label="Font size"
        />
      </div>

      {/* Tab size */}
      <div className={sectionClass}>
        <label className={labelClass}>Tab Size</label>
        <select
          value={settings.tabSize}
          onChange={(e) => onTabSizeChange(Number(e.target.value))}
          className={inputClass}
          aria-label="Tab size"
        >
          {[2, 4, 8].map((n) => (
            <option key={n} value={n}>{n} spaces</option>
          ))}
        </select>
      </div>

      {/* Word wrap */}
      <div className={`${sectionClass} flex-row items-center justify-between`}>
        <label className={labelClass}>Word Wrap</label>
        <input
          type="checkbox"
          checked={settings.wordWrap}
          onChange={(e) => onWordWrapChange(e.target.checked)}
          aria-label="Word wrap"
        />
      </div>

      {/* Minimap */}
      <div className={`${sectionClass} flex-row items-center justify-between`}>
        <label className={labelClass}>Minimap</label>
        <input
          type="checkbox"
          checked={settings.minimap}
          onChange={(e) => onMinimapChange(e.target.checked)}
          aria-label="Minimap"
        />
      </div>

      {/* Reset */}
      <div className="px-3 py-2 mt-auto">
        <button
          onClick={onReset}
          className={`w-full text-xs py-1 rounded ${isDark ? "bg-[#3c3c3c] hover:bg-[#4c4c4c] text-zinc-300" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"}`}
          aria-label="Reset settings"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
