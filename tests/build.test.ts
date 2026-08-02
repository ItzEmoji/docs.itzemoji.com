import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  basePathFor,
  buildEnv,
  buildProject,
  pipePrefixed,
  preflight,
  spawnShell,
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

async function seedSubmodule(
  options: { lockfile?: boolean | "bun.lockb"; output?: boolean } = {},
) {
  const dir = join(root, project.path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "package.json"), "{}");
  if (options.lockfile === "bun.lockb") {
    await writeFile(join(dir, "bun.lockb"), "");
  } else if (options.lockfile) {
    await writeFile(join(dir, "bun.lock"), "");
  }
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

describe("buildEnv", () => {
  test("filters out undefined-valued entries from the base environment", () => {
    const result = buildEnv(
      { FOO: "bar", BAZ: undefined },
      { DOCS_BASE_PATH: "/x/" },
    );

    expect(result).toEqual({ FOO: "bar", DOCS_BASE_PATH: "/x/" });
    expect("BAZ" in result).toBe(false);
  });

  test("overrides always win over base entries", () => {
    const result = buildEnv(
      { DOCS_BASE_PATH: "/old/" },
      { DOCS_BASE_PATH: "/new/" },
    );

    expect(result.DOCS_BASE_PATH).toBe("/new/");
  });
});

describe("pipePrefixed", () => {
  function toStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    });
  }

  test("flushes a multi-byte UTF-8 sequence truncated at the end of the stream", async () => {
    // "é" is 0xC3 0xA9 in UTF-8; only the first byte is ever sent, so the
    // decoder holds it internally waiting for a continuation byte that
    // never arrives. Without a final flush those bytes are silently
    // dropped instead of surfacing as a replacement character.
    const chunks = [new TextEncoder().encode("ab"), new Uint8Array([0xc3])];
    const lines: string[] = [];

    await pipePrefixed(toStream(chunks), "test", (line) => lines.push(line));

    expect(lines).toEqual(["[test] ab�"]);
  });
});

describe("spawnShell", () => {
  test("runs a command and prefixes its output", async () => {
    const originalLog = console.log;
    const lines: string[] = [];
    console.log = (line: string) => lines.push(line);

    try {
      const result = await spawnShell({
        command: "echo hi",
        cwd: root,
        env: {},
        prefix: "smoke",
      });

      expect(result.exitCode).toBe(0);
      expect(lines).toContain("[smoke] hi");
    } finally {
      console.log = originalLog;
    }
  });

  test("reports a non-zero exit code", async () => {
    const originalLog = console.log;
    console.log = () => {};

    try {
      const result = await spawnShell({
        command: "exit 3",
        cwd: root,
        env: {},
        prefix: "smoke",
      });

      expect(result.exitCode).toBe(3);
    } finally {
      console.log = originalLog;
    }
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

  test("installs with a frozen lockfile when a binary bun.lockb exists", async () => {
    await seedSubmodule({ lockfile: "bun.lockb", output: true });
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
