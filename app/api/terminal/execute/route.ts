import { spawn } from 'child_process';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';
import {
  resolveCdTarget,
  resolveProjectFilePath,
  resolveSafeWorkingDir,
  toClientCwd,
} from '@/lib/terminalPaths';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

async function executePythonCode(code: string, workingDir: string): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    if (!fs.existsSync(workingDir) || !fs.statSync(workingDir).isDirectory()) {
      resolve({
        output: `Working directory not found: ${workingDir}`,
        error: 'Working directory not found',
      });
      return;
    }

    const tempFile = path.join(workingDir, `temp_${Date.now()}.py`);

    writeFile(tempFile, code, 'utf-8')
      .then(() => {
        const pythonProcess = spawn('python', [tempFile], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe'],
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
          unlink(tempFile).catch(() => {});

          if (code === 0) {
            resolve({ output, error });
          } else {
            resolve({ output: error || `Process exited with code ${code}`, error });
          }
        });

        pythonProcess.on('error', (err) => {
          unlink(tempFile).catch(() => {});
          resolve({ output: `Error: ${err.message}`, error: err.message });
        });
      })
      .catch((err) => {
        resolve({ output: `Error creating temp file: ${err.message}`, error: err.message });
      });
  });
}

function resolveShell(): string {
  if (process.platform === 'win32') {
    return process.env.ComSpec || path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe');
  }
  return '/bin/bash';
}

