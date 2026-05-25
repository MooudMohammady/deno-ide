"use client";

import { useCallback, useState } from "react";
import type { Extension } from "../types";

/** Sample marketplace catalog */
const CATALOG: Extension[] = [
  {
    id: "prettier",
    name: "Prettier",
    publisher: "Prettier",
    version: "10.0.0",
    description: "Opinionated code formatter",
    installed: false,
    enabled: false,
  },
  {
    id: "eslint",
    name: "ESLint",
    publisher: "Microsoft",
    version: "3.0.0",
    description: "Integrates ESLint into the editor",
    installed: false,
    enabled: false,
  },
  {
    id: "gitlens",
    name: "GitLens",
    publisher: "GitKraken",
    version: "15.0.0",
    description: "Supercharge Git inside the IDE",
    installed: false,
    enabled: false,
  },
  {
    id: "theme-one-dark",
    name: "One Dark Pro",
    publisher: "binaryify",
    version: "3.0.0",
    description: "Atom's iconic One Dark theme",
    installed: false,
    enabled: false,
  },
];

/**
 * Manages extension install/uninstall/enable/disable state.
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */
export function useExtensions() {
  const [extensions, setExtensions] = useState<Extension[]>(CATALOG);

  const install = useCallback((ext: Extension) => {
    setExtensions((prev) =>
      prev.map((e) => (e.id === ext.id ? { ...e, installed: true, enabled: true } : e))
    );
  }, []);

  const uninstall = useCallback((ext: Extension) => {
    setExtensions((prev) =>
      prev.map((e) => (e.id === ext.id ? { ...e, installed: false, enabled: false } : e))
    );
  }, []);

  const toggle = useCallback((ext: Extension) => {
    setExtensions((prev) =>
      prev.map((e) => (e.id === ext.id ? { ...e, enabled: !e.enabled } : e))
    );
  }, []);

  const installedExtensions = extensions.filter((e) => e.installed && e.enabled);

  return { extensions, installedExtensions, install, uninstall, toggle };
}
