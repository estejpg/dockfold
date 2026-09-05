# Deployment and operations

## Provisioned preview and development services

Vercel project `dockfold`, team `estejpgs-projects`. Node 24 builds `npm run build`; static output is `dist`. Three Node functions live in `api/`.

- **Neon Free:** resource `dockfold-community`, `store_DqXXz1jpSmCuVhuO`, connected to preview/development only. Neon Auth is disabled because Clerk provides authentication.
- **Clerk Hobby:** resource `dockfold-community`, `ir_uhX4NQbXDErMisRp`, connected to preview/development only. Email code sign-up/sign-in and verification are enabled; passwords are not required; social login is disabled. Bot protection remains enabled.
- **Private Blob:** `dockfold-icons`, `store_b6vTim2xA3883Lbw`, connected to all environments. Preview paths are separate from production paths.

Clerk development dashboard: https://dashboard.clerk.com/apps/app_3ItNY0dgLSLUfh4Nn6tHYJLQZTm/instances/ins_3ItNY4TmV9E8vUT2K23DwmACy3u

Required server variables:

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres runtime connection |
| `DATABASE_URL_UNPOOLED` | Direct connection for versioned migrations |
| `CLERK_SECRET_KEY` | Server session/user verification |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public Clerk application identifier; the only key mapped into Vite |
| `DOCKFOLD_REVIEWER_EMAILS` | Comma-separated verified owner emails; server-side authorization |
| `ICON_INBOX_STORE_ID` | Private Blob store ID |

Vercel supplies rotating OIDC Blob credentials. Managed integration keys remain server-side except the explicitly named Clerk publishable key. Never expose all environment variables through Vite. The configured reviewer email matches the verified Vercel owner. Its value is kept in server configuration.

## Before production activation

**Do not merge this PR directly into production until these steps are complete.** Production remains on the previously released site while the PR is open.

1. Configure the intended production Clerk domain/instance and production keys, with the same email-only settings and bot protection. Development test keys are not production authentication.
2. Connect an isolated production Neon database/branch and run the committed migrations against its direct URL. Preview/development data must not become production requests or voters.
3. Set production `DOCKFOLD_REVIEWER_EMAILS`. Never include a QA/test account.
4. Update the exact Clerk Frontend API hostname in `vercel.json`'s CSP. Keep Clerk's documented bot-protection hosts. For a custom app domain, ensure it is in `server/http.ts`'s exact origin list (normally supplied by Vercel deployment variables).
5. Verify the owner sign-in, anonymous request/upload, private-image denial, public votes and full approve/publish/share flow in the intended environment.
6. Inspect the existing inbox and public GitHub requests again at cutover. At initial migration inspection both were empty. New uploads can arrive while the old production site is live; import them before switching. Do not fabricate email-account votes from GitHub reactions.
7. After review and authorization, merge/deploy. Keep the previous deployment available for rollback. The migration is additive; rollback does not require deleting data.

The current Clerk CSP hostname is explicitly the development instance `civil-calf-9983.clerk.accounts.dev`. Its use here is intentional for the preview. Production activation is a separate configuration step.

## Database migrations and local running

```sh
npx vercel env pull .env.local --environment development
npm ci
npm run db:migrate
npm run dev:full
```

Open `http://127.0.0.1:3105`, stop with Control-C. This uses real preview/development services. `.env.local` is ignored. `npm run dev` serves only the frontend.

Change `server/schema.ts`, generate a reviewed migration with `npm run db:generate`, then apply it to the intended isolated environment with `npm run db:migrate`. The migrator uses `DATABASE_URL_UNPOOLED`, verifies TLS, and records applied migrations in Drizzle's history. Do not run schema changes in request handlers or in every build.

The runtime uses a bounded three-connection pool with connection/statement deadlines. Vercel's pool lifecycle helper releases idle connections during suspension. Votes have a composite database primary key `(request_id, user_id)`. Review operations lock rows and check revisions; merge locks use a consistent order.

## Abuse controls and privacy boundaries

- Existing Vercel firewall **Limit icon uploads** remains enabled: POST `/api/icon-submissions`, 10 requests per IP/600 seconds.
- Shared database limits allow 20 anonymous form submissions per address/hour and 120 vote changes per account/hour. Only keyed address digests are retained; expired counters are pruned as submissions arrive. Vercel's forwarding headers provide the production client address.
- Anonymous JSON bodies are capped at 8 KB. Uploads are capped at 2 MB plus bounded multipart overhead, with actual PNG decoding and pixel limits. No submitted website is fetched by the server.
- Review reads/writes and original-image reads verify the session, verified primary email and reviewer allowlist. Public APIs omit notes, account identifiers, original files and storage paths.
- Browser drafts and version-2 share fragments remain bounded to 40 apps and 4,096 encoded characters. The public catalog accepts at most 5,000 validated stable entries. Unavailable dynamic entries cause a retryable page without overwriting the draft.
- Published icons can be cached publicly; original-image responses and authenticated JSON use `no-store`. Retiring an app only hides it from the picker so old links still work.

## Launch verification

Run `npm test`, `npm run lint`, `npm run build` and `npm audit`. Check desktop/mobile and both themes, keyboard focus, error recovery and reduced motion.

Against real preview services:

1. Submit an app without signing in. Verify it stays off the public leaderboard until approved.
2. Sign in with email as owner. Review its website and private notes; approve for votes.
3. Sign in as a voter in two independent browser sessions. Vote concurrently; verify one saved vote. Remove it and verify both sessions agree after refresh.
4. Check signed-out and ordinary signed-in users cannot read the review queue/original icons or perform moderation. Reject tampered tokens and mismatched origins.
5. Upload the provided PNG through the form. Verify the same receipt on retry, private storage, owner preview, and successful publication into the picker.
6. Create/share a Dock containing the new app in a fresh browser. Hide the app from the picker and verify the old share still opens.
7. Exercise duplicate merge, stale review rejection, failed writes, catalog outage/retry, and the bundled/legacy Dock links.
8. Remove only the temporary QA submissions/files/votes and development test accounts. Leave the PR open.

Clerk test addresses with `+clerk_test` use the reserved email verification code without sending real email. Browser automation can use Clerk's documented testing tokens in development; never disable production bot protection for tests.
