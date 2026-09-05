# DockFold

A small, static directory of considered macOS Docks. Browse 18 curated starting points, or build and share your own from 56 supplied app icons.

**[Open DockFold](https://dockfold.vercel.app)** · **[Request an app or vote](https://dockfold.vercel.app/requests)**

**Home** groups Docks by purpose. **Latest** lists additions by publication date. **Submit** lets you build a Dock and optionally suggest it for the reviewed collection.

Pick apps, arrange them with the earlier/later controls, give the Dock a name, and create a share link. Drafts stay in the browser. Shared links carry the complete selection in the URL fragment; they work in another browser without an account or database. They are unlisted and **cannot be centrally revoked**.

App requests, PNG attachments, and votes live in this repository’s GitHub Issues. The site reads public issues labeled `app-request` and ranks their first-post 👍 reactions. Visitors sign into GitHub to submit requests or vote. Only the App requests page contacts GitHub. The Contribute an icon page separately accepts direct PNG uploads into a private Vercel review inbox; it does not create GitHub issues.

## Stack

React 19, Vite 7, TypeScript, Inter, and Lucide, deployed on Vercel. Pages are static assets; one Node function handles icon contributions. This follows estejpg-site’s React/Vite approach. Vercel Blob stores icon submissions privately, using server-side OIDC authentication. No database, macOS helper, visitor accounts, analytics, or Notion integration are needed.

## Run locally

Use Node 22.13+ or Node 24 (CI and Vercel use 24).

```sh
npm ci
npm run dev
```

Open the local address shown in the terminal. Stop with Control-C. `npm run dev` previews the frontend only; use a Vercel preview deployment for uploads. See the deployment guide for local full-stack testing.

```sh
npm test
npm run lint
npm run build
npm run preview
```

The production frontend is in `dist/`. Deploy with Vercel to include the upload function. A frontend-only static host can serve the directory and sharing pages but cannot accept icon uploads. Ordinary page URLs use a static fallback to `index.html` (configured in `vercel.json`). Share data stays after `#dock=` and requires no application server. Earlier version-2 hash links still work.

## Maintain the collection

See [the maintenance guide](docs/maintaining-icons.md). Supplied PNGs are optimized into 192px WebP files; originals stay untouched. Build/deployment uses committed assets and never requires the source folder. Keep IDs stable so existing links keep working. Picker counts and category filters follow the catalog automatically.

Curated Docks live in `src/lib/collections.ts`, with stable slugs, app order, descriptions, groups, and actual publication dates. Submissions open a prefilled GitHub issue for the visitor to review and post. Nothing is automatically published.

See [deployment and operations](docs/deployment.md) for the exact GitHub and Vercel setup, rate-limit behavior, and launch checks.

## Repository map

- `src/components/directory.tsx`: Home and Latest.
- `src/components/collection-detail.tsx`: curated Dock pages and customization.
- `src/lib/collections.ts`: the reviewed collection and publication dates.
- `src/components/composer.tsx`: app picker, order controls, browser draft, and sharing.
- `src/lib/dock.ts`: bounded, versioned share encoding and validation.
- `src/lib/catalog.json`: 56 supplied apps; IDs are public link identifiers.
- `src/lib/legacy-catalog.json`: five retired picker entries retained for existing links.
- `script/import-icons.mjs`: repeatable local PNG optimization; provenance in `docs/icon-provenance.json`.
- `src/components/requests.tsx`: public request leaderboard and failure states.
- `src/lib/requests.ts`: validated GitHub reads, vote sorting, short-lived cache.
- `.github/ISSUE_TEMPLATE/app-request.yml`: request form with optional icon attachment.
- `.github/ISSUE_TEMPLATE/dock-submission.yml`: reviewed collection submission form.
- `src/components/pages.tsx`: shared Docks and privacy.
- `src/components/contribute.tsx`: direct icon form, previews and export instructions.
- `api/icon-submissions.ts` and `server/icon-submissions.ts`: bounded PNG validation and private storage.

## Scope and limitations

The collection contains 18 premade Docks across everyday use, design, photo/video, development, research/writing, and collaboration. The picker offers 56 supplied icons. Four folder assets and one exact duplicate Messages icon were excluded; named app variants remain available. Five older icons remain readable in old share links but are not offered in the picker. Direct PNG uploads go to a private review inbox. There is no automatic inclusion of submitted icons. The maintainer reviews and publishes additions. Unknown or malformed shared app IDs show an explanatory error rather than loading arbitrary images. A link can contain up to 40 distinct catalog apps; names are limited to 60 characters and notes to 180.

The public GitHub API has per-IP limits. Votes may be cached for five minutes. If GitHub is unavailable or limits a visitor, the site preserves previously loaded results and links to the GitHub board. A ten-second deadline ends stalled requests. Up to 500 open requests are loaded; larger boards show an explicit limit and an all-requests link. A GitHub account can add one 👍 reaction to each request; this is community feedback, not an abuse-proof identity system.

Earlier native capture work is outside the current launch architecture. The icon inbox is separate from that prototype. The prototype was preserved in local git history before the static rebuild. Old `/d/` and `/p/` URLs are not current share links.

## Credits

The main visual reference is [Link Lowdown](https://www.linklowdown.com/): Inter, Home / Latest / Submit, compact navigation, cool near-white surfaces, and grouped lists. Secondary references are [estejpg](https://www.estejpg.com/), [Digital Creator Club](https://digitalcreator.club/), [Curated Supply](https://www.curated.supply/), [Macfolio](https://www.macfolio.com/), [benji.org](https://benji.org/), and [Resurf](https://resurf.so/). Icon sources are documented in [ASSET_SOURCES.md](ASSET_SOURCES.md). Icons identify their respective apps; DockFold is independent of those developers.
