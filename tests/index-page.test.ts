import { describe, expect, test } from "bun:test";
import { escapeHtml, renderIndexPage } from "../src/index-page.ts";
import type { ProjectConfig } from "../src/manifest.ts";

function project(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    name: "aeroflare",
    path: "projects/aeroflare",
    buildCommand: "bun run docs:build",
    outputDir: "dist",
    title: "Aeroflare",
    description: "Flight planning toolkit.",
    ...overrides,
  };
}

describe("escapeHtml", () => {
  test("escapes every HTML metacharacter", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
    );
  });

  test("leaves ordinary text untouched", () => {
    expect(escapeHtml("Aeroflare docs")).toBe("Aeroflare docs");
  });
});

describe("renderIndexPage", () => {
  test("renders a complete HTML document", () => {
    const html = renderIndexPage([project()]);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("</html>");
    expect(html).toContain("<title>");
  });

  test("links each project at its own path", () => {
    const html = renderIndexPage([project(), project({ name: "beacon", title: "Beacon" })]);
    expect(html).toContain('href="/aeroflare/"');
    expect(html).toContain('href="/beacon/"');
    expect(html).toContain("Beacon");
  });

  test("shows title and description", () => {
    const html = renderIndexPage([project()]);
    expect(html).toContain("Aeroflare");
    expect(html).toContain("Flight planning toolkit.");
  });

  test("escapes titles and descriptions", () => {
    const html = renderIndexPage([
      project({ title: "<script>alert(1)</script>", description: "a & b" }),
    ]);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b");
  });

  test("renders a placeholder when there are no projects", () => {
    const html = renderIndexPage([]);
    expect(html).toContain("No documentation has been published yet");
  });

  test("shows the path each project is served at", () => {
    const html = renderIndexPage([project()]);
    expect(html).toContain('<span class="row-path">/aeroflare/</span>');
  });

  test("makes the whole row the only link in an entry", () => {
    const html = renderIndexPage([project()]);
    const start = html.indexOf('<a class="row"');
    const entry = html.slice(start, html.indexOf("</a>", start));
    expect(entry).toContain("Aeroflare");
    expect(entry).toContain("Flight planning toolkit.");
    // A second anchor inside the row would be a keyboard stop with no purpose.
    expect(entry.split("<a ").length - 1).toBe(1);
  });

  test("links the vendored stylesheet instead of inlining styles", () => {
    const html = renderIndexPage([project()]);
    expect(html).toContain('<link rel="stylesheet" href="/app.css">');
    expect(html).toContain('href="/fonts/public-sans-400.woff2"');
    expect(html).not.toContain("<style");
  });

  test("counts the projects", () => {
    expect(renderIndexPage([project()])).toContain("1 project<");
    expect(
      renderIndexPage([project(), project({ name: "beacon" })]),
    ).toContain("2 projects<");
  });

  test("makes no external requests", () => {
    const html = renderIndexPage([project()]);
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
    expect(html).not.toContain("<script");
  });
});
