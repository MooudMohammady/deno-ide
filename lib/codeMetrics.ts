/**
 * Code metrics calculation service.
 * Requirements: 8.5
 */

export interface CodeMetrics {
  lines: number;
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
  functions: number;
  complexity: number; // Cyclomatic complexity estimate
}

/**
 * Calculate basic code metrics for a file.
 */
export function calculateMetrics(content: string, language: string): CodeMetrics {
  const lines = content.split("\n");
  const totalLines = lines.length;

  let blankLines = 0;
  let commentLines = 0;
  let functions = 0;
  let complexity = 1; // Base complexity

  const isJsTs = ["javascript", "typescript"].includes(language);
  const isPython = language === "python";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      blankLines++;
      continue;
    }

    // Comment detection
    if (isJsTs && (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*"))) {
      commentLines++;
      continue;
    }
    if (isPython && trimmed.startsWith("#")) {
      commentLines++;
      continue;
    }

    // Function detection
    if (isJsTs) {
      if (/\bfunction\b/.test(trimmed) || /=>\s*\{/.test(trimmed) || /\b(async\s+)?\w+\s*\(/.test(trimmed)) {
        functions++;
      }
      // Complexity: branches
      if (/\b(if|else if|for|while|case|catch|\?\?|&&|\|\|)\b/.test(trimmed)) {
        complexity++;
      }
    }

    if (isPython) {
      if (/^\s*def\s+/.test(line)) functions++;
      if (/\b(if|elif|for|while|except|and|or)\b/.test(trimmed)) complexity++;
    }
  }

  const linesOfCode = totalLines - blankLines - commentLines;

  return {
    lines: totalLines,
    linesOfCode,
    blankLines,
    commentLines,
    functions,
    complexity,
  };
}

/** Returns a human-readable quality assessment */
export function assessQuality(metrics: CodeMetrics): string {
  if (metrics.complexity > 20) return "High complexity — consider refactoring";
  if (metrics.complexity > 10) return "Moderate complexity";
  if (metrics.linesOfCode > 500) return "Large file — consider splitting";
  return "Good";
}
