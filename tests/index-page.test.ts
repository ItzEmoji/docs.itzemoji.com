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

  test("makes no external requests", () => {
    const html = renderIndexPage([project()]);
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
    expect(html).not.toContain("<script");
  });
});
