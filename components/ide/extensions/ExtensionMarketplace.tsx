"use client";

import { useState } from "react";
import type { Extension } from "../types";

interface ExtensionMarketplaceProps {
  extensions: Extension[];
  theme?: "dark" | "light";
  onInstall: (ext: Extension) => void;
  onUninstall: (ext: Extension) => void;
  onToggle: (ext: Extension) => void;
}

/**
 * Extension marketplace UI — browse, install, uninstall, enable/disable.
 * Requirements: 5.1, 5.2, 5.3
 */
export default function ExtensionMarketplace({
  extensions,
  theme = "dark",
  onInstall,
  onUninstall,
  onToggle,
}: ExtensionMarketplaceProps) {
  const isDark = theme === "dark";
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"marketplace" | "installed">("marketplace");

  const filtered = extensions.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase()) ||
      e.publisher.toLowerCase().includes(query.toLowerCase())
  );

  const shown =
    tab === "installed" ? filtered.filter((e) => e.installed) : filtered;

  const rowBase = `flex flex-col gap-0.5 px-3 py-2 border-b ${isDark ? "border-[#3c3c3c] hover:bg-[#2a2d2e]" : "border-zinc-200 hover:bg-zinc-50"}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className={`px-3 py-2 shrink-0 ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}>
        <input
          type="search"
          placeholder="Search extensions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full text-xs px-2 py-1 outline-none rounded ${isDark ? "bg-[#3c3c3c] text-zinc-100 placeholder-zinc-500" : "bg-zinc-100 text-zinc-900 placeholder-zinc-400"}`}
          aria-label="Search extensions"
        />
      </div>

      {/* Tabs */}
      <div className={`flex shrink-0 text-xs ${isDark ? "border-b border-[#3c3c3c]" : "border-b border-zinc-200"}`}>
        {(["marketplace", "installed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 capitalize ${tab === t ? (isDark ? "border-b-2 border-blue-400 text-zinc-100" : "border-b-2 border-blue-500 text-zinc-900") : "opacity-50 hover:opacity-80"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {shown.length === 0 ? (
          <div className="px-3 py-4 text-xs opacity-40 italic">No extensions found</div>
        ) : (
          shown.map((ext) => (
            <div key={ext.id} className={rowBase}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                  {ext.name}
                </span>
                <div className="flex gap-1">
                  {ext.installed ? (
                    <>
                      <button
                        onClick={() => onToggle(ext)}
                        className={`text-xs px-1.5 py-0.5 rounded ${ext.enabled ? "text-yellow-400 hover:bg-yellow-400/10" : "text-zinc-400 hover:bg-zinc-400/10"}`}
                        aria-label={ext.enabled ? "Disable" : "Enable"}
                      >
                        {ext.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => onUninstall(ext)}
                        className="text-xs px-1.5 py-0.5 rounded text-red-400 hover:bg-red-400/10"
                        aria-label="Uninstall"
                      >
                        Uninstall
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onInstall(ext)}
                      className="text-xs px-1.5 py-0.5 rounded text-blue-400 hover:bg-blue-400/10"
                      aria-label="Install"
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>
              <span className="text-xs opacity-50">{ext.publisher} · v{ext.version}</span>
              <span className="text-xs opacity-60">{ext.description}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
