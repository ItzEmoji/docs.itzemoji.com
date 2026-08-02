import { join } from "node:path";
import { assemble } from "./assemble.ts";
import { buildProject, preflight, type Spawner } from "./build.ts";
import { loadManifest, selectProjects } from "./manifest.ts";

export interface RunOptions {
  repoRoot: string;
  manifestPath?: string;
  distDir?: string;
  spawn?: Spawner;
  log?: (message: string) => void;
}

export async function run(names: string[], options: RunOptions): Promise<void> {
  const manifestPath = options.manifestPath ?? join(options.repoRoot, "projects.json");
  const distDir = options.distDir ?? join(options.repoRoot, "dist");
  const log = options.log ?? console.log;

  const manifest = await loadManifest(manifestPath);
  const projects = selectProjects(manifest, names);

  // Check every submodule before building any of them, so a missing checkout
  // fails in seconds instead of after the first slow build.
  for (const project of projects) {
    await preflight(project, options.repoRoot);
  }

  for (const [index, project] of projects.entries()) {
    log(`\n→ building ${project.name} (${index + 1}/${projects.length})`);
    await buildProject(project, { repoRoot: options.repoRoot, spawn: options.spawn });
  }

  await assemble(projects, { repoRoot: options.repoRoot, distDir });
  log(`\n✓ ${projects.length} project(s) assembled into ${distDir}`);
}

if (import.meta.main) {
  try {
    await run(process.argv.slice(2), { repoRoot: process.cwd() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n✗ ${message}`);
    process.exit(1);
  }
}
