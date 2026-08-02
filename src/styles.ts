/**
 * The site's entire stylesheet, written to `dist/app.css` at build time.
 *
 * The system is inherited wholesale from openpgpkey.itzemoji.com so the two
 * sites read as one estate: the same cool-grey ground and white panels, the
 * same 1px hairlines with no resting shadows, the same 12px containers over
 * 8px controls, the same Public Sans over JetBrains Mono, and the same single
 * deep-blue accent carrying every link, the primary action and the focus ring.
 *
 * Only the rules this site actually uses are carried over. The sibling's
 * fingerprint, QR, toast and disclosure blocks have no counterpart on an index
 * of documentation, and a stylesheet that ships them would be describing a
 * page that does not exist.
 */
export const APP_CSS = `
/* ---------------------------------------------------------------- fonts --
   Vendored from node_modules into /fonts by assemble.ts. Nothing is fetched
   from a third party: this page is the front door to every project's docs,
   and reading it should not disclose the visitor to a CDN.                 */

@font-face {
  font-family: "Public Sans";
  src: url("/fonts/public-sans-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Public Sans";
  src: url("/fonts/public-sans-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Public Sans";
  src: url("/fonts/public-sans-600.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* --------------------------------------------------------------- tokens */

:root {
  --sans: "Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  /* Slashed zero, at every monospace site without exception — the same rule
     the sibling site sets, so a path reads the same on both. */
  --mono-features: "zero" 1;

  --bg: #f6f7f8;
  --surface: #ffffff;
  --sunken: #edeff2;
  --line: #dde1e6;

  --ink: #14181c;
  --ink-2: #565e66;
  --ink-3: #6e767e;

  --accent: #1b4b8f;
  --accent-hover: #14396e;
  --accent-ink: #ffffff;
  --accent-soft: #e9eff8;

  --r-card: 12px;
  --r-ctl: 8px;
  --r-sm: 4px;

  --page-max: 60rem;
  --gutter: 24px;

  --ease: cubic-bezier(0.16, 1, 0.3, 1);

  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1215;
    --surface: #171b1f;
    --sunken: #1c2126;
    --line: #2a3037;

    --ink: #e8ebee;
    --ink-2: #a0a8b0;
    --ink-3: #8a939b;

    --accent: #86adef;
    --accent-hover: #a6c4f5;
    --accent-ink: #0b1220;
    --accent-soft: #172538;

    color-scheme: dark;
  }
}

/* ---------------------------------------------------------------- reset */

*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 1rem;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

svg {
  display: block;
  max-width: 100%;
}

a {
  color: var(--accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

a:hover {
  color: var(--accent-hover);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--r-sm);
}

::selection {
  background: var(--accent-soft);
  color: var(--ink);
}

/* --------------------------------------------------------------- layout */

.wrap {
  width: 100%;
  max-width: var(--page-max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

main {
  flex: 1;
  padding-block: 40px 72px;
}

.section + .section {
  margin-top: 44px;
}

.section-head {
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 14px;
}

/* ------------------------------------------------------------- masthead */

.masthead {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.masthead-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 60px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  text-decoration: none;
  font-weight: 600;
  font-size: 1.0625rem;
  letter-spacing: -0.01em;
}

.brand:hover {
  color: var(--ink);
}

.brand svg {
  width: 20px;
  height: 20px;
  color: var(--ink-2);
}

.brand:hover svg {
  color: var(--accent);
}

/* ----------------------------------------------------------- page intro */

.page-title {
  font-size: clamp(1.75rem, 1.4rem + 1.6vw, 2.35rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.022em;
  text-wrap: balance;
}

/* --------------------------------------------------------- the register --
   The index itself: one bordered container, one row per project, hairlines
   between. Structurally the sibling site's record block, and for the same
   reason — a list of things that lead somewhere reads faster as a register
   than as a stack of panels, and it stays one screen as projects are added.

   The whole row is the link. One interactive element per entry, so there is
   nothing to tab past and nothing to miss.                                 */

.record {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px 14px 20px;
  min-height: 64px;
  color: inherit;
  text-decoration: none;
  transition: background-color 120ms var(--ease);
}

.row + .row {
  border-top: 1px solid var(--line);
}

.row:hover {
  background: var(--sunken);
  color: inherit;
}

/* The outline would otherwise be clipped by the container's overflow on the
   first and last row. Inset it so a keyboard user sees the whole ring. */
.row:focus-visible {
  outline-offset: -3px;
  border-radius: 0;
}

.row-text {
  flex: 1;
  min-width: 0;
}

.row-title {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.row:hover .row-title {
  color: var(--accent);
}

.row-desc {
  display: block;
  margin-top: 2px;
  max-width: 66ch;
  font-size: 0.9375rem;
  color: var(--ink-2);
}

/* The served path is the one value here worth setting in mono: it is an
   address the reader may retype, not prose. */
.row-path {
  flex: none;
  font-family: var(--mono);
  font-feature-settings: var(--mono-features);
  font-size: 0.875rem;
  color: var(--ink-3);
}

.row-go {
  display: flex;
  flex: none;
  color: var(--ink-3);
  transition: color 120ms var(--ease), transform 160ms var(--ease);
}

.row-go svg {
  width: 18px;
  height: 18px;
}

.row:hover .row-go {
  color: var(--accent);
  transform: translateX(2px);
}

/* ---------------------------------------------------------------- empty --
   Named as a state, not a shrug: it says what is missing and what fills it. */

.empty {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: 28px 24px;
}

.empty p {
  max-width: 66ch;
  color: var(--ink-2);
}

.empty p + p {
  margin-top: 8px;
  font-size: 0.9375rem;
  color: var(--ink-3);
}

.mono {
  font-family: var(--mono);
  font-feature-settings: var(--mono-features);
  font-size: 0.9em;
}

/* --------------------------------------------------------------- footer */

.site-footer {
  border-top: 1px solid var(--line);
  padding-block: 24px 32px;
}

.site-footer .inner {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  align-items: baseline;
  font-size: 0.875rem;
  /* --ink-3 clears 4.5:1 on --surface but only reaches 4.3:1 on the --bg the
     footer sits on, so the footer takes the stronger of the two greys. */
  color: var(--ink-2);
}

/* --------------------------------------------------------------- motion */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ----------------------------------------------------------- responsive --
   One breakpoint, as on the sibling site. Below it the panel header stacks so
   a long path never squeezes the project's name.                           */

@media (max-width: 46rem) {
  :root {
    --gutter: 16px;
  }

  main {
    padding-block: 28px 56px;
  }

  .row {
    gap: 12px;
    padding: 14px 12px 14px 16px;
  }

  /* The path is the first thing to go: the row is already a link, and the
     address bar shows it the moment the reader follows one. */
  .row-path {
    display: none;
  }

  .empty {
    padding: 22px 16px;
  }
}

/* ------------------------------------------------------------- printing */

@media print {
  :root {
    --bg: #fff;
    --surface: #fff;
    --sunken: #f2f2f2;
    --line: #bbb;
    --ink: #000;
    --ink-2: #333;
    --ink-3: #555;
  }

  .masthead,
  .row-go {
    display: none !important;
  }

  .row,
  .empty {
    break-inside: avoid;
  }

  a {
    color: #000;
  }
}
`;
