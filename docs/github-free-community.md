# GitHub-free DockFold

Status: implementation plan; provider setup is pending. This document does not mean the new workflows are live.

## Product scope

DockFold should let visitors create a Dock, share its profile, request apps, contribute icons and vote on an app leaderboard. The owner reviews app submissions and publishes approved icons from a private area on DockFold. None of these workflows should require a GitHub account or a GitHub page.

The owner selected **email sign-in for voting**, with one vote per account per app. Public browsing, creating a Dock, sharing a profile, requesting an app and contributing an icon do not need visitor accounts. Owner review requires an authorized account.

## Current implementation

- **Create a Dock:** React picker using the bundled icon catalog; the draft is saved in browser storage.
- **Share a profile:** a validated version-2 URL fragment carries the app identifiers, name and note. It is unlisted and works without a server-side profile or GitHub account. Copies cannot be centrally revoked.
- **App requests:** `src/lib/requests.ts` sends visitors to the repository's `app-request.yml` GitHub issue form. Its fields are the app name, official website, optional icon and notes.
- **Leaderboard:** the browser reads open GitHub Issues labeled `app-request` through the public API. Counts come from the first post's `+1` reactions; ties use issue order. The site caches results for five minutes and loads at most 500 requests. Voting opens GitHub and requires a GitHub account. DockFold does not currently record votes itself.
- **Icon contributions:** the on-site form sends a bounded PNG and app details to `/api/icon-submissions`. Validated images and review details are stored privately in `dockfold-icons` on Vercel Blob. This already works without GitHub.
- **Review:** the owner inspects private uploads in Vercel, then adds approved icons and catalog entries through code changes. There is no on-site review dashboard yet.
- **Optional collection suggestion:** the Dock builder also has a GitHub-only “Suggest for the collection” handoff. This is distinct from sharing an unlisted Dock profile.

The code repository and pull requests can remain on GitHub. They are development tools, not requirements for visitors or routine app moderation.

## Replacement architecture

Keep React, Vite, the current design, the existing share-link format and private Vercel Blob storage. Add:

- **Clerk:** email authentication for voters and the owner. Validate sessions on the server. A verified email and a server-controlled owner allowlist govern reviewer access; hiding an admin button is not authorization.
- **Neon Postgres:** application requests, review status, published catalog records and votes. Use database constraints and transactions for uniqueness and concurrent actions.
- **Vercel endpoints:** accept requests, list public requests, add/remove the signed-in account's vote, serve approved catalog icons and perform authorized review actions. Database credentials and private storage access remain server-side.

The proposed setup uses Neon Free and Clerk Hobby, scoped to preview and development until the PR is ready for production review. Their marketplace setup currently requires the account owner to accept provider terms. Production activation must be checked before merging.

## Visitor flows

### Request an app

Use a short form on DockFold: app name, official website and optional notes. Check for a matching existing public request first and offer a link to vote. New requests enter private review; the confirmation must not imply immediate publication. App requests must remain possible without an icon.

### Contribute an icon

Keep the existing upload form, preview, file validation, receipt and Finder/Preview export guide. Link contributions to the matching request when possible. Both new contributions and existing pending uploads must appear in the owner's review area. Private notes and original uploads stay private until the owner deliberately publishes an approved icon.

### Vote and view the leaderboard

Anyone can browse approved requests. A visitor signs in with email to vote, then can add or remove their own vote. A database uniqueness constraint enforces one vote per account per app, including concurrent clicks and use on different devices. Show saved server counts; never invent votes or claim a failed vote succeeded.

Requests have clear states: awaiting review, open for votes, included, or declined. Only reviewed public requests appear on the leaderboard. An included app remains visibly completed rather than appearing to still need votes.

### Create and share a Dock

Preserve all existing static catalog IDs, legacy IDs, drafts and profile URLs. Approved new apps must become available in the picker without a repository edit. Their IDs must remain stable and readable in older profile links even if an app is later retired from the picker.

Load the approved catalog through a bounded, validated first-party endpoint. If that endpoint cannot load an app required by a saved profile, show a retryable loading problem; do not silently erase the draft or mislabel the link as malformed.

Keep Home and Latest as the curated starting collection. Remove the optional GitHub-only collection-suggestion handoff from the launch flow; visitors still create and share unlisted profiles. Public user-submitted Dock listings are outside these six launch features.

## Owner review flow

Provide a private review area on DockFold. The owner can inspect the app website, notes and icon preview, consolidate duplicates, approve a request for voting, decline it, and publish an approved icon to the catalog. Publishing must validate a stable catalog ID/category and create the optimized icon before making it publicly readable. A failed publish must not leave an incomplete public app.

All review reads, private-image reads and review writes require server-verified owner authorization. Private notes, contact/account data, rejected images and raw storage paths must never appear in public API responses. Contributor website URLs are data for the reviewer; the server must not fetch arbitrary submitted URLs.

## Migration and verification

1. Provision and verify the real authentication and database services. Keep the current production site working during the change.
2. Add database migrations, constraints, bounded input validation and authenticated endpoints. Use explicit `.js` extensions for deployed Node ESM imports.
3. Import existing pending icon submissions as private review items. Inspect existing public GitHub requests before migrating; do not fabricate email voters from GitHub reaction totals or publish pending submissions automatically.
4. Replace all GitHub request/vote links and API calls. Update the contribution destination copy, privacy page, maintenance guide and repository instructions.
5. Test unauthenticated, signed-in and unauthorized-reviewer cases; duplicate requests; concurrent votes; vote removal; failed writes; private-image protection; publish/retire behavior; and legacy/profile/draft compatibility.
6. Verify the real preview in desktop and mobile layouts, both themes, and email authentication. Test end-to-end submission → authorized review → publication → picker → shared profile. Remove temporary test records.
7. Leave the PR open with exact validation results and any owner setup that remains. Do not merge or change the production workflow without review.
