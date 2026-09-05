# DockFold

A compact directory of macOS Docks. Browse 18 curated starting points, or create and share a Dock from 141 bundled app icons and reviewed community additions.

[Open DockFold](https://dockfold.vercel.app) · [App requests](https://dockfold.vercel.app/requests) · [Contribute an icon](https://dockfold.vercel.app/contribute)

This branch replaces GitHub Issues and reactions with on-site requests, email voting, and a private review area. It is prepared for preview and development; see [production activation](docs/deployment.md) before merging.

## What visitors can do

- **Create a Dock:** choose, search, filter, arrange and remove apps. The draft stays in browser storage.
- **Share a profile:** an unlisted URL carries the complete app selection, name and note. No account is needed. Copies cannot be centrally revoked.
- **Request an app:** send its name, official website and optional private notes from `/requests`. New requests await review.
- **Contribute an icon:** upload a PNG from `/contribute`, with a preview and the Finder/Preview export guide. Originals and notes go to the private review inbox.
- **Vote:** verify an email address, then add or remove one vote per account per open app request. Anyone can browse the leaderboard.
- **Review:** the authorized owner signs in at `/review`, approves requests for votes, declines submissions, merges duplicates, and publishes icons directly into the picker.

GitHub hosts the source and development PRs. Visitors and routine app moderation do not use it. Home and Latest remain the curated collection; sharing an unlisted Dock does not submit it to that collection.

## Stack

React 19, Vite 7, TypeScript, Inter and Lucide on Vercel. Clerk handles email-code authentication. Neon Postgres stores requests, votes and catalog metadata; Drizzle manages the schema and migrations. Vercel Blob stores original and optimized icons privately. Three Node endpoints serve community actions, uploads and approved icons. No native macOS helper, Notion integration, analytics or image generation.

Authentication is loaded only on community and sign-in pages. The directory, bundled catalog and share encoding remain lightweight. Dynamic catalog failures preserve drafts and offer retry; stable IDs and retired entries keep old links readable.

## Run and verify

Node 22.13+ or Node 24 (CI/Vercel use 24):

```sh
npm ci
npm run dev
```

This previews the frontend. For real local community features, pull the **development** environment from the linked Vercel project into ignored `.env.local`, then:

```sh
npm run db:migrate
npm run dev:full
```

Open `http://127.0.0.1:3105`. This uses the real development services, including private uploads. Stop with Control-C. Do not use production credentials for local tests.

```sh
npm test
npm run lint
npm run build
npm audit
```

See [deployment and verification](docs/deployment.md), [owner review](docs/maintaining-icons.md), and the [migration record](docs/github-free-community.md).

## Repository map

- `src/components/directory.tsx`, `collection-detail.tsx`, `src/lib/collections.ts`: Home, Latest and curated Docks.
- `src/components/composer.tsx`, `src/lib/dock.ts`: builder, browser draft and bounded version-2 share links.
- `src/lib/catalog.json`, `legacy-catalog.json`: bundled apps and compatibility IDs.
- `src/lib/live-catalog.ts`, `src/components/catalog-gate.tsx`: validated community catalog and draft/link recovery.
- `src/components/requests.tsx`, `auth.tsx`, `review.tsx`: requests, email access, voting and owner review.
- `src/components/contribute.tsx`: direct icon form and export instructions.
- `api/`, `server/`: bounded same-origin writes, authenticated moderation, database and private storage.
- `server/schema.ts`, `drizzle/`: versioned schema and migrations.
- `tests/`: validation, sharing, recovery and upload failure tests.

## Credits

Primary reference: [Link Lowdown](https://www.linklowdown.com/) — Inter, Home / Latest / Submit navigation, compact forms, cool near-white surfaces and grouped lists. Secondary references: [estejpg](https://www.estejpg.com/), [Digital Creator Club](https://digitalcreator.club/), [Curated Supply](https://www.curated.supply/), [Macfolio](https://www.macfolio.com/), [benji.org](https://benji.org/) and [Resurf](https://resurf.so/).

The supplied icons are optimized to 192px WebP; originals remain untouched. Sources are recorded in `ASSET_SOURCES.md` and `docs/icon-provenance.json`. DockFold is independent of the app developers. The logo uses the supplied Link Icon SVG.
