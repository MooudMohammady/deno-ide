// Core data models for the Web IDE

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  language?: string;
  size?: number;
  lastModified?: Date;
  children?: FileNode[];
}

export interface EditorState {
  activeFileId: string | null;
  openFiles: string[];
  cursorPosition: { line: number; column: number };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface TerminalSession {
  id: string;
  title: string;
  processId?: string;
  history: string[];
  currentDirectory: string;
  isActive: boolean;
}

export interface DebugSession {
  id: string;
  status: "inactive" | "running" | "paused" | "terminated";
  breakpoints: Breakpoint[];
  currentFrame?: StackFrame;
  variables: Variable[];
}

export interface Breakpoint {
  id: string;
  fileId: string;
  line: number;
  enabled: boolean;
}

export interface StackFrame {
  id: string;
  name: string;
  fileId: string;
  line: number;
}

export interface Variable {
  name: string;
  value: string;
  type: string;
}

export interface Extension {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description: string;
  installed: boolean;
  enabled: boolean;
}

export interface IDESettings {
  theme: "dark" | "light";
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  layout: PanelLayout;
}

export interface PanelLayout {
  sidebarWidth: number;
  terminalHeight: number;
  showSidebar: boolean;
  showTerminal: boolean;
  showDebugPanel: boolean;
}
