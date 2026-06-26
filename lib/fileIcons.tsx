import {
  Braces,
  File,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Settings,
  type LucideIcon,
} from "lucide-react";

const EXTENSION_ICON_MAP: Record<string, LucideIcon> = {
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  cpp: FileCode,
  c: FileCode,
  cs: FileCode,
  php: FileCode,
  html: FileCode,
  htm: FileCode,
  css: FileCode,
  scss: FileCode,
  sass: FileCode,
  less: FileCode,
  vue: FileCode,
  svelte: FileCode,
  json: FileJson,
  yaml: Braces,
  yml: Braces,
  toml: Braces,
  md: FileText,
  mdx: FileText,
  txt: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  svg: Image,
  webp: Image,
  ico: Image,
  env: Settings,
};

export function getFileIcon(name: string): LucideIcon {
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";
  return EXTENSION_ICON_MAP[ext] ?? File;
}

export function getFolderIcon(expanded: boolean): LucideIcon {
  return expanded ? FolderOpen : Folder;
}
