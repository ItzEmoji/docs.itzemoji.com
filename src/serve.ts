import { join, resolve, sep } from "node:path";

export interface ServeOptions {
  distDir: string;
  /** 0 picks an ephemeral port — the server's actual port is on `server.port`. */
  port?: number;
}

const DEFAULT_PORT = 8080;

export function createServer(options: ServeOptions): Bun.Server<undefined> {
  const root = resolve(options.distDir);
  return Bun.serve({
    port: options.port ?? DEFAULT_PORT,
    fetch: (request) => handleRequest(request, root),
  });
}

export async function handleRequest(
  request: Request,
  root: string,
): Promise<Response> {
  const url = new URL(request.url);

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Bad request\n", { status: 400 });
  }

  const target = resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(root + sep)) {
    return new Response("Forbidden\n", { status: 403 });
  }

  if (pathname.endsWith("/")) {
    return serveFile(join(target, "index.html"));
  }

  const file = Bun.file(target);
  if (await file.exists()) {
    return new Response(file);
  }

  // Not a file — if it is a directory holding an index, send the browser to the
  // trailing-slash form so the page's relative references resolve correctly.
  if (await Bun.file(join(target, "index.html")).exists()) {
    return new Response(null, {
      status: 301,
      headers: { Location: `${pathname}/${url.search}` },
    });
  }

  return notFound();
}

async function serveFile(path: string): Promise<Response> {
  const file = Bun.file(path);
  return (await file.exists()) ? new Response(file) : notFound();
}

function notFound(): Response {
  return new Response("Not found\n", { status: 404 });
}

if (import.meta.main) {
  const distDir = resolve(process.cwd(), "dist");

  if (!(await Bun.file(join(distDir, "index.html")).exists())) {
    console.error("✗ dist/ not found — run `bun run build` first");
    process.exit(1);
  }

  const server = createServer({ distDir, port: parsePort(process.argv.slice(2)) });
  console.log(`→ serving ${distDir} at http://localhost:${server.port}`);
}

function parsePort(args: string[]): number {
  const flag = args.find((arg) => arg === "--port" || arg.startsWith("--port="));
  const raw = flag?.includes("=")
    ? flag.split("=")[1]
    : flag
      ? args[args.indexOf(flag) + 1]
      : process.env.PORT;

  if (raw === undefined) return DEFAULT_PORT;

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error(`✗ invalid port "${raw}"`);
    process.exit(1);
  }
  return port;
}
