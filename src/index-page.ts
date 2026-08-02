import { icons } from "./icons.ts";
import type { ProjectConfig } from "./manifest.ts";

const SITE_TITLE = "docs.itzemoji.com";

/**
 * The direction contract for this build, emitted into the page so it survives
 * into the deployed output and can be audited against the render.
 */
const CONTRACT = `
  THESIS: One estate, two doors. This index is not a separate product with its
  own look; it is the same site as openpgpkey.itzemoji.com with a different
  payload, so a visitor arriving from either recognises the other. Refuses the
  generic card grid that makes every docs hub interchangeable.
  OWN-WORLD: Inherited from openpgpkey.itzemoji.com — restrained neutrals plus
  one deep blue accent, white panels on a cool grey ground, 1px hairlines and
  no resting shadows, 12px containers with 8px controls, Public Sans over
  JetBrains Mono, both vendored, nothing loaded from a third party.
  STORY: A reader arrives knowing a project's name, finds it in one screen,
  and leaves into its documentation.
  FIRST VIEWPORT: Sticky masthead carrying the domain; the word Documentation;
  the project count; then the register itself — one bordered container, one
  row per project carrying its name, its one line and its served path, the
  whole row a link. No lede: an index explains itself by being one.
  FORM: Brief-pinned. The user named openpgpkey.itzemoji.com as the world, so
  it was inherited rather than rolled for; no concept round was run.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
`;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderIndexPage(projects: ProjectConfig[]): string {
  const count = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="description" content="Documentation for every ItzEmoji project, in one place.">
<title>Documentation — ${SITE_TITLE}</title>
<link rel="preload" href="/fonts/public-sans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/app.css">
</head>
<body>
<!--${CONTRACT}-->
<header class="masthead">
  <div class="wrap masthead-inner">
    <a class="brand" href="/">
      ${icons.book}<span>${SITE_TITLE}</span>
    </a>
  </div>
</header>

<main><div class="wrap">
<section class="section">
  <h1 class="page-title">Documentation</h1>
</section>

<section class="section">
  <h2 class="section-head">${count}</h2>
${renderBody(projects)}
</section>
</div></main>

<footer class="site-footer">
  <div class="wrap inner">
    <p>Built from each project's own repository.</p>
  </div>
</footer>
</body>
</html>
`;
}

function renderBody(projects: ProjectConfig[]): string {
  if (projects.length === 0) {
    return `  <div class="empty">
    <p>No documentation has been published yet.</p>
    <p>Add a project to <span class="mono">projects.json</span> and build again.</p>
  </div>`;
  }
  return `  <div class="record">
${projects.map(renderProject).join("\n")}
  </div>`;
}

/**
 * One entry in the register: what the project is called, what it is, and the
 * path it is served at. The row itself is the link — a reader scanning for a
 * name should not have to find a separate control once they see it.
 */
function renderProject(project: ProjectConfig): string {
  const name = escapeHtml(project.name);
  return `    <a class="row" href="/${name}/">
      <span class="row-text">
        <span class="row-title">${escapeHtml(project.title)}</span>
        <span class="row-desc">${escapeHtml(project.description)}</span>
      </span>
      <span class="row-path">/${name}/</span>
      <span class="row-go">${icons.chevronRight}</span>
    </a>`;
}
