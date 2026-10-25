import { icons } from "./icons.ts";

export const SITE_TITLE = "docs.itzemoji.com";

export interface PageOptions {
  /** Prefixed to the site title in the document's <title>. */
  title: string;
  description: string;
  /** How the stylesheet reaches the page: a <link> or an inline <style>. */
  styles: string;
  /** Emitted as an HTML comment at the top of <body>, if given. */
  comment?: string;
  main: string;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** The chrome every page on the site shares: masthead, main column, footer. */
export function renderPage(options: PageOptions): string {
  const comment = options.comment === undefined ? "" : `<!--${options.comment}-->\n`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="description" content="${escapeHtml(options.description)}">
<title>${escapeHtml(options.title)} — ${SITE_TITLE}</title>
<link rel="preload" href="/fonts/public-sans-400.woff2" as="font" type="font/woff2" crossorigin>
${options.styles}
</head>
<body>
${comment}<header class="masthead">
  <div class="wrap masthead-inner">
    <a class="brand" href="/">
      ${icons.book}<span>${SITE_TITLE}</span>
    </a>
  </div>
</header>

<main><div class="wrap">
${options.main}
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
