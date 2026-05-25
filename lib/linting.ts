/**
 * Client-side linting service using Monaco's built-in diagnostics.
 * For TypeScript/JavaScript, Monaco provides real-time syntax and type checking.
 * This module provides additional rule-based linting on top.
 * Requirements: 8.1, 8.2, 8.3
 */

export interface LintDiagnostic {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  severity: "error" | "warning" | "info";
  message: string;
  rule?: string;
}

/** Simple pattern-based lint rules */
const LINT_RULES: Array<{
  pattern: RegExp;
  message: string;
  severity: LintDiagnostic["severity"];
  rule: string;
  languages: string[];
}> = [
  {
    pattern: /console\.log\(/g,
    message: "Avoid console.log in production code",
    severity: "warning",
    rule: "no-console",
    languages: ["javascript", "typescript"],
  },
  {
    pattern: /debugger;/g,
    message: "Remove debugger statement",
    severity: "error",
    rule: "no-debugger",
    languages: ["javascript", "typescript"],
  },
  {
    pattern: /\bvar\b/g,
    message: "Use 'const' or 'let' instead of 'var'",
    severity: "warning",
    rule: "no-var",
    languages: ["javascript", "typescript"],
  },
  {
    pattern: /\s+$/gm,
    message: "Trailing whitespace",
    severity: "info",
    rule: "no-trailing-spaces",
    languages: ["javascript", "typescript", "python", "css", "html"],
  },
];

/**
 * Run lint rules against file content.
 * Returns diagnostics sorted by line number.
 */
export function lintContent(content: string, language: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = content.split("\n");

  for (const rule of LINT_RULES) {
    if (!rule.languages.includes(language)) continue;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let match: RegExpExecArray | null;
      rule.pattern.lastIndex = 0;

      while ((match = rule.pattern.exec(line)) !== null) {
        diagnostics.push({
          line: lineIdx + 1,
          column: match.index + 1,
          endLine: lineIdx + 1,
          endColumn: match.index + match[0].length + 1,
          severity: rule.severity,
          message: rule.message,
          rule: rule.rule,
        });
      }
    }
  }

  return diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);
}
