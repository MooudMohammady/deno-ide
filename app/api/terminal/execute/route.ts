import { spawn } from 'child_process';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

// Helper function to execute Python code
async function executePythonCode(code: string, workingDir: string): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    // Create a temporary Python file
    const tempFile = path.join(workingDir, `temp_${Date.now()}.py`);
    
    writeFile(tempFile, code, 'utf-8')
      .then(() => {
        const pythonProcess = spawn('python', [tempFile], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          error += data.toString();
        });

        pythonProcess.on('close', (code) => {
          // Clean up temp file
          unlink(tempFile).catch(() => {});
          
          if (code === 0) {
            resolve({ output, error });
          } else {
            resolve({ output: error || `Process exited with code ${code}`, error });
          }
        });

        pythonProcess.on('error', (err) => {
          // Clean up temp file
          unlink(tempFile).catch(() => {});
          resolve({ output: `Error: ${err.message}`, error: err.message });
        });
      })
      .catch(err => {
        resolve({ output: `Error creating temp file: ${err.message}`, error: err.message });
      });
  });
}

// Helper function to execute shell command
async function executeShellCommand(command: string, workingDir: string): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    const args = process.platform === 'win32' ? ['/c', command] : ['-c', command];
    
    const processObj = spawn(shell, args, {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    processObj.stdout.on('data', (data) => {
      output += data.toString();
    });

    processObj.stderr.on('data', (data) => {
      error += data.toString();
    });

    processObj.on('close', (code) => {
      if (code === 0) {
        resolve({ output, error });
      } else {
        resolve({ output: error || `Process exited with code ${code}`, error });
      }
    });

    processObj.on('error', (err) => {
      resolve({ output: `Error: ${err.message}`, error: err.message });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, projectId = 'default', cwd } = body;
    
    const BASE_DIR = process.cwd();
    const PROJECTS_DIR = path.join(BASE_DIR, 'projects');
    const projectDir = path.join(PROJECTS_DIR, projectId);
    const requestedCwd = typeof cwd === 'string' && cwd.trim() ? cwd.trim() : projectDir;
    const workingDir = path.isAbsolute(requestedCwd)
      ? requestedCwd
      : path.join(projectDir, requestedCwd);

    const resolvedProjectDir = path.resolve(projectDir);
    const resolvedWorkingDir = path.resolve(workingDir);
    const safeWorkingDir = resolvedWorkingDir.startsWith(resolvedProjectDir)
      ? resolvedWorkingDir
      : resolvedProjectDir;
    
    // Ensure project directory exists
    if (!(await exists(projectDir))) {
      await mkdir(projectDir, { recursive: true });
    }
    
    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }
    
    const trimmed = command.trim();
    let result: { output: string; error: string };
    
    // Handle different types of commands
    if (trimmed.startsWith('python ')) {
      const filename = trimmed.substring(7).trim();
      const fullPath = path.join(projectDir, filename);
      
      if (!(await exists(fullPath))) {
        return NextResponse.json({
          success: false,
          output: `Python file not found: ${filename}`,
          error: `File not found: ${filename}`
        });
      }
      
      // Read Python file content
      const pythonCode = fs.readFileSync(fullPath, 'utf-8');
      result = await executePythonCode(pythonCode, path.dirname(fullPath));
      
    } else if (trimmed.startsWith('node ')) {
      const filename = trimmed.substring(5).trim();
      const fullPath = path.join(projectDir, filename);
      
      if (!(await exists(fullPath))) {
        return NextResponse.json({
          success: false,
          output: `Node.js file not found: ${filename}`,
          error: `File not found: ${filename}`
        });
      }
      
      // Execute Node.js file
      result = await executeShellCommand(`node "${fullPath}"`, path.dirname(fullPath));
      
    } else if (trimmed === 'ls' || trimmed === 'dir') {
      // List files
      const listCommand = process.platform === 'win32' ? 'dir /B' : 'ls -la';
      result = await executeShellCommand(listCommand, projectDir);
      
    } else if (trimmed.startsWith('cd ')) {
      // Change directory (simulated)
      const dir = trimmed.substring(3).trim();
      const newDir = path.join(projectDir, dir);
      
      if (await exists(newDir) && fs.statSync(newDir).isDirectory()) {
        result = { output: `Changed directory to: ${dir}`, error: '' };
      } else {
        result = { output: `Directory not found: ${dir}`, error: `Directory not found` };
      }
      
    } else if (trimmed === 'pwd') {
      // Print working directory
      result = { output: safeWorkingDir, error: '' };
      
    } else if (trimmed.startsWith('cat ') || trimmed.startsWith('type ')) {
      // Show file content
      const filename = trimmed.substring(4).trim();
      const fullPath = path.join(projectDir, filename);
      
      if (await exists(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        result = { output: content, error: '' };
      } else {
        result = { output: `File not found: ${filename}`, error: `File not found` };
      }
      
    } else if (trimmed.startsWith('mkdir ')) {
      // Create directory
      const dirname = trimmed.substring(6).trim();
      const fullPath = path.join(projectDir, dirname);
      
      try {
        await mkdir(fullPath, { recursive: true });
        result = { output: `Directory created: ${dirname}`, error: '' };
      } catch (err: any) {
        result = { output: `Error creating directory: ${err.message}`, error: err.message };
      }
      
    } else if (trimmed.startsWith('touch ') || trimmed.startsWith('echo > ')) {
      // Create file
      const filename = trimmed.startsWith('touch ') 
        ? trimmed.substring(6).trim()
        : trimmed.substring(7).trim();
      const fullPath = path.join(projectDir, filename);
      
      try {
        await writeFile(fullPath, '', 'utf-8');
        result = { output: `File created: ${filename}`, error: '' };
      } catch (err: any) {
        result = { output: `Error creating file: ${err.message}`, error: err.message };
      }
      
    } else if (trimmed.startsWith('rm ') || trimmed.startsWith('del ')) {
      // Delete file
      const filename = trimmed.startsWith('rm ') 
        ? trimmed.substring(3).trim()
        : trimmed.substring(4).trim();
      const fullPath = path.join(projectDir, filename);
      
      if (await exists(fullPath)) {
        try {
          await unlink(fullPath);
          result = { output: `File deleted: ${filename}`, error: '' };
        } catch (err: any) {
          result = { output: `Error deleting file: ${err.message}`, error: err.message };
        }
      } else {
        result = { output: `File not found: ${filename}`, error: `File not found` };
      }
      
    } else if (trimmed === 'clear' || trimmed === 'cls') {
      // Clear terminal (simulated)
      result = { output: '[Terminal cleared]', error: '' };
      
    } else if (trimmed === 'help') {
      // Show help
      const helpText = `Available commands:
  help                    - Show this help
  clear / cls            - Clear terminal
  ls / dir               - List files
  python <filename.py>   - Run Python file
  node <filename.js>     - Run Node.js file
  cd <directory>         - Change directory
  pwd                    - Print working directory
  cat <filename>         - Show file contents
  mkdir <name>           - Create directory
  touch <filename>       - Create empty file
  rm <filename>          - Delete file
  echo <text>            - Print text
  date                   - Show current date/time
  
Real terminal with server-side execution.`;
      result = { output: helpText, error: '' };
      
    } else if (trimmed.startsWith('echo ')) {
      // Echo command
      const text = trimmed.substring(5);
      result = { output: text, error: '' };
      
    } else if (trimmed === 'date' || trimmed === 'time') {
      // Date/time command
      const now = new Date();
      result = { output: now.toLocaleString(), error: '' };
      
    } else {
      // Try to execute as shell command
      result = await executeShellCommand(trimmed, safeWorkingDir);
    }
    
    return NextResponse.json({
      success: true,
      output: result.output,
      error: result.error
    });
    
  } catch (error: any) {
    console.error('Terminal execute error:', error);
    return NextResponse.json({
      success: false,
      output: `Error: ${error.message}`,
      error: error.message
    });
  }
}
