# DockFold

React/Vite on Vercel, Clerk email authentication, Neon Postgres/Drizzle, and private Vercel Blob icons.

- Preserve stable bundled, legacy and published catalog IDs. Retire apps from the picker without breaking shared Docks.
- Validate URL fragments, local storage, request bodies and live catalog responses. Never render submitted HTML or fetch contributor-provided websites on the server.
- Visitor workflows and routine moderation must not require GitHub.
- Verify Clerk sessions and primary email on the server. Review and private-image reads require the server-controlled reviewer allowlist. Never trust browser roles or expose secret keys.
- Original icons and notes stay private. Only deliberately published optimized icons become public.
- Keep body limits, image validation, shared write limits and the Vercel upload firewall rule. Database uniqueness enforces one vote per account/app.
- Use transactions and revision checks for review operations. A failed catalog load must not erase a draft.
- Use explicit `.js` import extensions in deployed server modules.
- Apply versioned Drizzle migrations to the intended development/preview database. Never change production, merge a PR or expose test accounts without authorization.
- Read README.md and docs/deployment.md. Run npm test, npm run lint and npm run build for functional changes. Verify affected desktop/mobile flows and authenticated/unauthorized cases against real preview services.
