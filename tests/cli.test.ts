import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../src/cli.ts";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "monodocs-cli-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function seed(names: string[]): Promise<void> {
  await writeFile(
    join(root, "projects.json"),
    JSON.stringify({
      projects: names.map((name) => ({ name, title: name, description: `${name} docs` })),
    }),
  );
}

const quiet = () => {};

describe("run", () => {
  test("writes the landing page and the 404 page", async () => {
    await seed(["aeroflare", "beacon"]);
    const dist = join(root, "dist");

    await run({ repoRoot: root, distDir: dist, log: quiet });

    const index = await Bun.file(join(dist, "index.html")).text();
    expect(index).toContain('href="/aeroflare/"');
    expect(index).toContain('href="/beacon/"');
    expect(await Bun.file(join(dist, "404.html")).exists()).toBe(true);
  });

  test("writes nothing to dist when the manifest is invalid", async () => {
    await writeFile(join(root, "projects.json"), "{ not json");
    const dist = join(root, "dist");

    await expect(run({ repoRoot: root, distDir: dist, log: quiet })).rejects.toThrow(
      /not valid JSON/,
    );
    expect(await Bun.file(join(dist, "index.html")).exists()).toBe(false);
  });

  test("succeeds with an empty manifest", async () => {
    await seed([]);
    const dist = join(root, "dist");

    await run({ repoRoot: root, distDir: dist, log: quiet });

    expect(await Bun.file(join(dist, "index.html")).exists()).toBe(true);
  });
});
