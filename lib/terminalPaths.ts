import fs from "fs";
import path from "path";

/** Resolve client-provided cwd to an absolute path inside the project directory. */
export function resolveSafeWorkingDir(projectDir: string, cwd?: string): string {
  const resolvedProjectDir = path.resolve(projectDir);

  if (!cwd || cwd.trim() === "" || cwd === "." || cwd === "/" || cwd === "~") {
    return resolvedProjectDir;
  }

  const normalized = cwd.replace(/\\/g, "/").replace(/^\//, "");
  const requested = path.isAbsolute(cwd)
    ? path.resolve(cwd)
    : path.resolve(resolvedProjectDir, normalized);

  if (!requested.startsWith(resolvedProjectDir)) {
    return resolvedProjectDir;
  }

  if (fs.existsSync(requested) && fs.statSync(requested).isDirectory()) {
    return requested;
  }

  return resolvedProjectDir;
}

/** Convert absolute project path to a client-facing relative cwd. */
export function toClientCwd(absPath: string, projectDir: string): string {
  const rel = path.relative(path.resolve(projectDir), path.resolve(absPath));
  if (!rel || rel === "") return ".";
  return rel.replace(/\\/g, "/");
}

/** Resolve `cd` target relative to the current working directory. */
export function resolveCdTarget(
  currentDir: string,
  target: string,
  projectDir: string
): string | null {
  const resolvedProject = path.resolve(projectDir);
  const trimmed = target.trim();

  let next: string;
  if (!trimmed || trimmed === "~") {
    next = resolvedProject;
  } else if (path.isAbsolute(trimmed)) {
    next = path.resolve(trimmed);
  } else {
    next = path.resolve(currentDir, trimmed);
  }

  if (!next.startsWith(resolvedProject)) {
    return null;
  }

  if (!fs.existsSync(next) || !fs.statSync(next).isDirectory()) {
    return null;
  }

  return next;
}

/** Resolve a user-provided file path against the current working directory. */
export function resolveProjectFilePath(
  fileRef: string,
  workingDir: string,
  projectDir: string
): string | null {
  const resolvedProject = path.resolve(projectDir);
  const fullPath = path.isAbsolute(fileRef)
    ? path.resolve(fileRef)
    : path.resolve(workingDir, fileRef);

  if (!fullPath.startsWith(resolvedProject)) {
    return null;
  }

  return fullPath;
}
