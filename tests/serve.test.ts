import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../src/serve.ts";

let root: string;
let server: Bun.Server<undefined> | undefined;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "monodocs-serve-"));

  const dist = join(root, "dist");
  await mkdir(join(dist, "aeroflare", "assets"), { recursive: true });
  await writeFile(join(dist, "index.html"), "<h1>docs.itzemoji.com</h1>");
  await writeFile(join(dist, "aeroflare", "index.html"), "<h1>aeroflare</h1>");
  await writeFile(join(dist, "aeroflare", "assets", "app.css"), "body{color:red}");
  // Lives outside dist/ — a traversal attempt must never reach it.
  await writeFile(join(root, "secret.txt"), "top secret");
});

afterEach(async () => {
  server?.stop(true);
  server = undefined;
  await rm(root, { recursive: true, force: true });
});

/** Starts the server on an ephemeral port and returns its base URL. */
function start(): string {
  server = createServer({ distDir: join(root, "dist"), port: 0 });
  return `http://localhost:${server.port}`;
}

describe("createServer", () => {
  test("serves the generated root index", async () => {
    const response = await fetch(`${start()}/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("<h1>docs.itzemoji.com</h1>");
  });

  test("serves a project's index at its subpath", async () => {
    const response = await fetch(`${start()}/aeroflare/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("<h1>aeroflare</h1>");
  });

  test("redirects a directory path to its trailing-slash form", async () => {
    const response = await fetch(`${start()}/aeroflare`, { redirect: "manual" });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/aeroflare/");
  });

  test("preserves the query string when redirecting", async () => {
    const response = await fetch(`${start()}/aeroflare?q=1`, { redirect: "manual" });

    expect(response.headers.get("location")).toBe("/aeroflare/?q=1");
  });

  test("serves a nested asset with the right content type", async () => {
    const response = await fetch(`${start()}/aeroflare/assets/app.css`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    expect(await response.text()).toBe("body{color:red}");
  });

  test("returns 404 for an unknown path", async () => {
    const response = await fetch(`${start()}/nope`);

    expect(response.status).toBe(404);
  });

  test("returns 404 for a directory without an index.html", async () => {
    await mkdir(join(root, "dist", "empty"), { recursive: true });
    const response = await fetch(`${start()}/empty/`);

    expect(response.status).toBe(404);
  });

  // A client normalises `/../secret.txt` to `/secret.txt` before sending, so this
  // asserts the file never leaks rather than pinning a specific status.
  test("never serves a file that lives outside dist/", async () => {
    const response = await fetch(`${start()}/../secret.txt`, { redirect: "manual" });

    expect(response.ok).toBe(false);
    expect(await response.text()).not.toContain("top secret");
  });

  // An encoded slash survives URL normalisation, so this reaches the handler as a
  // real `../` traversal — the case the containment check exists for.
  test("refuses a traversal hidden behind an encoded slash", async () => {
    const response = await fetch(`${start()}/..%2fsecret.txt`, { redirect: "manual" });

    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("top secret");
  });

  test("rejects a malformed percent-encoding", async () => {
    const response = await fetch(`${start()}/%ZZ`);

    expect(response.status).toBe(400);
  });
});
