import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

type FileTreeResponse = {
  type: 'file' | 'directory';
  name: string;
  path: string;
  content?: string;
  children?: FileTreeResponse[];
  size: number;
  lastModified: string;
};

// Base directory for projects (in development, use current directory)
const BASE_DIR = process.cwd();
const PROJECTS_DIR = path.join(BASE_DIR, 'projects');

// Ensure projects directory exists
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

async function readDirectoryTree(fullPath: string, relativePath: string): Promise<FileTreeResponse> {
  const stats = await stat(fullPath);

  if (stats.isDirectory()) {
    const files = await readdir(fullPath);
    const children = await Promise.all(
      files.map(async (file) => {
        const childFullPath = path.join(fullPath, file);
        const childRelativePath = path.join(relativePath, file).replace(/\\/g, '/');
        return readDirectoryTree(childFullPath, childRelativePath);
      })
    );

    return {
      type: 'directory',
      name: path.basename(fullPath),
      path: relativePath || '/',
      children,
      size: stats.size,
      lastModified: stats.mtime.toISOString()
    };
  }

  const content = await readFile(fullPath, 'utf-8');
  return {
    type: 'file',
    name: path.basename(fullPath),
    path: relativePath || path.basename(fullPath),
    content,
    size: stats.size,
    lastModified: stats.mtime.toISOString()
  };
}

function normalizeRelativePath(input: string | undefined, fallbackName: string) {
  const raw = String(input || fallbackName || "").replace(/\\/g, "/").replace(/^\/+/, "");
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'default';
  const filePath = searchParams.get('path') || '/';
  
  const projectDir = path.join(PROJECTS_DIR, projectId);
  
  try {
    // Ensure project directory exists
    if (!fs.existsSync(projectDir)) {
      await mkdir(projectDir, { recursive: true });
      
      // Create sample files for new project
      if (projectId === 'default') {
        await createSampleProject(projectDir);
      }
    }
    
    const fullPath = path.join(projectDir, filePath);
    
    // Check if path exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Path not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(await readDirectoryTree(fullPath, filePath));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown file system error';
    console.error('File system error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Helper function to create sample project
async function createSampleProject(projectDir: string) {
  const sampleFiles = [
    {
      path: 'hello.py',
      content: `#!/usr/bin/env python3
# hello.py - Simple Python example

def main():
    print("Hello, World!")
    print("Welcome to the Web IDE!")
    print("This is a Python file running in the terminal.")
    
    # Some simple calculations
    x = 10
    y = 20
    result = x + y
    print(f"{x} + {y} = {result}")
    
    # List example
    fruits = ["apple", "banana", "cherry"]
    print("Fruits:", fruits)
    
    # Loop example
    print("Counting from 1 to 5:")
    for i in range(1, 6):
        print(f"  {i}")

if __name__ == "__main__":
    main()`
    },
    {
      path: 'app.py',
      content: `#!/usr/bin/env python3
# app.py - Sample web application

from datetime import datetime

class WebApp:
    def __init__(self, name):
        self.name = name
        self.start_time = datetime.now()
    
    def start(self):
        print(f"Starting {self.name}...")
        print(f"Start time: {self.start_time}")
        print("Server is running on http://localhost:8000")
        print("Press Ctrl+C to stop")
    
    def status(self):
        uptime = datetime.now() - self.start_time
        print(f"App: {self.name}")
        print(f"Uptime: {uptime}")
        print("Status: Running")
    
    def stop(self):
        print(f"Stopping {self.name}...")
        print("Server stopped")

def main():
    app = WebApp("Web IDE Demo App")
    app.start()
    print("\\n" + "="*40)
    app.status()
    print("="*40)

if __name__ == "__main__":
    main()`
    },
    {
      path: 'index.js',
      content: `// JavaScript example
console.log("Hello from Node.js!");

function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 10);
console.log(\`5 + 10 = \${result}\`);

// Array example
const colors = ['red', 'green', 'blue'];
console.log('Colors:', colors);

// Object example
const user = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
};
console.log('User:', user);

// Promise example
const fetchData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Data fetched successfully!');
    }, 1000);
  });
};

fetchData().then(data => {
  console.log(data);
});`
    },
    {
      path: 'README.md',
      content: `# Web IDE Project

This is a sample project for the Web IDE.

## Features
- Real file system access
- Terminal with server-side execution
- Code editor with syntax highlighting
- File explorer

## Getting Started
1. Open a terminal and run \`python hello.py\`
2. Edit files in the editor
3. Upload your own files using the upload feature

## Project Structure
- \`hello.py\` - Simple Python example
- \`app.py\` - Web application example
- \`index.js\` - JavaScript example
- \`README.md\` - This file`
    }
  ];

  // Create sample files
  for (const file of sampleFiles) {
    const filePath = path.join(projectDir, file.path);
    const parentDir = path.dirname(filePath);
    
    if (!fs.existsSync(parentDir)) {
      await mkdir(parentDir, { recursive: true });
    }
    
    await writeFile(filePath, file.content, 'utf-8');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId = 'default', path: filePath, content, newName, files } = body;
    
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    switch (action) {
      case 'createFile':
        const fullCreatePath = path.join(projectDir, normalizeRelativePath(filePath, 'newfile'));
        // Ensure parent directory exists
        const parentDir = path.dirname(fullCreatePath);
        if (!fs.existsSync(parentDir)) {
          await mkdir(parentDir, { recursive: true });
        }
        
        await writeFile(fullCreatePath, content || '', 'utf-8');
        return NextResponse.json({ success: true });
        
      case 'createDirectory':
        await mkdir(path.join(projectDir, normalizeRelativePath(filePath, 'new-folder')), { recursive: true });
        return NextResponse.json({ success: true });
        
      case 'updateFile':
        await writeFile(path.join(projectDir, normalizeRelativePath(filePath, 'file')), content, 'utf-8');
        return NextResponse.json({ success: true });
        
      case 'delete':
        const fullDeletePath = path.join(projectDir, normalizeRelativePath(filePath, 'file'));
        const stats = await stat(fullDeletePath);
        if (stats.isDirectory()) {
          await rmdir(fullDeletePath, { recursive: true });
        } else {
          await unlink(fullDeletePath);
        }
        return NextResponse.json({ success: true });
        
      case 'rename':
        const renamePath = path.join(projectDir, normalizeRelativePath(filePath, 'file'));
        const newPath = path.join(path.dirname(renamePath), newName);
        fs.renameSync(renamePath, newPath);
        return NextResponse.json({ success: true });
        
      case 'upload':
        // For file upload
        const uploadDir = path.join(projectDir, 'uploads');
        if (!fs.existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
        
        const uploadPath = path.join(uploadDir, path.basename(filePath));
        await writeFile(uploadPath, content, 'utf-8');
        return NextResponse.json({ success: true, path: uploadPath });

      case 'importFiles':
        if (!Array.isArray(files) || files.length === 0) {
          return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        for (const item of files) {
          const relative = String(item.path || item.name || '').replace(/\\/g, '/').replace(/^\/+/, '');
          const destination = path.join(projectDir, relative);
          const destinationDir = path.dirname(destination);
          if (!fs.existsSync(destinationDir)) {
            await mkdir(destinationDir, { recursive: true });
          }
          await writeFile(destination, String(item.content || ''), 'utf-8');
        }

        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown file system operation error';
    console.error('File system operation error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
