"use client";

import { ChangeEvent, useRef, useState } from "react";

interface FileUploaderProps {
  theme?: "dark" | "light";
  onFilesUploaded: (files: Array<{ name: string; content: string; type: string }>) => void;
  onFolderUploaded?: (folderName: string, files: Array<{ path: string; name: string; content: string; type: string }>) => void;
}

export default function FileUploader({ theme = "dark", onFilesUploaded, onFolderUploaded }: FileUploaderProps) {
  const isDark = theme === "dark";
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFolderSelect = () => {
    folderInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const uploadedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await readFileAsText(file);
      uploadedFiles.push({
        name: file.name,
        content,
        type: file.type || getFileType(file.name)
      });
    }

    onFilesUploaded(uploadedFiles);
  };

  const handleFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const folderFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await readFileAsText(file);
      folderFiles.push({
        path: file.webkitRelativePath || file.name,
        name: file.name,
        content,
        type: file.type || getFileType(file.name)
      });
    }

    if (folderFiles.length > 0 && onFolderUploaded) {
      const folderName = folderFiles[0].path.split('/')[0] || 'Uploaded Folder';
      onFolderUploaded(folderName, folderFiles);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': case 'ts': case 'jsx': case 'tsx': return 'javascript';
      case 'html': case 'htm': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'txt': return 'text';
      default: return 'text';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const uploadedFiles = [];

    for (const file of files) {
      const content = await readFileAsText(file);
      uploadedFiles.push({
        name: file.name,
        content,
        type: file.type || getFileType(file.name)
      });
    }

    onFilesUploaded(uploadedFiles);
  };

  return (
    <div className="p-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? isDark
              ? "border-blue-400 bg-blue-900/20"
              : "border-blue-500 bg-blue-100"
            : isDark
              ? "border-[#3c3c3c] hover:border-blue-400"
              : "border-zinc-300 hover:border-blue-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <div className="text-4xl mb-2 opacity-60">📁</div>
        <p className={`text-sm mb-2 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
          Drag & drop files here or click to browse
        </p>
        <p className={`text-xs opacity-60 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
          Supports: .py, .js, .ts, .html, .css, .json, .txt, .md
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleFileSelect}
          className={`flex-1 py-2 px-4 text-sm rounded border ${
            isDark
              ? "bg-[#323233] border-[#3c3c3c] text-zinc-200 hover:bg-[#3c3c3c]"
              : "bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200"
          }`}
        >
          📄 Select Files
        </button>
        <button
          onClick={handleFolderSelect}
          className={`flex-1 py-2 px-4 text-sm rounded border ${
            isDark
              ? "bg-[#323233] border-[#3c3c3c] text-zinc-200 hover:bg-[#3c3c3c]"
              : "bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200"
          }`}
        >
          📁 Select Folder
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept=".py,.js,.ts,.jsx,.tsx,.html,.css,.json,.txt,.md"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        multiple
        className="hidden"
        // @ts-ignore - webkitdirectory is non-standard but widely supported
        webkitdirectory="true"
        mozdirectory="true"
        directory="true"
      />

      <div className={`mt-4 p-3 rounded text-xs ${isDark ? "bg-[#252526] text-zinc-400" : "bg-zinc-100 text-zinc-600"}`}>
        <p className="font-semibold mb-1">💡 How it works:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Upload Python files to edit and run them in the terminal</li>
          <li>Files are stored in browser memory (refresh will clear them)</li>
          <li>Use "python filename.py" in terminal to execute Python files</li>
          <li>Create new files using the Explorer's "+f" button</li>
        </ul>
      </div>
    </div>
  );
}