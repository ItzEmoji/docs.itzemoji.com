import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectConfig } from "./manifest.ts";

export interface SpawnRequest {
  command: string;
  cwd: string;
  env: Record<string, string>;
  /** Prepended to every output line so interleaved logs stay readable. */
  prefix: string;
}

export interface SpawnResult {
  exitCode: number;
}

export type Spawner = (request: SpawnRequest) => Promise<SpawnResult>;

export interface BuildOptions {
  repoRoot: string;
  spawn?: Spawner;
}

export function basePathFor(name: string): string {
  return `/${name}/`;
}

/**
 * Merges `base` into a clean environment, dropping any entries whose value
 * is `undefined`, then applies `overrides` last so they always win.
 */
export function buildEnv(
  base: Record<string, string | undefined>,
  overrides: Record<string, string>,
): Record<string, string> {
  const filtered = Object.fromEntries(
    Object.entries(base).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );

  return { ...filtered, ...overrides };
}

export async function preflight(
  project: ProjectConfig,
  repoRoot: string,
): Promise<void> {
  const dir = join(repoRoot, project.path);

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    throw new Error(
      `${project.name}: submodule directory ${project.path} does not exist`,
    );
  }

  if (entries.length === 0) {
    throw new Error(
      `${project.name}: submodule directory ${project.path} is empty — run "git submodule update --init --recursive"`,
    );
  }
}

export async function buildProject(
  project: ProjectConfig,
  options: BuildOptions,
): Promise<void> {
  const spawn = options.spawn ?? spawnShell;
  const cwd = join(options.repoRoot, project.path);

  // Defensive guard: callers (e.g. the CLI) typically preflight all projects
  // up front before building any of them, but re-checking here keeps
  // buildProject safe to call on its own without relying on that.
  await preflight(project, options.repoRoot);

  const env = buildEnv(process.env, {
    DOCS_BASE_PATH: basePathFor(project.name),
  });

  const hasLockfile =
    (await Bun.file(join(cwd, "bun.lock")).exists()) ||
    (await Bun.file(join(cwd, "bun.lockb")).exists());
  const install = hasLockfile ? "bun install --frozen-lockfile" : "bun install";

  const installed = await spawn({ command: install, cwd, env, prefix: project.name });
  if (installed.exitCode !== 0) {
    throw new Error(
      `${project.name}: bun install failed with exit code ${installed.exitCode}`,
    );
  }

  const built = await spawn({
    command: project.buildCommand,
    cwd,
    env,
    prefix: project.name,
  });
  if (built.exitCode !== 0) {
    throw new Error(
      `${project.name}: build command failed with exit code ${built.exitCode}`,
    );
  }

  await verifyOutput(project, cwd);
}

async function verifyOutput(project: ProjectConfig, cwd: string): Promise<void> {
  const outputDir = join(cwd, project.outputDir);

  try {
    const info = await stat(outputDir);
    if (!info.isDirectory()) throw new Error("not a directory");
  } catch {
    throw new Error(
      `${project.name}: build succeeded but produced no output at ${project.outputDir}`,
    );
  }

  if (!(await Bun.file(join(outputDir, "index.html")).exists())) {
    throw new Error(
      `${project.name}: ${project.outputDir} contains no index.html`,
    );
  }
}

export const spawnShell: Spawner = async (request) => {
  const proc = Bun.spawn({
    cmd: ["sh", "-c", request.command],
    cwd: request.cwd,
    env: request.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  await Promise.all([
    pipePrefixed(proc.stdout, request.prefix, console.log),
    pipePrefixed(proc.stderr, request.prefix, console.error),
  ]);

  return { exitCode: await proc.exited };
};

export async function pipePrefixed(
  stream: ReadableStream<Uint8Array>,
  prefix: string,
  write: (line: string) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffered = "";

  for await (const chunk of stream) {
    buffered += decoder.decode(chunk, { stream: true });
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines) write(`[${prefix}] ${line}`);
  }

  buffered += decoder.decode();

  if (buffered.length > 0) write(`[${prefix}] ${buffered}`);
}
