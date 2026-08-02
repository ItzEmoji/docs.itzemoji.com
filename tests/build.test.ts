import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  basePathFor,
  buildProject,
  preflight,
  type SpawnRequest,
  type Spawner,
} from "../src/build.ts";
import type { ProjectConfig } from "../src/manifest.ts";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "monodocs-build-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const project: ProjectConfig = {
  name: "aeroflare",
  path: "projects/aeroflare",
  buildCommand: "bun run docs:build",
  outputDir: "build",
  title: "Aeroflare",
  description: "Flight planning toolkit.",
};

/** Records every spawn and reports success. */
function recordingSpawner(): { calls: SpawnRequest[]; spawn: Spawner } {
  const calls: SpawnRequest[] = [];
  return {
    calls,
    spawn: async (request) => {
      calls.push(request);
      return { exitCode: 0 };
    },
  };
}

async function seedSubmodule(options: { lockfile?: boolean; output?: boolean } = {}) {
  const dir = join(root, project.path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "package.json"), "{}");
  if (options.lockfile) await writeFile(join(dir, "bun.lock"), "");
  if (options.output) {
    await mkdir(join(dir, project.outputDir), { recursive: true });
    await writeFile(join(dir, project.outputDir, "index.html"), "<h1>docs</h1>");
  }
}

describe("basePathFor", () => {
  test("wraps the name in slashes", () => {
    expect(basePathFor("aeroflare")).toBe("/aeroflare/");
  });
});

describe("preflight", () => {
  test("passes for a populated submodule", async () => {
    await seedSubmodule();
    await expect(preflight(project, root)).resolves.toBeUndefined();
  });

  test("fails when the directory does not exist", async () => {
    await expect(preflight(project, root)).rejects.toThrow(/does not exist/);
  });

  test("tells the user to init the submodule when the directory is empty", async () => {
    await mkdir(join(root, project.path), { recursive: true });
    await expect(preflight(project, root)).rejects.toThrow(/git submodule update --init/);
  });
});

describe("buildProject", () => {
  test("installs with a frozen lockfile when one exists", async () => {
    await seedSubmodule({ lockfile: true, output: true });
    const { calls, spawn } = recordingSpawner();

    await buildProject(project, { repoRoot: root, spawn });

    expect(calls[0]!.command).toBe("bun install --frozen-lockfile");
  });

  test("falls back to a plain install without a lockfile", async () => {
    await seedSubmodule({ output: true });
    const { calls, spawn } = recordingSpawner();

    await buildProject(project, { repoRoot: root, spawn });

    expect(calls[0]!.command).toBe("bun install");
  });

  test("runs the build command in the submodule with DOCS_BASE_PATH set", async () => {
    await seedSubmodule({ output: true });
    const { calls, spawn } = recordingSpawner();

    await buildProject(project, { repoRoot: root, spawn });

    expect(calls).toHaveLength(2);
    const build = calls[1]!;
    expect(build.command).toBe("bun run docs:build");
    expect(build.cwd).toBe(join(root, project.path));
    expect(build.env.DOCS_BASE_PATH).toBe("/aeroflare/");
    expect(build.prefix).toBe("aeroflare");
  });

  test("inherits the ambient environment", async () => {
    await seedSubmodule({ output: true });
    const { calls, spawn } = recordingSpawner();
    process.env.MONODOCS_TEST_VAR = "present";

    try {
      await buildProject(project, { repoRoot: root, spawn });
      expect(calls[1]!.env.MONODOCS_TEST_VAR).toBe("present");
    } finally {
      delete process.env.MONODOCS_TEST_VAR;
    }
  });

  test("throws when the install fails", async () => {
    await seedSubmodule({ output: true });
    const spawn: Spawner = async (request) => ({
      exitCode: request.command.startsWith("bun install") ? 1 : 0,
    });

    await expect(buildProject(project, { repoRoot: root, spawn })).rejects.toThrow(
      /aeroflare: bun install failed with exit code 1/,
    );
  });

  test("throws when the build command fails", async () => {
    await seedSubmodule({ output: true });
    const spawn: Spawner = async (request) => ({
      exitCode: request.command === project.buildCommand ? 2 : 0,
    });

    await expect(buildProject(project, { repoRoot: root, spawn })).rejects.toThrow(
      /aeroflare: build command failed with exit code 2/,
    );
  });

  test("throws when the build produces no output directory", async () => {
    await seedSubmodule();
    const { spawn } = recordingSpawner();

    await expect(buildProject(project, { repoRoot: root, spawn })).rejects.toThrow(
      /produced no output/,
    );
  });

  test("throws when the output directory has no index.html", async () => {
    await seedSubmodule();
    await mkdir(join(root, project.path, project.outputDir), { recursive: true });
    const { spawn } = recordingSpawner();

    await expect(buildProject(project, { repoRoot: root, spawn })).rejects.toThrow(
      /index\.html/,
    );
  });
});
