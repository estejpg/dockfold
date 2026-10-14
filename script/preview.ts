// Serves dist/ the way Vercel does (cleanUrls, 404.html, vercel.json redirects
// and headers) and runs /api/suggest. Usage: npm run preview [-- --port 4173]
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import suggest from "../api/suggest.js";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const config = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8")) as {
  redirects: { source: string; destination: string; permanent: boolean }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const portFlag = process.argv.indexOf("--port");
const port = portFlag > 0 ? Number(process.argv[portFlag + 1]) : 4173;
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

async function fileAt(relative: string) {
  const file = path.join(dist, relative);
  if (!file.startsWith(dist + path.sep)) return undefined;
  try {
    return (await stat(file)).isFile() ? file : undefined;
  } catch {
    return undefined;
  }
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  for (const rule of config.headers)
    if (new RegExp(`^${rule.source}$`).test(url.pathname))
      for (const header of rule.headers) res.setHeader(header.key, header.value);

  if (url.pathname === "/api/suggest") {
    const init: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers: req.headers as HeadersInit,
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = Readable.toWeb(req) as ReadableStream;
      init.duplex = "half";
    }
    const response = await suggest.fetch(new Request(url, init));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }

  const redirect = config.redirects.find((rule) => rule.source === url.pathname);
  const clean = url.pathname.length > 1 && url.pathname.endsWith("/")
    ? url.pathname.slice(0, -1)
    : url.pathname.endsWith(".html")
      ? url.pathname.replace(/(index)?\.html$/, "") || "/"
      : undefined;
  if (redirect || clean) {
    res.writeHead(redirect && !redirect.permanent ? 307 : 308, {
      Location: (redirect?.destination ?? clean) + url.search,
    });
    res.end();
    return;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = "/404";
  }
  const file =
    (pathname !== "/" && (await fileAt(pathname.slice(1)))) ||
    (await fileAt(pathname === "/" ? "index.html" : `${pathname.slice(1)}.html`));
  const target = file ?? path.join(dist, "404.html");
  res.writeHead(file ? 200 : 404, {
    "Content-Type": types[path.extname(target)] ?? "application/octet-stream",
  });
  res.end(await readFile(target));
}

createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    res.statusCode = 500;
    res.end("Preview server error");
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Previewing dist/ like Vercel at http://127.0.0.1:${port}`);
});
