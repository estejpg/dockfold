# DockFold

A small, static website for building and sharing a Dock from a curated collection of Mac app icons.

**[Open DockFold](https://dockfold.vercel.app)** · **[Request an app or vote](https://dockfold.vercel.app/#/requests)**

Pick apps, arrange them with the earlier/later controls, give the Dock a name, and create a share link. Drafts stay in the browser. Shared links carry the complete selection in the URL fragment; they work in another browser without an account or database. They are unlisted and **cannot be centrally revoked**.

App requests, PNG attachments, and votes live in this repository’s GitHub Issues. The site reads public issues labeled `app-request` and ranks their first-post 👍 reactions. Visitors sign into GitHub to submit requests or vote. Only the App requests page contacts GitHub.

## Stack

React 19, Vite 7, TypeScript, Inter, and Lucide, deployed as static assets on Vercel. This follows estejpg-site’s React/Vite approach. No server functions, database, macOS helper, secrets, analytics, or Notion integration are needed.

## Run locally

Use Node 22.13+ or Node 24 (CI and Vercel use 24).

```sh
npm ci
npm run dev
```

Open the local address shown in the terminal. Stop with Control-C.

```sh
npm test
npm run lint
npm run build
npm run preview
```

The production site is in `dist/`. Host that directory on a static host, or deploy with Vercel. The `#/...` routes and share links require no application server.

## Maintain the collection

See [the icon maintenance guide](docs/maintaining-icons.md). Add a reviewed PNG under `public/app-icons/` and one entry in `src/lib/catalog.json`. Keep IDs stable so existing links keep working. The available-app count, search, and category filters use this catalog.

See [deployment and operations](docs/deployment.md) for the exact GitHub and Vercel setup, rate-limit behavior, and launch checks.

## Repository map

- `src/components/composer.tsx`: app picker, order controls, browser draft, and sharing.
- `src/lib/dock.ts`: bounded, versioned share encoding and validation.
- `src/lib/catalog.json`: curated apps; IDs are public link identifiers.
- `src/components/requests.tsx`: public request leaderboard and failure states.
- `src/lib/requests.ts`: validated GitHub reads, vote sorting, short-lived cache.
- `.github/ISSUE_TEMPLATE/app-request.yml`: request form with optional icon attachment.
- `src/components/pages.tsx`: examples, shared Docks, icon export instructions, privacy.

## Scope and limitations

The initial collection contains 10 apps. There are no user uploads directly to the site and no automatic inclusion of submitted icons. The maintainer reviews and publishes additions. Unknown or malformed shared app IDs show an explanatory error rather than loading arbitrary images. A link can contain up to 40 distinct catalog apps; names are limited to 60 characters and notes to 180.

The public GitHub API has per-IP limits. Votes may be cached for five minutes. If GitHub is unavailable or limits a visitor, the site preserves previously loaded results and links to the GitHub board. Up to 500 open requests are loaded; larger boards show an explicit limit and an all-requests link. A GitHub account can add one 👍 reaction to each request; this is community feedback, not an abuse-proof identity system.

Earlier native capture and private-storage work is outside the current launch architecture. The prototype was preserved in local git history before the static rebuild. Old `/d/` and `/p/` URLs are not current share links.

## Credits

Design references: [estejpg](https://www.estejpg.com/), [Link Lowdown](https://www.linklowdown.com/), and [Digital Creator Club](https://digitalcreator.club/). Existing app icon sources remain documented in [ASSET_SOURCES.md](ASSET_SOURCES.md). Icons identify their respective apps; DockFold is independent of those developers.