async function executeShellCommand(command: string, workingDir: string): Promise<{ output: string; error: string }> {
  return new Promise((resolve) => {
    if (!fs.existsSync(workingDir) || !fs.statSync(workingDir).isDirectory()) {
      resolve({
        output: `Working directory not found: ${workingDir}`,
        error: 'Working directory not found',
      });
      return;
    }

    const shell = resolveShell();
    const args = process.platform === 'win32' ? ['/c', command] : ['-c', command];

    const processObj = spawn(shell, args, {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
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
    const resolvedProjectDir = path.resolve(projectDir);
    const safeWorkingDir = resolveSafeWorkingDir(projectDir, cwd);

    if (!(await exists(projectDir))) {
      await mkdir(projectDir, { recursive: true });
    }

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    const trimmed = command.trim();
    let result: { output: string; error: string };
    let nextWorkingDir = safeWorkingDir;

    if (trimmed.startsWith('python ')) {
      const filename = trimmed.substring(7).trim();
      const fullPath = resolveProjectFilePath(filename, safeWorkingDir, projectDir);

      if (!fullPath || !(await exists(fullPath))) {
        return NextResponse.json({
          success: false,
          output: `Python file not found: ${filename}`,
          error: `File not found: ${filename}`,
          cwd: toClientCwd(safeWorkingDir, projectDir),
        });
      }

      const pythonCode = fs.readFileSync(fullPath, 'utf-8');
      result = await executePythonCode(pythonCode, path.dirname(fullPath));
    } else if (trimmed.startsWith('node ')) {
      const filename = trimmed.substring(5).trim();
      const fullPath = resolveProjectFilePath(filename, safeWorkingDir, projectDir);

      if (!fullPath || !(await exists(fullPath))) {
        return NextResponse.json({
          success: false,
          output: `Node.js file not found: ${filename}`,
          error: `File not found: ${filename}`,
          cwd: toClientCwd(safeWorkingDir, projectDir),
        });
      }

      result = await executeShellCommand(`node "${fullPath}"`, path.dirname(fullPath));
    } else if (trimmed === 'ls' || trimmed === 'dir') {
      const listCommand = process.platform === 'win32' ? 'dir /B' : 'ls -la';
      result = await executeShellCommand(listCommand, safeWorkingDir);
    } else if (trimmed === 'cd' || trimmed.startsWith('cd ')) {
      const target = trimmed === 'cd' ? '' : trimmed.substring(3).trim();
      const newDir = resolveCdTarget(safeWorkingDir, target, projectDir);

      if (newDir) {
        nextWorkingDir = newDir;
        const displayPath = toClientCwd(newDir, projectDir);
        result = {
          output: displayPath === '.' ? 'Changed directory to project root' : `Changed directory to ${displayPath}`,
          error: '',
        };
      } else {
        result = {
          output: `Directory not found: ${target || '~'}`,
          error: 'Directory not found',
        };
      }
    } else if (trimmed === 'pwd') {
      result = { output: toClientCwd(safeWorkingDir, projectDir), error: '' };
    } else if (trimmed.startsWith('cat ') || trimmed.startsWith('type ')) {
      const prefixLength = trimmed.startsWith('type ') ? 5 : 4;
      const filename = trimmed.substring(prefixLength).trim();
      const fullPath = resolveProjectFilePath(filename, safeWorkingDir, projectDir);

      if (fullPath && (await exists(fullPath))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        result = { output: content, error: '' };
      } else {
        result = { output: `File not found: ${filename}`, error: 'File not found' };
      }
    } else if (trimmed.startsWith('mkdir ')) {
      const dirname = trimmed.substring(6).trim();
      const fullPath = resolveProjectFilePath(dirname, safeWorkingDir, projectDir);

      if (!fullPath) {
        result = { output: 'Invalid directory path', error: 'Invalid path' };
      } else {
        try {
          await mkdir(fullPath, { recursive: true });
          result = { output: `Directory created: ${toClientCwd(fullPath, projectDir)}`, error: '' };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown mkdir error';
          result = { output: `Error creating directory: ${message}`, error: message };
        }
      }
    } else if (trimmed.startsWith('touch ') || trimmed.startsWith('echo > ')) {
      const filename = trimmed.startsWith('touch ')
        ? trimmed.substring(6).trim()
        : trimmed.substring(7).trim();
      const fullPath = resolveProjectFilePath(filename, safeWorkingDir, projectDir);

      if (!fullPath) {
        result = { output: 'Invalid file path', error: 'Invalid path' };
      } else {
        try {
          await writeFile(fullPath, '', 'utf-8');
          result = { output: `File created: ${toClientCwd(fullPath, projectDir)}`, error: '' };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown touch error';
          result = { output: `Error creating file: ${message}`, error: message };
        }
      }
    } else if (trimmed.startsWith('rm ') || trimmed.startsWith('del ')) {
      const filename = trimmed.startsWith('rm ')
        ? trimmed.substring(3).trim()
        : trimmed.substring(4).trim();
      const fullPath = resolveProjectFilePath(filename, safeWorkingDir, projectDir);

      if (fullPath && (await exists(fullPath))) {
        try {
          await unlink(fullPath);
          result = { output: `File deleted: ${filename}`, error: '' };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown delete error';
          result = { output: `Error deleting file: ${message}`, error: message };
        }
      } else {
        result = { output: `File not found: ${filename}`, error: 'File not found' };
      }
    } else if (trimmed === 'clear' || trimmed === 'cls') {
      result = { output: '[Terminal cleared]', error: '' };
    } else if (trimmed === 'help') {
      const helpText = `Available commands:
  help                    - Show this help
  clear / cls            - Clear terminal
  ls / dir               - List files in current directory
  python <filename.py>   - Run Python file (relative to cwd)
  node <filename.js>     - Run Node.js file (relative to cwd)
  cd [directory]         - Change directory (.., ., ~ supported)
  pwd                    - Print working directory
  cat <filename>         - Show file contents
  mkdir <name>           - Create directory
  touch <filename>       - Create empty file
  rm <filename>          - Delete file
  echo <text>            - Print text
  date                   - Show current date/time

Commands run in the current working directory shown in the prompt.`;
      result = { output: helpText, error: '' };
    } else if (trimmed.startsWith('echo ')) {
      result = { output: trimmed.substring(5), error: '' };
    } else if (trimmed === 'date' || trimmed === 'time') {
      result = { output: new Date().toLocaleString(), error: '' };
    } else {
      result = await executeShellCommand(trimmed, safeWorkingDir);
    }

    return NextResponse.json({
      success: true,
      output: result.output,
      error: result.error,
      cwd: toClientCwd(nextWorkingDir, projectDir),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown terminal error';
    console.error('Terminal execute error:', error);
    return NextResponse.json({
      success: false,
      output: `Error: ${message}`,
      error: message,
    });
  }
}
