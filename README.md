# docs.itzemoji.com

The front door of `docs.itzemoji.com`. This repository does two things:

1. **Generates the landing page** — an index linking every project listed in
   `projects.json`.
2. **Generates the shared 404 page** — and ships a script that copies it into
   any other project's build output, so a miss anywhere on the site looks the same.

It does not build or host any project's documentation. Each project deploys
itself, and Cloudflare routes `docs.itzemoji.com/<project>/*` to that project's
deployment. Everything else on the domain is served from this repository's `dist/`.

## Usage

```bash
bun install

bun run build            # write dist/: index.html, 404.html, app.css, fonts/
bun run serve            # preview dist/ at http://localhost:8080
bun run dev              # build, then serve
bun test
```

`app.css` and `fonts/` (Public Sans and JetBrains Mono, copied out of
`node_modules` at build time) live at the root of the domain. Nothing is loaded
from a CDN, and the pages share their visual system with `openpgpkey.itzemoji.com`.
Because the fonts sit at `/fonts/`, `fonts` is a reserved project name and the
manifest rejects it.

`bun run serve` never builds — it serves whatever is already in `dist/`, and
answers unknown paths with `dist/404.html`, as Cloudflare does. Pass
`--port 3000` or set `$PORT` to change the port.

## Adding a project

1. Add an entry to `projects.json`:

   ```json
   {
     "projects": [
       {
         "name": "aeroflare",
         "title": "Aeroflare",
         "description": "One line shown on the landing page."
       }
     ]
   }
   ```

   `name` is the URL segment: the project is linked at `/<name>/`.

2. Build the project's docs with base path `/<name>/`, so its assets resolve
   under the route.

3. Copy the shared 404 page into the project's build output before deploying it:

   ```bash
   bun run copy-404 ../aeroflare/docs/build
   ```

   It accepts several directories at once, checks they all exist before writing
   anything, and overwrites any `404.html` the docs framework generated. The page
   inlines its stylesheet, so it renders correctly on the project's own
   deployment too. On `docs.itzemoji.com` it also picks up the site's fonts from
   `/fonts/`.

4. Add a Cloudflare route sending `docs.itzemoji.com/<name>/*` to the project's
   deployment.
