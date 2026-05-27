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
  const helloPy = createNode(root.path, "hello.py", "file");
  const appPy = createNode(root.path, "app.py", "file");
  const testPy = createNode(root.path, "test.py", "file");
  const srcDir: FileNode = { ...createNode(root.path, "src", "directory"), children: [] };
  const appTs = createNode(srcDir.path, "app.ts", "file");

  srcDir.children = [appTs];
  root.children = [indexTs, readmeMd, helloPy, appPy, testPy, srcDir];

  const contents: Record<string, string> = {
    [indexTs.id]: `// Entry point\nimport { app } from "./src/app";\n\napp();\n`,
    [readmeMd.id]: `# My Project\n\nA sample project with Python support.\n`,
    [helloPy.id]: `#!/usr/bin/env python3\n# hello.py - Simple Python example\n\ndef main():\n    print("Hello, World!")\n    print("Welcome to the Web IDE!")\n    print("This is a Python file running in the terminal.")\n    \n    # Some simple calculations\n    x = 10\n    y = 20\n    result = x + y\n    print(f"{x} + {y} = {result}")\n    \n    # List example\n    fruits = ["apple", "banana", "cherry"]\n    print("Fruits:", fruits)\n    \n    # Loop example\n    print("Counting from 1 to 5:")\n    for i in range(1, 6):\n        print(f"  {i}")\n\nif __name__ == "__main__":\n    main()\n`,
    [appPy.id]: `#!/usr/bin/env python3\n# app.py - Sample web application\n\nfrom datetime import datetime\n\nclass WebApp:\n    def __init__(self, name):\n        self.name = name\n        self.start_time = datetime.now()\n    \n    def start(self):\n        print(f"Starting {self.name}...")\n        print(f"Start time: {self.start_time}")\n        print("Server is running on http://localhost:8000")\n        print("Press Ctrl+C to stop")\n    \n    def status(self):\n        uptime = datetime.now() - self.start_time\n        print(f"App: {self.name}")\n        print(f"Uptime: {uptime}")\n        print("Status: Running")\n    \n    def stop(self):\n        print(f"Stopping {self.name}...")\n        print("Server stopped")\n\ndef main():\n    app = WebApp("Web IDE Demo App")\n    app.start()\n    print("\\n" + "="*40)\n    app.status()\n    print("="*40)\n\nif __name__ == "__main__":\n    main()\n`,
    [testPy.id]: `#!/usr/bin/env python3\n# test.py - Sample test file\n\nimport unittest\n\nclass TestMathOperations(unittest.TestCase):\n    def test_addition(self):\n        self.assertEqual(1 + 1, 2)\n        self.assertEqual(10 + 20, 30)\n        self.assertEqual(-5 + 5, 0)\n    \n    def test_subtraction(self):\n        self.assertEqual(5 - 3, 2)\n        self.assertEqual(10 - 20, -10)\n        self.assertEqual(0 - 5, -5)\n    \n    def test_multiplication(self):\n        self.assertEqual(2 * 3, 6)\n        self.assertEqual(5 * 0, 0)\n        self.assertEqual(-3 * 4, -12)\n    \n    def test_division(self):\n        self.assertEqual(10 / 2, 5)\n        self.assertEqual(9 / 3, 3)\n        with self.assertRaises(ZeroDivisionError):\n            _ = 5 / 0\n    \n    def test_string_operations(self):\n        self.assertEqual("hello" + " " + "world", "hello world")\n        self.assertEqual("test" * 3, "testtesttest")\n        self.assertTrue("hello".startswith("h"))\n        self.assertTrue("world".endswith("d"))\n\ndef run_tests():\n    print("Running tests...")\n    print("=" * 50)\n    \n    # Create a test suite\n    suite = unittest.TestLoader().loadTestsFromTestCase(TestMathOperations)\n    \n    # Run tests\n    runner = unittest.TextTestRunner(verbosity=2)\n    result = runner.run(suite)\n    \n    print("=" * 50)\n    print(f"Tests run: {result.testsRun}")\n    print(f"Failures: {len(result.failures)}")\n    print(f"Errors: {len(result.errors)}")\n    \n    if result.wasSuccessful():\n        print("All tests passed! ✅")\n    else:\n        print("Some tests failed! ❌")\n    \n    return result.wasSuccessful()\n\nif __name__ == "__main__":\n    success = run_tests()\n    exit(0 if success else 1)\n`,
    [appTs.id]: `export function app() {\n  console.log("Hello, Web IDE!");\n}\n`,
  };

  return { root, contents };
}
