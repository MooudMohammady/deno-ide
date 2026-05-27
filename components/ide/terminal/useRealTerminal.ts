"use client";

import { useCallback, useEffect, useState } from "react";

interface TerminalResponse {
  success: boolean;
  output: string;
  error?: string;
  sessionId?: string;
  cwd?: string;
  files?: Array<{ name: string; type: string }>;
}

interface TerminalSession {
  id: string;
  cwd: string;
  createdAt: string;
  history: string[];
}

/**
 * React hook for real terminal using Next.js API routes
 */
export function useRealTerminal(projectId: string = 'default') {
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');

  // Initialize terminal session
  const initializeSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createSession',
          projectId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create terminal session');
      }

      const data: TerminalResponse = await response.json();
      
      if (data.success && data.sessionId) {
        const newSession: TerminalSession = {
          id: data.sessionId,
          cwd: data.cwd || '/',
          createdAt: new Date().toISOString(),
          history: []
        };
        
        setSession(newSession);
        setCurrentDirectory(data.cwd || '/');
        setOutput([`Terminal session started (${newSession.id})`, `Current directory: ${data.cwd || '/'}`, '']);
        return newSession;
      } else {
        throw new Error('Failed to create session');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error initializing terminal:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Execute command using new execute API
  const executeCommand = useCallback(async (command: string) => {
    setLoading(true);
    setError(null);
    
    // Add command to output
    setOutput(prev => [...prev, `$ ${command}`]);

    try {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          projectId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute command');
      }

      const data: TerminalResponse = await response.json();
      
      // Update output
      if (data.output) {
        setOutput(prev => [...prev, data.output, '']);
      }
      
      // Show error if any
      if (data.error) {
        setOutput(prev => [...prev, `Error: ${data.error}`, '']);
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = `Error: ${err.message}`;
      setError(err.message);
      setOutput(prev => [...prev, errorMessage, '']);
      return { success: false, output: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Execute Python file
  const executePythonFile = useCallback(async (filePath: string) => {
    return executeCommand(`python ${filePath}`);
  }, [executeCommand]);

  // Execute Node.js file
  const executeNodeFile = useCallback(async (filePath: string) => {
    setLoading(true);
    setError(null);
    
    setOutput(prev => [...prev, `$ node ${filePath}`]);

    try {
      const response = await fetch('/api/terminal/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `node ${filePath}`,
          projectId,
          filePath
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute Node.js file');
      }

      const data: TerminalResponse = await response.json();
      
      if (data.output) {
        setOutput(prev => [...prev, data.output, '']);
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = `Error: ${err.message}`;
      setError(err.message);
      setOutput(prev => [...prev, errorMessage, '']);
      return { success: false, output: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // List files in current directory
  const listFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    setOutput(prev => [...prev, '$ ls']);

    try {
      const response = await fetch('/api/terminal/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'ls',
          projectId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to list files');
      }

      const data: TerminalResponse = await response.json();
      
      if (data.output) {
        setOutput(prev => [...prev, data.output, '']);
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = `Error: ${err.message}`;
      setError(err.message);
      setOutput(prev => [...prev, errorMessage, '']);
      return { success: false, output: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Clear terminal output
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  // Close session
  const closeSession = useCallback(async () => {
    if (!session) return;

    try {
      await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'closeSession',
          sessionId: session.id
        })
      });
    } catch (err) {
      console.error('Error closing session:', err);
    } finally {
      setSession(null);
      setOutput([]);
      setCurrentDirectory('/');
    }
  }, [session]);

  // Initialize on mount
  useEffect(() => {
    setOutput([
      'Simple Terminal v1.0',
      'Connected to server file system',
      'Type "help" for available commands',
      ''
    ]);
  }, []);

  return {
    session,
    output,
    loading,
    error,
    currentDirectory,
    executeCommand,
    executePythonFile,
    executeNodeFile,
    listFiles,
    clearOutput,
    closeSession,
    initializeSession
  };
}