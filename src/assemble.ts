import { copyFile, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { renderIndexPage } from "./index-page.ts";
import type { ProjectConfig } from "./manifest.ts";
import { renderNotFoundPage } from "./not-found-page.ts";
import { APP_CSS } from "./styles.ts";

/**
 * Public Sans carries the prose, JetBrains Mono the served paths. Latin
 * subsets are all this site needs.
 *
 * Both faces are vendored out of node_modules rather than loaded from a CDN,
 * which is how openpgpkey.itzemoji.com ships them too: reading an index of
 * documentation should not disclose the visitor to a third party, and nothing
 * off-site should be able to change how this page renders.
 */
const FONTS: Array<[pkg: string, file: string, out: string]> = [
  ["@fontsource/public-sans", "public-sans-latin-400-normal.woff2", "public-sans-400.woff2"],
  ["@fontsource/public-sans", "public-sans-latin-500-normal.woff2", "public-sans-500.woff2"],
  ["@fontsource/public-sans", "public-sans-latin-600-normal.woff2", "public-sans-600.woff2"],
  ["@fontsource/jetbrains-mono", "jetbrains-mono-latin-400-normal.woff2", "jetbrains-mono-400.woff2"],
];

/** Writes the stylesheet and copies both typefaces out of node_modules. */
export async function writeAssets(distDir: string): Promise<void> {
  const require = createRequire(import.meta.url);
  await Bun.write(join(distDir, "app.css"), APP_CSS.trimStart());

  const fontsOut = join(distDir, "fonts");
  await mkdir(fontsOut, { recursive: true });

  for (const [pkg, file, out] of FONTS) {
    const root = dirname(require.resolve(`${pkg}/package.json`));
    await copyFile(join(root, "files", file), join(fontsOut, out));
  }
}

/** Writes the landing page, the 404 page and their assets into a clean distDir. */
export async function assemble(
  projects: ProjectConfig[],
  distDir: string,
): Promise<void> {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await writeAssets(distDir);
  await Bun.write(join(distDir, "index.html"), renderIndexPage(projects));
  await Bun.write(join(distDir, "404.html"), renderNotFoundPage());
}
