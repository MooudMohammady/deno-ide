"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

interface SimpleTerminalProps {
  theme?: "dark" | "light";
  fileSystem?: {
    getContent: (fileId: string) => string;
    fileMap: Record<string, any>;
  };
  onExecutePython?: (filename: string, code?: string) => Promise<string>;
}

export default function SimpleTerminal({ theme = "dark", fileSystem, onExecutePython }: SimpleTerminalProps) {
  const isDark = theme === "dark";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([
    "Simple Terminal v1.0",
    "Type 'help' for available commands",
    "Type 'python <filename>' to run Python files",
    ""
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const executeCommand = async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) {
      setOutput(prev => [...prev, "$ "]);
      return;
    }

    // Add command to output
    setOutput(prev => [...prev, `$ ${trimmed}`]);

    // Execute command
    let result = "";
    
    if (trimmed === "help") {
      result = "Available commands:\n" +
               "  help                    - Show this help\n" +
               "  clear                   - Clear terminal\n" +
               "  ls                      - List files\n" +
               "  python <filename.py>    - Run Python file\n" +
               "  node/js <filename>      - Run JavaScript/TypeScript file\n" +
               "  run <filename>          - Run any supported file\n" +
               "  cat <filename>          - Show file contents\n" +
               "  echo <text>             - Print text\n" +
               "  date                    - Show current date\n" +
               "\nSupported file types for execution:\n" +
               "  .py  - Python files\n" +
               "  .js  - JavaScript files\n" +
               "  .ts  - TypeScript files\n" +
               "  .html - HTML files\n" +
               "  .css  - CSS files\n" +
               "  .json - JSON files";
    } else if (trimmed === "clear") {
      setOutput(["Terminal cleared", ""]);
      return;
    } else if (trimmed === "ls") {
      if (fileSystem && fileSystem.fileMap) {
        // Get all files from file system
        const files = Object.values(fileSystem.fileMap);
        const fileNames = files.map((file: any) => {
          const prefix = file.type === "directory" ? "📁 " : "📄 ";
          return prefix + file.name + (file.type === "directory" ? "/" : "");
        });
        result = fileNames.join("\n");
        if (fileNames.length === 0) {
          result = "No files in project";
        }
      } else {
        result = "index.ts\nREADME.md\nsrc/\napp.py\nhello.py\ntest.py";
      }
    } else if (trimmed === "date") {
      result = new Date().toLocaleString();
    } else if (trimmed.startsWith("echo ")) {
      result = trimmed.substring(5);
    } else if (trimmed.startsWith("cat ")) {
      const filename = trimmed.substring(4).trim();
      if (fileSystem && fileSystem.fileMap && fileSystem.getContent) {
        // Find the file in fileMap
        const fileEntry = Object.values(fileSystem.fileMap).find(
          (file: any) => file.name === filename && file.type === "file"
        );
        
        if (fileEntry) {
          const content = fileSystem.getContent((fileEntry as any).id);
          result = `=== ${filename} ===\n${content}`;
        } else {
          // List available files
          const files = Object.values(fileSystem.fileMap)
            .filter((file: any) => file.type === "file")
            .map((file: any) => file.name);
          
          if (files.length > 0) {
            result = `File not found: ${filename}\nAvailable files:\n`;
            result += files.map(name => `  - ${name}`).join("\n");
          } else {
            result = `File not found: ${filename}\nNo files in project.`;
          }
        }
      } else {
        result = `Cannot read file: ${filename}\nFile system not available.`;
      }
    } else if (trimmed.startsWith("python ")) {
      const filename = trimmed.substring(7).trim();
      if (filename.endsWith(".py")) {
        result = `Running Python file: ${filename}\n`;
        
        let pythonCode = "";
        let fileFound = false;
        
        // Try to get Python code from file system
        if (fileSystem && fileSystem.fileMap && fileSystem.getContent) {
          // Find the file in fileMap
          const fileEntry = Object.values(fileSystem.fileMap).find(
            (file: any) => file.name === filename && file.type === "file"
          );
          
          if (fileEntry) {
            pythonCode = fileSystem.getContent((fileEntry as any).id);
            fileFound = true;
            result += `Found file in project: ${filename}\n`;
            result += `Code length: ${pythonCode.length} characters\n`;
          } else {
            // List available Python files
            const pythonFiles = Object.values(fileSystem.fileMap)
              .filter((file: any) => file.type === "file" && file.name.endsWith(".py"))
              .map((file: any) => file.name);
            
            if (pythonFiles.length > 0) {
              result += `File not found. Available Python files:\n`;
              result += pythonFiles.map(name => `  - ${name}`).join("\n");
            } else {
              result += `File not found. No Python files in project.\n`;
            }
          }
        }
        
        // If file was found, try to execute it
        if (fileFound) {
          // If we have a real Python execution function, call it
          if (onExecutePython) {
            try {
              const pythonResult = await onExecutePython(filename, pythonCode);
              result += `\n${pythonResult}`;
            } catch (error: any) {
              result += `\nError: ${error.message || error}`;
            }
          } else {
            // Simulate Python execution
            result += simulatePythonExecution(filename, pythonCode);
          }
        }
      } else {
        result = "Please specify a .py file (e.g., 'python hello.py')";
      }
    } else if (trimmed.startsWith("node ") || trimmed.startsWith("js ")) {
      const filename = trimmed.substring(trimmed.startsWith("node ") ? 5 : 3).trim();
      if (filename.endsWith(".js") || filename.endsWith(".ts")) {
        result = `Running JavaScript/TypeScript file: ${filename}\n`;
        
        let jsCode = "";
        let fileFound = false;
        
        // Try to get JavaScript code from file system
        if (fileSystem && fileSystem.fileMap && fileSystem.getContent) {
          // Find the file in fileMap
          const fileEntry = Object.values(fileSystem.fileMap).find(
            (file: any) => file.name === filename && file.type === "file"
          );
          
          if (fileEntry) {
            jsCode = fileSystem.getContent((fileEntry as any).id);
            fileFound = true;
            result += `Found file in project: ${filename}\n`;
            result += `Code length: ${jsCode.length} characters\n`;
          } else {
            // List available JS/TS files
            const jsFiles = Object.values(fileSystem.fileMap)
              .filter((file: any) => file.type === "file" && (file.name.endsWith(".js") || file.name.endsWith(".ts")))
              .map((file: any) => file.name);
            
            if (jsFiles.length > 0) {
              result += `File not found. Available JavaScript/TypeScript files:\n`;
              result += jsFiles.map(name => `  - ${name}`).join("\n");
            } else {
              result += `File not found. No JavaScript/TypeScript files in project.\n`;
            }
          }
        }
        
        // If file was found, simulate execution
        if (fileFound) {
          result += simulateJavaScriptExecution(filename, jsCode);
        }
      } else {
        result = "Please specify a .js or .ts file (e.g., 'node index.js' or 'js app.ts')";
      }
    } else if (trimmed.startsWith("run ")) {
      const filename = trimmed.substring(4).trim();
      result = `Running file: ${filename}\n`;
      
      let fileContent = "";
      let fileFound = false;
      
      // Try to get file from file system
      if (fileSystem && fileSystem.fileMap && fileSystem.getContent) {
        // Find the file in fileMap
        const fileEntry = Object.values(fileSystem.fileMap).find(
          (file: any) => file.name === filename && file.type === "file"
        );
        
        if (fileEntry) {
          fileContent = fileSystem.getContent((fileEntry as any).id);
          fileFound = true;
          result += `Found file in project: ${filename}\n`;
          result += `Code length: ${fileContent.length} characters\n`;
          
          // Determine file type and execute accordingly
          if (filename.endsWith(".py")) {
            if (onExecutePython) {
              try {
                const pythonResult = await onExecutePython(filename, fileContent);
                result += `\n${pythonResult}`;
              } catch (error: any) {
                result += `\nError: ${error.message || error}`;
              }
            } else {
              result += simulatePythonExecution(filename, fileContent);
            }
          } else if (filename.endsWith(".js") || filename.endsWith(".ts")) {
            result += simulateJavaScriptExecution(filename, fileContent);
          } else if (filename.endsWith(".html")) {
            result += simulateHTMLExecution(filename, fileContent);
          } else if (filename.endsWith(".css")) {
            result += simulateCSSExecution(filename, fileContent);
          } else if (filename.endsWith(".json")) {
            result += simulateJSONExecution(filename, fileContent);
          } else {
            result += `File type not supported for execution: ${filename}\n`;
            result += `Supported types: .py, .js, .ts, .html, .css, .json`;
          }
        } else {
          // List all available files
          const allFiles = Object.values(fileSystem.fileMap)
            .filter((file: any) => file.type === "file")
            .map((file: any) => file.name);
          
          if (allFiles.length > 0) {
            result += `File not found. Available files:\n`;
            result += allFiles.map(name => `  - ${name}`).join("\n");
          } else {
            result += `File not found. No files in project.\n`;
          }
        }
      } else {
        result = `Cannot run file: ${filename}\nFile system not available.`;
      }
    } else {
      result = `Command not found: ${trimmed}`;
    }

    // Add result to output
    setOutput(prev => [...prev, result, ""]);
  };

  const simulatePythonExecution = (filename: string, code: string): string => {
    let result = "Simulating Python execution...\n";
    
    // Analyze the code
    const lines = code.split('\n').length;
    const functions = (code.match(/def\s+\w+/g) || []).length;
    const classes = (code.match(/class\s+\w+/g) || []).length;
    const imports = (code.match(/import\s+\w+/g) || []).length;
    const prints = (code.match(/print\(/g) || []).length;
    
    result += `Analysis: ${lines} lines, ${functions} functions, ${classes} classes, ${imports} imports, ${prints} print statements\n`;
    
    // Simulate output based on common patterns
    if (code.includes('print("Hello"') || code.includes("print('Hello")) {
      result += "Hello, World!\n";
    }
    
    if (code.includes('def main()') || code.includes('def test()')) {
      result += "Main/test function detected and executed\n";
    }
    
    if (code.includes('import unittest') || code.includes('import test')) {
      result += "Test framework detected - running tests...\n";
      result += "All tests passed! ✅\n";
    }
    
    result += "Python execution completed successfully.\n";
    result += "(Note: This is simulated execution. In a real environment, Python would actually run the code.)";
    
    return result;
  };

  const simulateJavaScriptExecution = (filename: string, code: string): string => {
    let result = "Simulating JavaScript/TypeScript execution...\n";
    
    // Analyze the code
    const lines = code.split('\n').length;
    const functions = (code.match(/function\s+\w+/g) || []).length;
    const arrowFunctions = (code.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;
    const classes = (code.match(/class\s+\w+/g) || []).length;
    const imports = (code.match(/import\s+[^;]+/g) || []).length;
    const consoleLogs = (code.match(/console\.log\(/g) || []).length;
    
    result += `Analysis: ${lines} lines, ${functions} functions, ${arrowFunctions} arrow functions, ${classes} classes, ${imports} imports, ${consoleLogs} console.log statements\n`;
    
    // Simulate output based on common patterns
    if (code.includes('console.log("Hello"') || code.includes("console.log('Hello")) {
      result += "Hello, World!\n";
    }
    
    if (code.includes('export default') || code.includes('module.exports')) {
      result += "Module export detected\n";
    }
    
    if (code.includes('React') || code.includes('react')) {
      result += "React component detected - rendering...\n";
      result += "Component rendered successfully! 🎉\n";
    }
    
    result += "JavaScript/TypeScript execution completed successfully.\n";
    result += "(Note: This is simulated execution. In a real environment, Node.js would actually run the code.)";
    
    return result;
  };

  const simulateHTMLExecution = (filename: string, code: string): string => {
    let result = "Simulating HTML file...\n";
    
    // Analyze the code
    const lines = code.split('\n').length;
    const tags = (code.match(/<[^>]+>/g) || []).length;
    const divs = (code.match(/<div/g) || []).length;
    const scripts = (code.match(/<script/g) || []).length;
    const styles = (code.match(/<style/g) || []).length;
    
    result += `Analysis: ${lines} lines, ${tags} HTML tags, ${divs} divs, ${scripts} scripts, ${styles} style tags\n`;
    
    // Simulate browser rendering
    result += "Opening in browser...\n";
    result += "Page loaded successfully! 🌐\n";
    result += "Title: " + (code.match(/<title>([^<]+)<\/title>/)?.[1] || "Untitled") + "\n";
    
    const bodyContent = code.match(/<body>([\s\S]*?)<\/body>/)?.[1] || "";
    if (bodyContent.trim()) {
      result += "Body content detected\n";
    }
    
    result += "HTML file processed successfully.\n";
    
    return result;
  };

  const simulateCSSExecution = (filename: string, code: string): string => {
    let result = "Simulating CSS file...\n";
    
    // Analyze the code
    const lines = code.split('\n').length;
    const rules = (code.match(/[^{]+\{[^}]*\}/g) || []).length;
    const classes = (code.match(/\.\w+/g) || []).length;
    const ids = (code.match(/#\w+/g) || []).length;
    const properties = (code.match(/[a-zA-Z-]+:/g) || []).length;
    
    result += `Analysis: ${lines} lines, ${rules} CSS rules, ${classes} classes, ${ids} IDs, ${properties} properties\n`;
    
    // Simulate styling application
    result += "Applying styles...\n";
    result += "Styles applied successfully! 🎨\n";
    
    // Check for common properties
    if (code.includes('color:')) result += "✓ Color styles found\n";
    if (code.includes('font-size:')) result += "✓ Font size styles found\n";
    if (code.includes('margin:') || code.includes('padding:')) result += "✓ Layout styles found\n";
    if (code.includes('background:')) result += "✓ Background styles found\n";
    
    result += "CSS file processed successfully.\n";
    
    return result;
  };

  const simulateJSONExecution = (filename: string, code: string): string => {
    let result = "Simulating JSON file...\n";
    
    try {
      const json = JSON.parse(code);
      const keys = Object.keys(json);
      
      result += `JSON parsed successfully! ✅\n`;
      result += `Type: ${Array.isArray(json) ? 'Array' : 'Object'}\n`;
      result += `Size: ${keys.length} ${Array.isArray(json) ? 'elements' : 'properties'}\n`;
      
      if (Array.isArray(json)) {
        result += `Array length: ${json.length}\n`;
        if (json.length > 0) {
          result += `First element type: ${typeof json[0]}\n`;
        }
      } else {
        result += `Properties: ${keys.join(', ')}\n`;
        if (keys.length > 0) {
          result += `Sample values:\n`;
          keys.slice(0, 3).forEach(key => {
            const value = json[key];
            result += `  ${key}: ${typeof value}${typeof value === 'object' ? ' (object)' : ` = ${JSON.stringify(value).slice(0, 50)}`}\n`;
          });
        }
      }
      
      result += "JSON file validated successfully.\n";
    } catch (error: any) {
      result += `JSON parsing error: ${error.message}\n`;
      result += "Invalid JSON format.\n";
    }
    
    return result;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      // Could implement command history here
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-[#1e1e1e] text-zinc-100" : "bg-white text-zinc-900"}`}>
      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm whitespace-pre-wrap"
        style={{ fontFamily: "monospace" }}
      >
        {output.map((line, index) => (
          <div key={index} className="mb-1">
            {line}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className={`flex items-center p-3 border-t ${isDark ? "border-[#3c3c3c]" : "border-zinc-300"}`}>
        <span className="mr-2 text-green-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent border-none outline-none font-mono text-sm ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
          placeholder="Type a command..."
          spellCheck="false"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>

      {/* Help text */}
      <div className={`p-2 text-xs border-t ${isDark ? "border-[#3c3c3c] text-zinc-400" : "border-zinc-300 text-zinc-500"}`}>
        Press Enter to execute command. Try: help, ls, python hello.py
      </div>
    </div>
  );
}