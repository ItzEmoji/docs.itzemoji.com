# docs.itzemoji.com

Aggregates the documentation of several projects — each vendored as a git submodule —
into one static site. Each project is served at `docs.itzemoji.com/<project>/`.

## Usage

```bash
bun install
git submodule update --init --recursive

bun run build            # build every project in projects.json
bun run build aeroflare  # build only one
bun test
```

Output lands in `dist/`: one directory per project, plus a generated `index.html`
linking to them all.

## Adding a project

1. Add the submodule:

   ```bash
   git submodule add <repo-url> projects/<name>
   ```

2. Add an entry to `projects.json`. The file must contain a top-level `projects` array:

   ```json
   {
     "projects": [
       {
         "name": "aeroflare",
         "path": "projects/aeroflare",
         "buildCommand": "bun run docs:build",
         "outputDir": "docs/.vitepress/dist",
         "title": "Aeroflare",
         "description": "One line shown on the index page."
       }
     ]
   }
   ```

   `name` is the URL segment. `outputDir` is relative to `path` and must contain an
   `index.html` after the build.

3. Make the project honour the base path. The orchestrator sets `DOCS_BASE_PATH`
   (for example `/aeroflare/`) in the build command's environment. The project's docs
   config must read it and default to `/` so the docs still build standalone —
   for VitePress:

   ```ts
   export default defineConfig({
     base: process.env.DOCS_BASE_PATH ?? "/",
   });
   ```

A project that is not listed in `projects.json` is not built.

## Behaviour

- Projects build sequentially, in manifest order.
- Any failure — invalid manifest, uninitialised submodule, failed install, failed build,
  missing output — aborts the whole run with a non-zero exit code. `dist/` is only
  written after every build succeeds, so a partial deploy is impossible.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main` and publishes `dist/` to
Cloudflare Pages.

Required repository secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with the Cloudflare Pages edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `SUBMODULES_TOKEN` | Only if a submodule lives in a private repo the default token cannot read |
