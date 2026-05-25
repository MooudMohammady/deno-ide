/**
 * In-memory file system service.
 * Manages the project file tree and file contents.
 * Requirements: 2.3, 2.4, 2.5
 */

import type { FileNode } from "@/components/ide/types";

let _nextId = 1;
function genId(): string {
  return `node-${_nextId++}`;
}

export interface FileSystemState {
  root: FileNode | null;
  contents: Record<string, string>; // fileId -> content
}

function buildPath(parentPath: string, name: string): string {
  return parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;
}

/** Create a new file node */
export function createNode(
  parentPath: string,
  name: string,
  type: "file" | "directory"
): FileNode {
  const path = buildPath(parentPath, name);
  return {
    id: genId(),
    name,
    path,
    type,
    children: type === "directory" ? [] : undefined,
    size: 0,
    lastModified: new Date(),
  };
}

/** Insert a node into the tree under the given parent path */
export function insertNode(root: FileNode, parentPath: string, node: FileNode): FileNode {
  if (root.path === parentPath && root.type === "directory") {
    return {
      ...root,
      children: [...(root.children ?? []), node],
    };
  }
  if (root.type === "directory" && root.children) {
    return {
      ...root,
      children: root.children.map((child) => insertNode(child, parentPath, node)),
    };
  }
  return root;
}

/** Remove a node by id from the tree */
export function removeNode(root: FileNode, nodeId: string): FileNode | null {
  if (root.id === nodeId) return null;
  if (root.type === "directory" && root.children) {
    const children = root.children
      .map((child) => removeNode(child, nodeId))
      .filter((c): c is FileNode => c !== null);
    return { ...root, children };
  }
  return root;
}

/** Rename a node by id */
export function renameNode(root: FileNode, nodeId: string, newName: string): FileNode {
  if (root.id === nodeId) {
    const parentPath = root.path.substring(0, root.path.lastIndexOf("/")) || "/";
    return {
      ...root,
      name: newName,
      path: buildPath(parentPath, newName),
      lastModified: new Date(),
    };
  }
  if (root.type === "directory" && root.children) {
    return {
      ...root,
      children: root.children.map((child) => renameNode(child, nodeId, newName)),
    };
  }
  return root;
}

/** Find a node by id */
export function findNode(root: FileNode, nodeId: string): FileNode | null {
  if (root.id === nodeId) return root;
  if (root.type === "directory" && root.children) {
    for (const child of root.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/** Flatten all file nodes (not directories) into a map */
export function buildFileMap(root: FileNode): Record<string, FileNode> {
  const map: Record<string, FileNode> = {};
  function walk(node: FileNode) {
    map[node.id] = node;
    node.children?.forEach(walk);
  }
  walk(root);
  return map;
}

/** Create a sample project tree for demo purposes */
export function createSampleProject(): { root: FileNode; contents: Record<string, string> } {
  const root: FileNode = {
    id: genId(),
    name: "my-project",
    path: "/my-project",
    type: "directory",
    children: [],
  };

  const indexTs = createNode(root.path, "index.ts", "file");
  const readmeMd = createNode(root.path, "README.md", "file");
  const srcDir: FileNode = { ...createNode(root.path, "src", "directory"), children: [] };
  const appTs = createNode(srcDir.path, "app.ts", "file");

  srcDir.children = [appTs];
  root.children = [indexTs, readmeMd, srcDir];

  const contents: Record<string, string> = {
    [indexTs.id]: `// Entry point\nimport { app } from "./src/app";\n\napp();\n`,
    [readmeMd.id]: `# My Project\n\nA sample project.\n`,
    [appTs.id]: `export function app() {\n  console.log("Hello, Web IDE!");\n}\n`,
  };

  return { root, contents };
}
