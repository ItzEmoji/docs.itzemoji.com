import { renderPage } from "./layout.ts";
import { APP_CSS } from "./styles.ts";

/**
 * The 404 page shared by the landing site and every project behind it.
 *
 * It is copied into each project's own build output (see copy-404.ts), so it
 * cannot count on /app.css existing beside it: a project previewed on its own
 * deployment has no such file. The stylesheet is inlined instead. The fonts
 * stay root-relative — on docs.itzemoji.com they resolve to this site's
 * /fonts/, and anywhere else the page falls back to the system faces.
 *
 * Every link is root-relative too, because the page is served from whatever
 * path happened to miss, at any depth.
 */
export function renderNotFoundPage(): string {
  return renderPage({
    title: "Page not found",
    description: "This page does not exist.",
    styles: `<style>${APP_CSS}</style>`,
    main: `<section class="section">
  <h1 class="page-title">Page not found</h1>
</section>

<section class="section">
  <div class="empty">
    <p>There is nothing at this address. The page may have moved, or the link that led here may be wrong.</p>
    <p><a href="/">Browse all documentation</a></p>
  </div>
</section>`,
  });
}
