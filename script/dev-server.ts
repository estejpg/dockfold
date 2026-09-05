import { createServer } from "node:http";
import { Readable } from "node:stream";
import { createServer as createViteServer } from "vite";
import community from "../api/community.js";
import submissions from "../api/icon-submissions.js";
import catalogIcon from "../api/catalog-icon.js";
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});
const api = new Map([
  ["/api/community", community],
  ["/api/icon-submissions", submissions],
  ["/api/catalog-icon", catalogIcon],
]);
createServer(async (incoming, outgoing) => {
  const url = new URL(incoming.url || "/", "http://127.0.0.1:3105");
  const endpoint = api.get(url.pathname);
  if (!endpoint) {
    vite.middlewares(incoming, outgoing);
    return;
  }
  try {
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers as HeadersInit,
      ...(!["GET", "HEAD"].includes(incoming.method || "GET")
        ? { body: Readable.toWeb(incoming) as ReadableStream, duplex: "half" }
        : {}),
    });
    const response = await endpoint.fetch(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body)
      Readable.fromWeb(
        response.body as Parameters<typeof Readable.fromWeb>[0],
      ).pipe(outgoing);
    else outgoing.end();
  } catch {
    outgoing.writeHead(500);
    outgoing.end("The request could not be completed.");
  }
}).listen(3105, "127.0.0.1", () =>
  console.log("DockFold with real preview services: http://127.0.0.1:3105"),
);
