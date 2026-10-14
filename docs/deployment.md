# Deployment and operations

Vercel project `dockfold`, team `estejpgs-projects`. Node 24 runs `npm run build`; the static output is `dist`. One Node function lives at `api/suggest.ts`.

## Build

`npm run build` runs, in order:

1. `npm run content` (as `prebuild`): validates `content/` and writes the gitignored `src/generated/docks.json`. A bad record fails the build with the file name.
2. `tsc --noEmit` and `vite build`: the client bundle and `dist/index.html`.
3. `vite build --ssr src/entry-server.tsx --outDir dist-ssr`: a server bundle of the same route table.
4. `node script/prerender.mjs`: one HTML file per route (`dist/latest.html`, `dist/docks/<id>.html`, …) with its own title, description, canonical URL, Open Graph tags and JSON-LD; `dist/404.html`; empty shells for the client-only `/dock` and `/create`; and `dist/sitemap.xml`. `dist-ssr` is removed afterwards.

`vercel.json` uses `cleanUrls`, so `/latest` serves `latest.html`, and there is no catch-all rewrite: unknown paths get `404.html` with a real 404 status. Hash links (`/#/dock/…`, `/dock#dock=…`) render in the browser.

Adding a Dock is a content change and a deploy. Browsing needs no environment variables.

## The function and ESM

Vercel compiles each function file on its own and runs it as Node ESM. Every relative import reachable from `api/` must name a real file (`./dock.js`), and JSON imports need `with { type: "json" }`. `tests/server-runtime.test.ts` compiles the function the same way and imports it with plain Node, so `npm test` catches a missing extension.

## Optional suggestion inbox

Set these only if you want Submit to email you instead of returning a mailto/copy fallback:

| Name | Purpose |
|---|---|
| `SUGGESTION_INBOX` | Address that receives Dock suggestions |
| `RESEND_API_KEY` | Optional. When set with `RESEND_FROM`, the function emails the inbox |
| `RESEND_FROM` | Verified Resend from-address |

Without Resend, a configured inbox still produces a `mailto:` link for the visitor. Without an inbox, the visitor can copy the validated suggestion text. Never put the inbox address in client code except as that mailto response.

## Local

```sh
cp .env.example .env.local
npm ci
npm run dev       # Vite, client-rendered, serves /api/suggest
npm run preview   # builds, then serves dist/ like Vercel (cleanUrls, 404.html, headers, /api/suggest)
```

## Abuse controls

- JSON bodies are capped at 8 KB.
- Fields are length-limited; app IDs must exist in the bundled catalog.
- Writes require a matching Origin.
- The server does not fetch submitted websites or render submitted HTML.
- A honeypot field rejects obvious bots.

A Vercel firewall rate limit on POST `/api/suggest` is worth adding once the form is public.

## Launch verification

Run `npm test`, `npm run lint` and `npm run build`. Check Home, Latest, Submit, a Dock page and an unlisted share link at desktop and mobile widths, in both themes. After deploying:

```sh
npm run smoke -- https://dockfold.vercel.app
```

It expects 200s for pages, a 404 for an unknown Dock, a sitemap, and 405 for `GET /api/suggest`.
