import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assemble } from "../src/assemble.ts";
import type { ProjectConfig } from "../src/manifest.ts";

let root: string;
let dist: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "monodocs-assemble-"));
  dist = join(root, "dist");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function project(name: string): ProjectConfig {
  return { name, title: name, description: `${name} docs` };
}

describe("assemble", () => {
  test("writes a root index page linking the projects", async () => {
    await assemble([project("aeroflare"), project("beacon")], dist);

    const html = await Bun.file(join(dist, "index.html")).text();
    expect(html).toContain('href="/aeroflare/"');
    expect(html).toContain('href="/beacon/"');
  });

  test("writes the 404 page", async () => {
    await assemble([], dist);

    const html = await Bun.file(join(dist, "404.html")).text();
    expect(html).toContain("Page not found");
  });

  test("removes output from a previous run", async () => {
    await mkdir(join(dist, "stale"), { recursive: true });
    await writeFile(join(dist, "stale/index.html"), "old");

    await assemble([project("aeroflare")], dist);

    expect(await Bun.file(join(dist, "stale/index.html")).exists()).toBe(false);
    expect(await Bun.file(join(dist, "index.html")).exists()).toBe(true);
  });

  test("writes the stylesheet and vendors both typefaces", async () => {
    await assemble([], dist);

    const css = await Bun.file(join(dist, "app.css")).text();
    expect(css).toContain("--accent: #1b4b8f");
    expect(css).toContain("/fonts/public-sans-400.woff2");

    for (const font of [
      "public-sans-400.woff2",
      "public-sans-500.woff2",
      "public-sans-600.woff2",
      "jetbrains-mono-400.woff2",
    ]) {
      const file = Bun.file(join(dist, "fonts", font));
      expect(await file.exists()).toBe(true);
      expect(await file.size).toBeGreaterThan(0);
    }
  });

  test("every font the stylesheet declares is one the build vendors", async () => {
    await assemble([], dist);

    const css = await Bun.file(join(dist, "app.css")).text();
    const declared = [...css.matchAll(/url\("\/fonts\/([^"]+)"\)/g)].map((m) => m[1]!);

    expect(declared.length).toBeGreaterThan(0);
    for (const font of declared) {
      expect(await Bun.file(join(dist, "fonts", font)).exists()).toBe(true);
    }
  });
});
