"use client";

import { useCallback, useEffect, useState } from "react";
import type { FileNode } from "../types";

interface FileSystemResponse {
  type: 'file' | 'directory';
  name: string;
  path: string;
  content?: string;
  children?: FileSystemResponse[];
  size: number;
  lastModified: string;
}

/**
 * React hook for managing file system with server-side API
 * Requirements: 2.3, 2.4, 2.5
 */
export function useFileSystem(projectId: string = 'default') {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [fileMap, setFileMap] = useState<Record<string, FileNode>>({});
  const [contents, setContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Convert API response to FileNode
  const convertToFileNode = (data: FileSystemResponse, parentPath: string = ''): FileNode => {
    const nodeId = `node-${data.path.replace(/\//g, '-')}`;
    const node: FileNode = {
      id: nodeId,
      name: data.name,
      path: data.path,
      type: data.type,
      size: data.size,
      lastModified: new Date(data.lastModified)
    };

    if (data.type === 'directory' && data.children) {
      node.children = data.children.map(child => convertToFileNode(child, data.path));
    }

    // Store content if it's a file
    if (data.type === 'file' && data.content !== undefined) {
      setContents(prev => ({ ...prev, [nodeId]: data.content || '' }));
    }

    return node;
  };

  // Build file map from root
  const buildFileMapFromRoot = (node: FileNode): Record<string, FileNode> => {
    const map: Record<string, FileNode> = {};
    
    const walk = (current: FileNode) => {
      map[current.id] = current;
      if (current.children) {
        current.children.forEach(walk);
      }
    };
    
    walk(node);
    return map;
  };

  // Load file system from server
  const loadFileSystem = useCallback(async (path: string = '/') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?projectId=${projectId}&path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load file system: ${response.statusText}`);
      }
      
      const data: FileSystemResponse = await response.json();
      const fileNode = convertToFileNode(data);
      
      setRoot(fileNode);
      setFileMap(buildFileMapFromRoot(fileNode));
      return fileNode;
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading file system:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load initial file system
  useEffect(() => {
    loadFileSystem();
  }, [loadFileSystem]);

  // Create file on server
  const createFile = useCallback(async (parentPath: string, name: string, type: "file" | "directory") => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'file' ? 'createFile' : 'createDirectory',
          projectId,
          path: `${parentPath}/${name}`.replace(/\/\//g, '/'),
          content: type === 'file' ? '' : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${type}`);
      }

      // Reload the file system
      await loadFileSystem();
      
      // Create a temporary node for immediate UI feedback
      const tempId = `temp-${Date.now()}`;
      const tempNode: FileNode = {
        id: tempId,
        name,
        path: `${parentPath}/${name}`.replace(/\/\//g, '/'),
        type,
        size: 0,
        lastModified: new Date()
      };

      if (type === 'file') {
        setContents(prev => ({ ...prev, [tempId]: '' }));
      }

      return tempNode;
    } catch (err: any) {
      setError(err.message);
      console.error(`Error creating ${type}:`, err);
      return null;
    }
  }, [projectId, loadFileSystem]);

  // Delete file/directory on server
  const deleteFile = useCallback(async (node: FileNode) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          projectId,
          path: node.path
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      // Reload the file system
      await loadFileSystem();
      
      // Remove from local state
      setContents(prev => {
        const next = { ...prev };
        delete next[node.id];
        return next;
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting file:', err);
    }
  }, [projectId, loadFileSystem]);

  // Rename file/directory on server
  const renameFile = useCallback(async (node: FileNode, newName: string) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          projectId,
          path: node.path,
          newName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rename');
      }

      // Reload the file system
      await loadFileSystem();
    } catch (err: any) {
      setError(err.message);
      console.error('Error renaming file:', err);
    }
  }, [projectId, loadFileSystem]);

  // Update file content on server
  const updateContent = useCallback(async (fileId: string, content: string) => {
    try {
      const node = fileMap[fileId];
      if (!node) {
        throw new Error('File not found');
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateFile',
          projectId,
          path: node.path,
          content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update file');
      }

      // Update local content
      setContents(prev => ({ ...prev, [fileId]: content }));
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating file content:', err);
    }
  }, [projectId, fileMap]);

  // Get file content (from local cache or server)
  const getContent = useCallback(async (fileId: string): Promise<string> => {
    // Check local cache first
    if (contents[fileId] !== undefined) {
      return contents[fileId];
    }

    // Fetch from server if not in cache
    const node = fileMap[fileId];
    if (!node) {
      console.warn('File node not found:', fileId);
      return '';
    }

    try {
      console.log('Fetching file content:', node.path);
      const response = await fetch(`/api/files?projectId=${projectId}&path=${encodeURIComponent(node.path)}`);
      
      if (!response.ok) {
        console.error('Failed to fetch file content:', response.status, response.statusText);
        return '';
      }
      
      const data: FileSystemResponse = await response.json();
      const content = data.content || '';
      
      console.log('File content loaded:', node.path, 'length:', content.length);
      
      // Update cache
      setContents(prev => ({ ...prev, [fileId]: content }));
      
      return content;
    } catch (err: any) {
      console.error('Error getting file content:', err);
      return '';
    }
  }, [projectId, fileMap, contents]);

  // Upload files to server
  const uploadFiles = useCallback(async (files: Array<{ name: string; content: string; type: string }>) => {
    try {
      const uploadPromises = files.map(file => 
        fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload',
            projectId,
            path: `/uploads/${file.name}`,
            content: file.content
          })
        })
      );

      const responses = await Promise.all(uploadPromises);
      const allSuccess = responses.every(r => r.ok);

      if (allSuccess) {
        // Reload file system
        await loadFileSystem();
        return { success: true };
      } else {
        throw new Error('Some files failed to upload');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error uploading files:', err);
      return { success: false, error: err.message };
    }
  }, [projectId, loadFileSystem]);

  return {
    root,
    fileMap,
    contents,
    loading,
    error,
    createFile,
    deleteFile,
    renameFile,
    updateContent,
    getContent,
    uploadFiles,
    loadFileSystem
  };
}
