# Deployment and operations

Vercel project `dockfold`, team `estejpgs-projects`. Node 24 builds `npm run build`; static output is `dist`. One Node function lives at `api/suggest.ts`.

Public Docks are committed in `src/lib/collections.ts`. Adding a Dock is a code change and a deploy. Production browsing does not need environment variables.

## Optional suggestion inbox

Set these only if you want Submit to email you instead of returning a mailto/copy fallback:

| Name | Purpose |
|---|---|
| `SUGGESTION_INBOX` | Address that receives Dock suggestions |
| `RESEND_API_KEY` | Optional. When set with `RESEND_FROM`, the function emails the inbox |
| `RESEND_FROM` | Verified Resend from-address |

Without Resend, a configured inbox still produces a `mailto:` link for the visitor. Without an inbox, the visitor can copy the validated suggestion text. Never put the inbox address in client code except as that mailto response.

Local:

```sh
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Vite serves `/api/suggest` during `npm run dev`.

## Abuse controls

- JSON bodies are capped at 8 KB.
- Fields are length-limited; app IDs must exist in the bundled catalog.
- Writes require a matching Origin from DockFold.
- The server does not fetch submitted websites or render submitted HTML.
- A honeypot field rejects obvious bots.

A Vercel firewall rate limit on POST `/api/suggest` is worth adding once the form is public.

## Launch verification

Run `npm test`, `npm run lint` and `npm run build`. Check Home, Latest, a Dock page, Submit, Create, and an old share link at desktop and mobile widths, both themes.
