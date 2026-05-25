/**
 * Code formatter service.
 * Uses Monaco's built-in formatting actions for TypeScript/JavaScript.
 * Provides basic formatting for other languages.
 * Requirements: 8.4
 */

export interface FormatOptions {
  tabSize: number;
  insertSpaces: boolean;
}

/**
 * Format code content for a given language.
 * For TS/JS, Monaco's formatDocument action is preferred (triggered via editor).
 * This provides a fallback for basic indentation normalization.
 */
export function formatContent(
  content: string,
  language: string,
  options: FormatOptions = { tabSize: 2, insertSpaces: true }
): string {
  const { tabSize, insertSpaces } = options;
  const indent = insertSpaces ? " ".repeat(tabSize) : "\t";

  // For JSON, do a parse-and-stringify round trip
  if (language === "json") {
    try {
      return JSON.stringify(JSON.parse(content), null, indent) + "\n";
    } catch {
      return content;
    }
  }

  // For other languages, normalize mixed tabs/spaces
  const lines = content.split("\n");
  const normalized = lines.map((line) => {
    const leadingTabs = line.match(/^\t+/)?.[0] ?? "";
    if (leadingTabs && insertSpaces) {
      return indent.repeat(leadingTabs.length) + line.slice(leadingTabs.length);
    }
    return line;
  });

  return normalized.join("\n");
}

/**
 * Trigger Monaco's built-in format document action.
 * Call this from the editor component when the user requests formatting.
 */
export function triggerMonacoFormat(
  editor: import("monaco-editor").editor.IStandaloneCodeEditor
): void {
  editor.getAction("editor.action.formatDocument")?.run();
}
