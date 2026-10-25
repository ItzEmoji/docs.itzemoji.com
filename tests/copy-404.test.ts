import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyNotFoundPage } from "../src/copy-404.ts";
import { renderNotFoundPage } from "../src/not-found-page.ts";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "monodocs-copy404-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("copyNotFoundPage", () => {
  test("writes the 404 page into every target directory", async () => {
    const a = join(root, "a");
    const b = join(root, "b");
    await mkdir(a);
    await mkdir(b);

    await copyNotFoundPage([a, b]);

    for (const dir of [a, b]) {
      expect(await Bun.file(join(dir, "404.html")).text()).toBe(renderNotFoundPage());
    }
  });

  test("replaces a 404 page the project generated itself", async () => {
    await writeFile(join(root, "404.html"), "<h1>framework default</h1>");

    await copyNotFoundPage([root]);

    expect(await Bun.file(join(root, "404.html")).text()).toBe(renderNotFoundPage());
  });

  test("rejects a target that does not exist", async () => {
    await expect(copyNotFoundPage([join(root, "missing")])).rejects.toThrow(
      /is not a directory/,
    );
  });

  test("rejects a target that is a file", async () => {
    const file = join(root, "file.txt");
    await writeFile(file, "");
    await expect(copyNotFoundPage([file])).rejects.toThrow(/is not a directory/);
  });

  test("requires at least one target", async () => {
    await expect(copyNotFoundPage([])).rejects.toThrow(/usage/);
  });
});
