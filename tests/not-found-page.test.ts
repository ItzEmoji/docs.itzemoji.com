import { describe, expect, test } from "bun:test";
import { renderNotFoundPage } from "../src/not-found-page.ts";

describe("renderNotFoundPage", () => {
  test("renders a complete HTML document", () => {
    const html = renderNotFoundPage();
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("</html>");
    expect(html).toContain("<title>Page not found — docs.itzemoji.com</title>");
  });

  test("inlines its styles so it works without /app.css beside it", () => {
    const html = renderNotFoundPage();
    expect(html).toContain("<style>");
    expect(html).not.toContain('href="/app.css"');
  });

  test("links back to the landing page", () => {
    expect(renderNotFoundPage()).toContain('<a href="/">Browse all documentation</a>');
  });

  test("uses only root-relative links, since it is served at any depth", () => {
    const html = renderNotFoundPage();
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]!);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href.startsWith("/")).toBe(true);
  });

  test("makes no external requests", () => {
    const html = renderNotFoundPage();
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
    expect(html).not.toContain("<script");
  });
});
