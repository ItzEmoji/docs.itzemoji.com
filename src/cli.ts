import { join } from "node:path";
import { assemble } from "./assemble.ts";
import { loadManifest } from "./manifest.ts";

export interface RunOptions {
  repoRoot: string;
  manifestPath?: string;
  distDir?: string;
  log?: (message: string) => void;
}

export async function run(options: RunOptions): Promise<void> {
  const manifestPath = options.manifestPath ?? join(options.repoRoot, "projects.json");
  const distDir = options.distDir ?? join(options.repoRoot, "dist");
  const log = options.log ?? console.log;

  const projects = await loadManifest(manifestPath);
  await assemble(projects, distDir);
  log(`✓ landing page for ${projects.length} project(s) and 404 page written to ${distDir}`);
}

if (import.meta.main) {
  try {
    await run({ repoRoot: process.cwd() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${message}`);
    process.exit(1);
  }
}
