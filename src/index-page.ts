import type { ProjectConfig } from "./manifest.ts";

const SITE_TITLE = "docs.itzemoji.com";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderIndexPage(projects: ProjectConfig[]): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SITE_TITLE}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
<h1>${SITE_TITLE}</h1>
<p class="lede">Documentation for every project, in one place.</p>
${renderBody(projects)}
</main>
</body>
</html>
`;
}

function renderBody(projects: ProjectConfig[]): string {
  if (projects.length === 0) {
    return `<p class="empty">No documentation has been published yet.</p>`;
  }
  return `<ul class="projects">\n${projects.map(renderCard).join("\n")}\n</ul>`;
}

function renderCard(project: ProjectConfig): string {
  return `<li><a href="/${escapeHtml(project.name)}/">
<span class="title">${escapeHtml(project.title)}</span>
<span class="description">${escapeHtml(project.description)}</span>
</a></li>`;
}

const STYLES = `
:root {
  color-scheme: light dark;
  --bg: #fbfbfd;
  --fg: #16161a;
  --muted: #5f5f6b;
  --card: #ffffff;
  --border: #e4e4ea;
  --accent: #3b5bdb;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #101014;
    --fg: #f2f2f5;
    --muted: #a0a0ad;
    --card: #18181d;
    --border: #2a2a32;
    --accent: #8ea3ff;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 4rem 1.5rem;
  background: var(--bg);
  color: var(--fg);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
}
main { max-width: 44rem; margin: 0 auto; }
h1 { margin: 0; font-size: 2rem; letter-spacing: -0.02em; }
.lede { margin: 0.5rem 0 2.5rem; color: var(--muted); }
.empty { color: var(--muted); }
.projects { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
.projects a {
  display: block;
  padding: 1.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
}
.projects a:hover, .projects a:focus-visible { border-color: var(--accent); }
.title { display: block; font-weight: 600; color: var(--accent); }
.description { display: block; margin-top: 0.25rem; color: var(--muted); font-size: 0.95rem; }
`;
