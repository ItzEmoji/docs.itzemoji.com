import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { renderIndexPage } from "./index-page.ts";
import type { ProjectConfig } from "./manifest.ts";

export interface AssembleOptions {
  repoRoot: string;
  distDir: string;
}

export async function assemble(
  projects: ProjectConfig[],
  options: AssembleOptions,
): Promise<void> {
  const { repoRoot, distDir } = options;

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const project of projects) {
    const source = join(repoRoot, project.path, project.outputDir);
    await cp(source, join(distDir, project.name), { recursive: true });
  }

  await Bun.write(join(distDir, "index.html"), renderIndexPage(projects));
}
