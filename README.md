# DockFold

A directory of macOS Docks. Browse setups by category, see what was added last, or suggest a Dock for the gallery.

[Open DockFold](https://dockfold.vercel.app) · [Latest](https://dockfold.vercel.app/latest) · [Submit](https://dockfold.vercel.app/submit)

The site is static: public Docks live in git. Submit emails the owner (or opens your mail app) after the form is validated. Listing is not automatic. Create-your-own share links still work and stay unlisted. See the [restart plan](docs/restart-plan.md) and [deployment](docs/deployment.md).

## What visitors can do

- **Browse:** Home groups Docks by category. Latest lists them by date. Each Dock has a page with its apps and a short rationale.
- **Suggest a Dock:** a short form on `/submit` — name, description, category, apps from the catalog, optional note and credit. No account is needed. Every suggestion is reviewed before it can appear on Home.
- **Create a private Dock:** `/create` still builds an unlisted share link in the browser. That link does not submit the Dock to the gallery.

## Stack

React 19, Vite 7, TypeScript, Inter and Lucide on Vercel. Public Docks are committed records. One Node function at `/api/suggest` validates suggestions. If `RESEND_API_KEY` is set it emails the owner; otherwise it returns a mailto or copyable text. No Clerk, Neon, or visitor accounts. No native macOS helper, analytics or image generation.

## Run and verify

Node 22.13+ or Node 24:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Stop with Control-C. Optional `.env.local` values from `.env.example` enable email delivery; without them the form still validates and offers copy/mailto.

```sh
npm test
npm run lint
npm run build
```

## Repository map

- `src/components/directory.tsx`, `collection-detail.tsx`, `src/lib/collections.ts`: Home, Latest and published Docks.
- `src/components/suggest.tsx`, `src/lib/suggestion.ts`, `api/suggest.ts`: Submit form and validation.
- `src/components/composer.tsx`, `src/lib/dock.ts`: optional builder and bounded version-2 share links.
- `src/lib/catalog.json`, `legacy-catalog.json`: bundled apps and compatibility IDs.
- `tests/`: gallery, sharing and suggestion tests.

## Credits

Primary reference: [Link Lowdown](https://www.linklowdown.com/) — Inter, Home / Latest / Submit navigation, compact forms, cool near-white surfaces and grouped lists. Secondary references: [estejpg](https://www.estejpg.com/), [Digital Creator Club](https://digitalcreator.club/), [Curated Supply](https://www.curated.supply/), [Macfolio](https://www.macfolio.com/), [benji.org](https://benji.org/) and [Resurf](https://resurf.so/).

The supplied icons are optimized to 192px WebP; originals remain untouched. Sources are recorded in `ASSET_SOURCES.md` and `docs/icon-provenance.json`. DockFold is independent of the app developers. The logo uses the supplied Link Icon SVG.
