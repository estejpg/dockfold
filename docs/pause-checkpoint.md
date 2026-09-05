# Resume checkpoint — September 5, 2026

Work resumed from the September 4 checkpoint on `codex/github-free-community`, in [draft PR #6](https://github.com/estejpg/dockfold/pull/6). The new community implementation remains separate from production.

## Completed

- Provisioned Neon Free and Clerk Hobby for preview/development and applied the initial Drizzle migration. Email-code authentication works without a required password or social login; bot protection remains enabled.
- Implemented on-site requests, email voting, private owner review, duplicate merging, icon publication and dynamic catalog loading. Visitor workflows and routine moderation no longer require GitHub in this branch.
- Imported 85 newly supplied app icons, bringing the bundled picker to 141 across 12 categories. Sources retain their names/checksums in the mapping and provenance records. Two exact duplicate files and four folder images are excluded. All 56 previously imported source checksums are unchanged.
- Optimized the complete supplied set to 192px WebP (857,190 bytes total). Originals remain untouched. Safari, Obsidian and Terminal reuse their earlier IDs. The supplied logo, 18 curated Docks and existing share-link format are preserved.
- Corrected the leaderboard help text for visitors who are already signed in.

## Verification

- 22 automated tests, lint and production build pass. npm audit reports zero known vulnerabilities.
- Real-service integration checks passed for 12 simultaneous votes counting once, vote removal, duplicate merge with overlapping votes and icon transfer, stale-review rejection, private image protection, multipart upload/retry returning the same receipt, publication of an optimized icon, and continued icon access after retirement. Temporary integration records and files were removed.
- Missing/tampered sessions and foreign write origins were rejected. Real owner and voter email-code signup/sign-in worked; ordinary voters could not enter the review area. The previous signup wait did not reproduce as an application failure.
- Browser checks covered the builder and contribution form at 1440px and 390px, both themes, labeled controls and lazy-loaded images, with no horizontal overflow or application console errors.
- The browser request → owner approval → voter sign-in/vote → icon upload → private preview → publication → builder → new shared profile sequence passed against real development services. Votes survived a new sign-in; hiding the app removed it from the picker while the same share link still opened.
- The deployed Vercel preview served the real catalog, board and optimized published icon. Voter email sign-in and saved account votes worked; originals returned 401 signed out and 403 for an ordinary voter. The deployed review endpoint rejected anonymous access, invalid public icon IDs returned 404, and browser checks found no Clerk/CSP errors or mobile overflow. Owner moderation was exercised locally against the same real preview services; hosted reviewer access remains restricted to the real owner.
- Production's legacy icon inbox and open GitHub app-request list were rechecked on September 5: both were empty. No migration of old submissions was needed at this checkpoint; recheck at cutover because the old production form remains live.

## Remaining before production

Production Clerk/domain and an isolated production database still require configuration and verification. See [deployment.md](deployment.md). Keep the PR open and do not merge or deploy production until those prerequisites and owner review are complete. Preview uses development Clerk credentials and is not a claim that the new community features are live on the production site.

## Cleanup

Removed only this run's three temporary QA requests, their votes/catalog records, six private test files and two reserved Clerk development accounts. No real accounts or production records were changed.

## Source and local running

The remote branch is the durable source of truth. Work resumed in `/private/tmp/dockfold-community-20260904` because the older Documents checkout suffered iCloud offloaded-file reads. Clone the remote branch instead of continuing from that older partial copy.

For local work, pull the development environment into ignored `.env.local`, run `npm ci`, then `npm run dev:full`; open `http://127.0.0.1:3105`. Stop with Control-C. No secret files belong in source control or source archives. Reviewer configuration for hosted previews must contain only the real owner; reserved QA reviewer access is local and temporary.
