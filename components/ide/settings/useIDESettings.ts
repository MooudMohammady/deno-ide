"use client";

import { useCallback, useEffect, useState } from "react";
import type { IDESettings } from "../types";

const STORAGE_KEY = "web-ide-settings";

const defaultSettings: IDESettings = {
  theme: "dark",
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  layout: {
    sidebarWidth: 240,
    terminalHeight: 200,
    showSidebar: true,
    showTerminal: true,
    showDebugPanel: false,
  },
};

function loadSettings(): IDESettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: IDESettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Persistent IDE settings with localStorage backing.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function useIDESettings() {
  const [settings, setSettings] = useState<IDESettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setTheme = useCallback((theme: "dark" | "light") => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    setSettings((prev) => ({ ...prev, fontSize }));
  }, []);

  const setTabSize = useCallback((tabSize: number) => {
    setSettings((prev) => ({ ...prev, tabSize }));
  }, []);

  const setWordWrap = useCallback((wordWrap: boolean) => {
    setSettings((prev) => ({ ...prev, wordWrap }));
  }, []);

  const setMinimap = useCallback((minimap: boolean) => {
    setSettings((prev) => ({ ...prev, minimap }));
  }, []);

  const updateLayout = useCallback(
    (layout: Partial<IDESettings["layout"]>) => {
      setSettings((prev) => ({ ...prev, layout: { ...prev.layout, ...layout } }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    setTheme,
    setFontSize,
    setTabSize,
    setWordWrap,
    setMinimap,
    updateLayout,
    resetSettings,
  };
}
