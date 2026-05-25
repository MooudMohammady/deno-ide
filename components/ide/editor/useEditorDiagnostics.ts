"use client";

import type * as Monaco from "monaco-editor";
import { useEffect } from "react";

/**
 * Subscribes to Monaco model markers (syntax/lint errors) for a given URI.
 * Requirements: 1.4, 1.5, 8.1
 */
export function useEditorDiagnostics(
  monaco: typeof Monaco | null,
  modelUri: string | null,
  onMarkers?: (markers: Monaco.editor.IMarker[]) => void
) {
  useEffect(() => {
    if (!monaco || !modelUri || !onMarkers) return;

    const disposable = monaco.editor.onDidChangeMarkers((uris) => {
      const changed = uris.find((u) => u.toString() === modelUri);
      if (changed) {
        const model = monaco.editor.getModel(changed);
        if (model) {
          const markers = monaco.editor.getModelMarkers({ resource: changed });
          onMarkers(markers);
        }
      }
    });

    return () => disposable.dispose();
  }, [monaco, modelUri, onMarkers]);
}
