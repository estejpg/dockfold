# Deployment and operations

## Vercel

Project: `dockfold` in `estejpgs-projects`.

- Framework: Vite (explicit in `vercel.json`).
- Install: `npm ci`; build: `npm run build`; output: `dist`.
- Runtime used for builds: Node 24.
- Upload function: `/api/icon-submissions`, Node runtime; source in `api/` and `server/`.
- Private Blob store: `dockfold-icons` (`store_b6vTim2xA3883Lbw`), region `sfo1`, connected to production, preview and development.
- Server environment variable: `ICON_INBOX_STORE_ID=store_b6vTim2xA3883Lbw`. The Blob SDK uses Vercel's rotating OIDC credentials. Store connection variables are managed by Vercel; never prefix them with `VITE_`.
- No database, visitor login, email service, or Notion configuration.
- Firewall rule **Limit icon uploads**: POST `/api/icon-submissions`, 10 requests per IP per 600 seconds, fixed window, 429 on excess. Vercel counters are regional. Keep this rule enabled before accepting uploads.

```sh
npx vercel link --project dockfold --yes
npx vercel deploy --yes
# After preview validation:
npx vercel deploy --prod --yes
```

The repository includes the complete optimized catalog icons. Future Git deployments do not depend on files from a personal computer. Configure a static fallback to `index.html` for Home, Latest, Submit, and curated detail paths on other hosts. Vercel already has this fallback. Old fragment share links remain readable. Security headers limit scripts, fonts, images, and connections to the site and the GitHub API. The static rewrite excludes `/api/`, so uploads reach the function. Selected image previews use local data URLs. Share fragments are never required by a server route.

If connecting Vercel to GitHub, select `estejpg/dockfold`, repository root, Vite, and `main` for production. GitHub Actions checks tests, lint, and the production build on pull requests and main.

## Launch checks

- Home shows 18 curated Docks in six groups; search by an app name and try each category.
- Latest uses real addition dates. All 18 launch Docks share the launch date.
- Open Submit with no browser data: no apps selected, Create share link disabled.
- Select apps; reorder and remove them; reload to confirm the local draft.
- Name the Dock; create a link; open it in a different browser with no local data.
- Copy a curated/shared Dock with Make it yours; Restore my previous draft recovers the prior nonempty draft.
- Check phone widths, keyboard focus, light/dark mode, and reduced motion.
- Open App requests; verify real GitHub responses or its clear fallback.
- Open Request an app; verify the live GitHub form has app name, website, and optional icon fields. Do not submit a fake request to test it.
- Create a share link, open Suggest for the collection, and verify GitHub prefills the full fragment URL, name, and note. The `dock-submission` label and template must exist on the default branch. Do not post a fake submission.
- Verify that a real request’s first-post 👍 reaction changes its ranking after Refresh votes.

## GitHub API behavior

Only `/requests` fetches GitHub. The client reads open issues with the `app-request` label in pages of 100, up to 500, rejects malformed entries, excludes pull requests, and renders titles as plain text. Request URLs are constructed from the fixed repository and a validated issue number. It never renders issue bodies, attached images, remote HTML, or an arbitrary supplied URL.

The leaderboard counts the `+1` reaction, not all reaction types. Ties follow issue creation order. Cache freshness is five minutes; Refresh votes explicitly fetches again. Public reads are unauthenticated, so GitHub rate limits apply to the visitor’s address. A ten-second deadline cancels a stalled fetch. Pagination deduplicates issue numbers; future-dated cache entries are rejected. A failure shows an error, keeps any prior results with a stale-data label, and offers a direct GitHub link. It does not invent counts or claim a vote was recorded on DockFold.

## Data and recovery

Browser draft key: `dockfold:draft:v2`. Theme key: `dockfold:theme`. Request cache: `dockfold:requests:v1` in session storage. Shared data is validated version-2 JSON encoded in the URL fragment, capped at 4,096 encoded characters and 40 distinct catalog apps. No central profile exists to delete or recover. Lost drafts can be recreated from an existing share link.

Static sharing intentionally replaces the earlier deletion-key model. Explain this limitation wherever sharing is offered: saved copies of a link cannot be revoked. Do not add sensitive content to Dock names or notes.

## Icon inbox operations

[Open the private inbox](https://vercel.com/estejpgs-projects/~/stores/blob/store_b6vTim2xA3883Lbw) → Browser → `submissions`. Each folder has `icon.png` and `details.json`. Only authorized Vercel maintainers can view/download them. Preview/test uploads use `preview/submissions`. There is no email notification: check this inbox for arrivals. Review, publish approved catalog additions through GitHub, then delete the reviewed folder's files. See [maintaining icons](maintaining-icons.md).

The form sends multipart data only on Submit. Both layers enforce a 2 MB PNG and square dimensions from 256 to 2048px. The server bounds the request stream, verifies PNG bytes, fully decodes/re-encodes the image with a pixel limit, strips embedded metadata, validates app details, and never fetches provided URLs. The endpoint has no read/list method. Files use private access; neither Blob URLs nor credentials appear in receipts. SHA-256 paths make identical retries reuse a submission. The form reports success only after both image and details are saved. A storage failure retains the form for retry; a failure between writes can leave one orphan image for maintainer cleanup.

Local full-stack testing: use Node 24, `npx vercel env pull .env.local`, then `npx vercel dev --listen 3105`. Local origins are restricted to `http://localhost:3105` and `http://127.0.0.1:3105`; local uploads use the preview prefix. `npm run dev` remains a frontend-only preview. Never commit `.env.local`.

For a new custom domain, verify that it matches `VERCEL_PROJECT_PRODUCTION_URL`, or add that exact origin in `api/icon-submissions.ts` and redeploy. Do not allow arbitrary origins. Inspect Vercel Firewall and storage usage if the inbox attracts spam. The endpoint is anonymous: the honeypot, file checks, and IP limit reduce abuse but do not identify contributors. Blob storage and function usage follow the Vercel plan's included allowances and limits.

The earlier `dockfold-profiles` store (`store_SzyAIkscjAOc2j03`) is separate and is not used by this inbox. Its contents and deletion restrictions were left untouched.

## Reference documentation

- [Vite static deployment](https://vite.dev/guide/static-deploy.html)
- [GitHub issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [GitHub public API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Apple icon copying](https://support.apple.com/guide/mac-help/mchlp2313/mac)
- [Preview export](https://support.apple.com/guide/preview/prvw0e8da223/mac)
