import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type SuggestModule = {
  default: { fetch: (request: Request) => Promise<Response> };
};

async function proxySuggest(
  req: IncomingMessage,
  res: ServerResponse,
  load: () => Promise<SuggestModule>,
) {
  try {
    const mod = await load();
    const url = new URL(
      req.url || "/api/suggest",
      `http://${req.headers.host}`,
    );
    const init: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers: req.headers as HeadersInit,
    };
    if (!["GET", "HEAD"].includes(req.method || "GET")) {
      init.body = Readable.toWeb(
        req as InstanceType<typeof Readable>,
      ) as ReadableStream;
      init.duplex = "half";
    }
    const response = await mod.default.fetch(new Request(url, init));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body)
      Readable.fromWeb(
        response.body as Parameters<typeof Readable.fromWeb>[0],
      ).pipe(res);
    else res.end();
  } catch {
    res.statusCode = 500;
    res.end("The request could not be completed.");
  }
}

function suggestApi(): Plugin {
  return {
    name: "suggest-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/api/suggest") return next();
        void proxySuggest(req, res, () =>
          server.ssrLoadModule("/api/suggest.ts") as Promise<SuggestModule>,
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), suggestApi()],
  build: { sourcemap: false },
});
