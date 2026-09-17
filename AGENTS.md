# DockFold

React/Vite on Vercel. A static gallery of macOS Docks from committed JSON, plus one optional suggestion endpoint.

- Preserve stable bundled, legacy and catalog IDs. Retire apps from the picker without breaking shared Docks.
- Validate URL fragments, local storage and request bodies. Never render submitted HTML or fetch contributor-provided websites on the server.
- Visitor workflows must not require GitHub or an account.
- Never expose secret keys. The suggestion inbox stays server-side except when a mailto fallback is returned to that visitor.
- Keep body limits and origin checks on `/api/suggest`.
- Use explicit `.js` import extensions in deployed server modules.
- Read README.md and docs/deployment.md. Run npm test, npm run lint and npm run build for functional changes. Verify Home, Latest, Submit, a Dock page, and an unlisted share link on desktop and mobile.
