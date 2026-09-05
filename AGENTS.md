# DockFold

Static React + Vite website. No server functions, database, native app, analytics, or client-side credentials.

- Preserve stable catalog IDs: existing share links refer to them.
- Validate URL fragments and browser storage as untrusted input. Do not render request bodies as HTML.
- GitHub is the only external data source, loaded when visitors open App requests. Never embed an API token in browser code.
- Read README.md and docs/maintaining-icons.md for the app catalog and request workflow.
- Run npm test, npm run lint, and npm run build for functional changes. Verify affected interactions in a browser, including mobile.
