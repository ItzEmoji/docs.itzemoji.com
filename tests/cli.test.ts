import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../src/cli.ts";
import type { Spawner } from "../src/build.ts";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "monodocs-cli-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function entry(name: string) {
  return {
    name,
    path: `projects/${name}`,
    buildCommand: "bun run docs:build",
    outputDir: "build",
    title: name,
    description: `${name} docs`,
  };
}

/** Writes the manifest and a pre-built output tree for each project. */
async function seed(names: string[]): Promise<void> {
  await writeFile(
    join(root, "projects.json"),
    JSON.stringify({ projects: names.map(entry) }),
  );
  for (const name of names) {
    const out = join(root, "projects", name, "build");
    await mkdir(out, { recursive: true });
    await writeFile(out.replace(/build$/, "package.json"), "{}");
    await writeFile(join(out, "index.html"), `<h1>${name}</h1>`);
  }
}

const okSpawn: Spawner = async () => ({ exitCode: 0 });

describe("run", () => {
  test("builds every project by default", async () => {
    await seed(["aeroflare", "beacon"]);
    const dist = join(root, "dist");

    await run([], { repoRoot: root, distDir: dist, spawn: okSpawn });

    expect(await Bun.file(join(dist, "aeroflare/index.html")).exists()).toBe(true);
    expect(await Bun.file(join(dist, "beacon/index.html")).exists()).toBe(true);
    const index = await Bun.file(join(dist, "index.html")).text();
    expect(index).toContain('href="/aeroflare/"');
  });

  test("builds only the named project", async () => {
    await seed(["aeroflare", "beacon"]);
    const dist = join(root, "dist");

    await run(["beacon"], { repoRoot: root, distDir: dist, spawn: okSpawn });

    expect(await Bun.file(join(dist, "beacon/index.html")).exists()).toBe(true);
    expect(await Bun.file(join(dist, "aeroflare/index.html")).exists()).toBe(false);
    const index = await Bun.file(join(dist, "index.html")).text();
    expect(index).not.toContain('href="/aeroflare/"');
  });

  test("rejects an unknown project name", async () => {
    await seed(["aeroflare"]);

    await expect(
      run(["nope"], { repoRoot: root, distDir: join(root, "dist"), spawn: okSpawn }),
    ).rejects.toThrow(/unknown project "nope"/);
  });

  test("writes nothing to dist when a build fails", async () => {
    await seed(["aeroflare", "beacon"]);
    const dist = join(root, "dist");
    const failing: Spawner = async (request) => ({
      exitCode: request.prefix === "beacon" && request.command === "bun run docs:build"
        ? 1
        : 0,
    });

    await expect(
      run([], { repoRoot: root, distDir: dist, spawn: failing }),
    ).rejects.toThrow(/beacon: build command failed/);

    expect(await Bun.file(join(dist, "index.html")).exists()).toBe(false);
    expect(await Bun.file(join(dist, "aeroflare/index.html")).exists()).toBe(false);
  });

  test("fails before building when a submodule is not initialised", async () => {
    await seed(["aeroflare"]);
    await rm(join(root, "projects/aeroflare"), { recursive: true, force: true });
    await mkdir(join(root, "projects/aeroflare"), { recursive: true });

    const calls: string[] = [];
    const spawn: Spawner = async (request) => {
      calls.push(request.command);
      return { exitCode: 0 };
    };

    await expect(
      run([], { repoRoot: root, distDir: join(root, "dist"), spawn }),
    ).rejects.toThrow(/git submodule update --init/);
    expect(calls).toEqual([]);
  });

  test("succeeds with an empty manifest", async () => {
    await seed([]);
    const dist = join(root, "dist");

    await run([], { repoRoot: root, distDir: dist, spawn: okSpawn });

    expect(await Bun.file(join(dist, "index.html")).exists()).toBe(true);
  });
});
