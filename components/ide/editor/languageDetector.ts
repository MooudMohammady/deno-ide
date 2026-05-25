/**
 * Maps file extensions to Monaco language identifiers.
 * Requirements: 1.4
 */
const EXT_TO_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  cc: "cpp",
  h: "cpp",
  cs: "csharp",
  php: "php",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  xml: "xml",
  svg: "xml",
  sql: "sql",
  graphql: "graphql",
  gql: "graphql",
  dockerfile: "dockerfile",
  tf: "hcl",
};

export function detectLanguage(filename: string): string {
  const lower = filename.toLowerCase();

  // Handle special filenames without extensions
  const basename = lower.split("/").pop() ?? lower;
  if (basename === "dockerfile") return "dockerfile";
  if (basename === "makefile") return "makefile";
  if (basename === ".env" || basename.startsWith(".env.")) return "ini";

  const ext = lower.split(".").pop() ?? "";
  return EXT_TO_LANGUAGE[ext] ?? "plaintext";
}
