# DockFold

A hand-picked directory of macOS Docks. Every Dock is chosen and arranged by us: the apps, their order, and a note on why they belong together. Nothing to install, nothing scanned.

[Open DockFold](https://dockfold.vercel.app) · [Latest](https://dockfold.vercel.app/latest) · [Collections](https://dockfold.vercel.app/collections) · [Suggest a Dock](https://dockfold.vercel.app/submit)

“DockFold” is a working name. Change it in `src/lib/site.ts`; titles, metadata, the sitemap and the header follow.

## What visitors can do

- **Browse:** Home shows a featured Dock and every published Dock, with search (`/`), collection and size filters, and a list or grid view. Latest lists Docks by publication date. Collections and Apps group them by purpose or by app.
- **Look closely:** each Dock page shows the Dock as macOS would (magnifying under the pointer), the note, every app in order, related Docks, and newer/older navigation with the arrow keys.
- **Suggest a Dock:** `/submit` is a short form. No account. Every suggestion is reviewed; nothing is listed automatically.
- **Make it yours:** `/create` builds an unlisted share link in the browser. Share links (`/dock#dock=…`) never reach the server and never appear in the collection.

## Stack

React 19, Vite 7 and TypeScript on Vercel, with Inter and Lucide. Docks are committed JSON files in `content/`, validated at build time and prerendered to one HTML file per page. One Node function at `/api/suggest` validates suggestions and emails the owner (Resend) or returns a mailto or copyable text. No accounts, database, analytics or native helper.

## Run and verify

Node 22.13+ or Node 24:

```sh
npm ci
npm run dev        # http://127.0.0.1:5173, client-rendered
npm run preview    # builds, then serves dist/ like Vercel at http://127.0.0.1:4173
```

```sh
npm test
npm run lint
npm run build
```

After a deploy, `npm run smoke -- https://your-deployment` checks pages, a real 404 and the function. See [deployment](docs/deployment.md).

## Repository map

- `content/docks/*.json`, `content/collections.json`: the collection. See [maintaining the collection](docs/maintaining-icons.md).
- `src/lib/schema.ts`, `script/build-content.ts`: content validation; `npm run content:report` prints curation notes.
- `src/app.tsx`: the route table shared by the browser (`src/main.tsx`) and the prerender step (`src/entry-server.tsx`, `script/prerender.mjs`).
- `src/components/dock-view.tsx`: the Dock renderer. `home.tsx`, `dock-page.tsx`, `latest.tsx`, `browse.tsx`: pages.
- `src/components/suggest.tsx`, `src/lib/suggestion.ts`, `api/suggest.ts`, `server/http.ts`: the suggestion form and function.
- `src/components/composer.tsx`, `src/lib/dock.ts`: the optional builder and bounded v2 share links.
- `src/lib/catalog.json`, `legacy-catalog.json`: bundled apps and compatibility IDs.
- `tests/`: content, routes, sharing, suggestions and a check that the function loads under plain Node ESM.
- [Design](docs/design.md): tokens, type and motion rules.

## Credits

Structure and browsing follow [directoryyy (perfolios)](https://directoryyy.com/): one focal column, dense rows with hover previews, and quiet filters. Secondary references: [Link Lowdown](https://www.linklowdown.com/) (per-list sponsor slots, a dated Latest), [Macfolio](https://www.macfolio.com/) (rich detail pages) and [estejpg](https://www.estejpg.com/) (typography and timelines). Motion rules and the hover-preview timing are adapted from patterns in [cali.so](https://github.com/CaliCastle/cali.so) (MIT); no code, artwork or branding from it is used.

The supplied icons are optimized to 192px WebP; originals remain untouched. Sources are recorded in `ASSET_SOURCES.md` and `docs/icon-provenance.json`. DockFold is independent of the app developers. The logo uses the supplied Link Icon SVG; the Downloads and Trash glyphs are drawn for this site.
