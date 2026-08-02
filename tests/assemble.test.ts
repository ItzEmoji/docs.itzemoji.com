import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assemble } from "../src/assemble.ts";
import type { ProjectConfig } from "../src/manifest.ts";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "monodocs-assemble-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function project(name: string): ProjectConfig {
  return {
    name,
    path: `projects/${name}`,
    buildCommand: "bun run docs:build",
    outputDir: "build",
    title: name,
    description: `${name} docs`,
  };
}

async function seedOutput(name: string, files: Record<string, string>): Promise<void> {
  for (const [relative, contents] of Object.entries(files)) {
    const target = join(root, "projects", name, "build", relative);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, contents);
  }
}

describe("assemble", () => {
  test("copies each project's output to dist/<name>/", async () => {
    await seedOutput("aeroflare", {
      "index.html": "<h1>aeroflare</h1>",
      "assets/app.css": "body{}",
    });
    await seedOutput("beacon", { "index.html": "<h1>beacon</h1>" });

    const dist = join(root, "dist");
    await assemble([project("aeroflare"), project("beacon")], {
      repoRoot: root,
      distDir: dist,
    });

    expect(await Bun.file(join(dist, "aeroflare/index.html")).text()).toBe(
      "<h1>aeroflare</h1>",
    );
    expect(await Bun.file(join(dist, "aeroflare/assets/app.css")).text()).toBe("body{}");
    expect(await Bun.file(join(dist, "beacon/index.html")).text()).toBe("<h1>beacon</h1>");
  });

  test("writes a root index page linking the projects", async () => {
    await seedOutput("aeroflare", { "index.html": "<h1>aeroflare</h1>" });

    const dist = join(root, "dist");
    await assemble([project("aeroflare")], { repoRoot: root, distDir: dist });

    const html = await Bun.file(join(dist, "index.html")).text();
    expect(html).toContain('href="/aeroflare/"');
  });

  test("removes output from a previous run", async () => {
    const dist = join(root, "dist");
    await mkdir(join(dist, "stale"), { recursive: true });
    await writeFile(join(dist, "stale/index.html"), "old");
    await seedOutput("aeroflare", { "index.html": "new" });

    await assemble([project("aeroflare")], { repoRoot: root, distDir: dist });

    expect(await Bun.file(join(dist, "stale/index.html")).exists()).toBe(false);
    expect(await Bun.file(join(dist, "aeroflare/index.html")).exists()).toBe(true);
  });

  test("writes only the index page when there are no projects", async () => {
    const dist = join(root, "dist");
    await assemble([], { repoRoot: root, distDir: dist });

    expect(await Bun.file(join(dist, "index.html")).exists()).toBe(true);
  });

  test("writes the stylesheet and vendors both typefaces", async () => {
    const dist = join(root, "dist");
    await assemble([], { repoRoot: root, distDir: dist });

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
    const dist = join(root, "dist");
    await assemble([], { repoRoot: root, distDir: dist });

    const css = await Bun.file(join(dist, "app.css")).text();
    const declared = [...css.matchAll(/url\("\/fonts\/([^"]+)"\)/g)].map((m) => m[1]!);

    expect(declared.length).toBeGreaterThan(0);
    for (const font of declared) {
      expect(await Bun.file(join(dist, "fonts", font)).exists()).toBe(true);
    }
  });
});
