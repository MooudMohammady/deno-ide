"use client";

import { useCallback, useState } from "react";

export interface GitFileStatus {
  path: string;
  status: "M" | "A" | "D" | "R";
}

export interface GitStatus {
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
}

/**
 * In-memory Git state management.
 * Requirements: 7.2, 7.3, 7.4, 7.5
 */
export function useGit() {
  const [currentBranch, setCurrentBranch] = useState("main");
  const [branches, setBranches] = useState<string[]>(["main"]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [status, setStatus] = useState<GitStatus>({
    staged: [],
    unstaged: [
      { path: "index.ts", status: "M" },
      { path: "src/app.ts", status: "M" },
    ],
    untracked: ["README.md"],
  });

  const stageFile = useCallback((filePath: string) => {
    setStatus((prev) => {
      const fromUnstaged = prev.unstaged.find((f) => f.path === filePath);
      const fromUntracked = prev.untracked.includes(filePath);

      if (fromUnstaged) {
        return {
          ...prev,
          staged: [...prev.staged, fromUnstaged],
          unstaged: prev.unstaged.filter((f) => f.path !== filePath),
        };
      }
      if (fromUntracked) {
        return {
          ...prev,
          staged: [...prev.staged, { path: filePath, status: "A" }],
          untracked: prev.untracked.filter((f) => f !== filePath),
        };
      }
      return prev;
    });
  }, []);

  const unstageFile = useCallback((filePath: string) => {
    setStatus((prev) => {
      const file = prev.staged.find((f) => f.path === filePath);
      if (!file) return prev;
      const isNew = file.status === "A";
      return {
        ...prev,
        staged: prev.staged.filter((f) => f.path !== filePath),
        unstaged: isNew ? prev.unstaged : [...prev.unstaged, file],
        untracked: isNew ? [...prev.untracked, filePath] : prev.untracked,
      };
    });
  }, []);

  const commit = useCallback((message: string) => {
    const newCommit: GitCommit = {
      hash: Math.random().toString(36).slice(2, 9),
      message,
      author: "Developer",
      date: new Date(),
    };
    setCommits((prev) => [newCommit, ...prev]);
    setStatus((prev) => ({ ...prev, staged: [] }));
  }, []);

  const createBranch = useCallback((name: string) => {
    setBranches((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCurrentBranch(name);
  }, []);

  const checkout = useCallback((branch: string) => {
    if (branches.includes(branch)) {
      setCurrentBranch(branch);
    }
  }, [branches]);

  return {
    status,
    currentBranch,
    branches,
    commits,
    stageFile,
    unstageFile,
    commit,
    createBranch,
    checkout,
  };
}
