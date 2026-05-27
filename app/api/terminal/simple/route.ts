import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Simple terminal API that works without child_process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, projectId = 'default', filePath } = body;
    
    const BASE_DIR = process.cwd();
    const PROJECTS_DIR = path.join(BASE_DIR, 'projects');
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    // Ensure project directory exists
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }
    
    const trimmed = command.trim();
    let output = '';
    
    // Handle basic commands
    if (trimmed === 'help') {
      output = `Available commands:
  help                    - Show this help
  ls                      - List files in project
  cat <filename>          - Show file contents
  python <filename.py>    - Run Python file (simulated)
  node <filename.js>      - Run Node.js file (simulated)
  clear                   - Clear terminal
  pwd                     - Print working directory
  
This is a simulated terminal. Real execution requires proper server setup.`;
    } else if (trimmed === 'ls') {
      // List files in project directory
      const files = fs.readdirSync(projectDir);
      output = files.map(file => {
        const stat = fs.statSync(path.join(projectDir, file));
        return `${stat.isDirectory() ? '📁' : '📄'} ${file}`;
      }).join('\n');
      
      if (files.length === 0) {
        output = 'No files in project';
      }
    } else if (trimmed === 'pwd') {
      output = projectDir;
    } else if (trimmed.startsWith('cat ')) {
      const filename = trimmed.substring(4).trim();
      const filePath = path.join(projectDir, filename);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        output = `=== ${filename} ===\n${content}`;
      } else {
        output = `File not found: ${filename}`;
      }
    } else if (trimmed.startsWith('python ')) {
      const filename = trimmed.substring(7).trim();
      const filePath = path.join(projectDir, filename);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        output = `Simulating Python execution: ${filename}\n`;
        output += `File size: ${content.length} characters\n`;
        
        // Simple analysis
        const lines = content.split('\n').length;
        const functions = (content.match(/def\s+\w+/g) || []).length;
        const prints = (content.match(/print\(/g) || []).length;
        
        output += `Lines: ${lines}, Functions: ${functions}, Print statements: ${prints}\n`;
        output += `\n(Note: This is simulated execution. Real Python execution requires proper server setup.)`;
      } else {
        output = `Python file not found: ${filename}`;
      }
    } else if (trimmed.startsWith('node ')) {
      const filename = trimmed.substring(5).trim();
      const filePath = path.join(projectDir, filename);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        output = `Simulating Node.js execution: ${filename}\n`;
        output += `File size: ${content.length} characters\n`;
        
        // Simple analysis
        const lines = content.split('\n').length;
        const functions = (content.match(/function\s+\w+/g) || []).length;
        const consoleLogs = (content.match(/console\.log\(/g) || []).length;
        
        output += `Lines: ${lines}, Functions: ${functions}, console.log statements: ${consoleLogs}\n`;
        output += `\n(Note: This is simulated execution. Real Node.js execution requires proper server setup.)`;
      } else {
        output = `Node.js file not found: ${filename}`;
      }
    } else if (trimmed === 'clear') {
      output = '[Terminal cleared]';
    } else {
      output = `Command not supported: ${trimmed}\nType 'help' for available commands.`;
    }
    
    return NextResponse.json({
      success: true,
      output,
      error: null
    });
  } catch (error: any) {
    console.error('Simple terminal API error:', error);
    return NextResponse.json({
      success: false,
      output: `Error: ${error.message}`,
      error: error.message
    });
  }
}