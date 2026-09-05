# DockFold

React + Vite website with one Vercel upload function and a private Blob inbox. No database, native app, analytics, or client-side credentials.

- Preserve stable catalog IDs: existing share links refer to them.
- Validate URL fragments and browser storage as untrusted input. Do not render request bodies as HTML.
- GitHub is loaded only on App requests. Icon submissions use the same-origin `/api/icon-submissions` endpoint. Never embed a credential in browser code.
- Uploads are private, validated and reviewed manually. Never publish submissions automatically or fetch contributor-provided URLs.
- Keep the upload endpoint behind the documented Vercel rate limit. Match file constraints on client and server.
- Read README.md and docs/maintaining-icons.md for the app catalog and request workflow.
- Run npm test, npm run lint, and npm run build for functional changes. Verify affected interactions in a browser, including mobile.
