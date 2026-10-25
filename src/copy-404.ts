import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderNotFoundPage } from "./not-found-page.ts";

/**
 * Writes the shared 404 page into each target directory — typically another
 * project's build output, so that a miss under docs.itzemoji.com/<project>/
 * looks the same as a miss anywhere else on the site.
 *
 * Every target must already exist: a typo'd path should fail loudly, not
 * quietly create a directory nothing deploys.
 */
export async function copyNotFoundPage(targets: string[]): Promise<string[]> {
  if (targets.length === 0) {
    throw new Error("usage: bun run copy-404 <output-dir> [<output-dir> ...]");
  }

  // Check every target before writing to any, so a bad path leaves nothing
  // half-done.
  for (const target of targets) {
    let isDirectory = false;
    try {
      isDirectory = (await stat(target)).isDirectory();
    } catch {
      // Reported below.
    }
    if (!isDirectory) {
      throw new Error(`${target} is not a directory — build the project first`);
    }
  }

  const html = renderNotFoundPage();
  const written: string[] = [];
  for (const target of targets) {
    const file = join(resolve(target), "404.html");
    await Bun.write(file, html);
    written.push(file);
  }
  return written;
}

if (import.meta.main) {
  try {
    for (const file of await copyNotFoundPage(process.argv.slice(2))) {
      console.log(`✓ wrote ${file}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${message}`);
    process.exit(1);
  }
}
