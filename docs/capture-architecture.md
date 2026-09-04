# Capture architecture

## What DockHunt does

DockHunt’s open-source CLI established a practical sequence:

1. Run `defaults export com.apple.dock -`.
2. Parse `persistent-apps`, which excludes the recent-apps section.
3. Find an `.icns` file in each `.app/Contents/Resources` directory.
4. Convert missing icons to PNG and upload them.
5. Open the website with repeated `app` query parameters.
6. Authenticate the person and create one database-backed Dock.

The original implementation uses positional XML traversal and selects the first `.icns` file it finds. That is compact, but it can choose the wrong resource, depends on the exported XML shape, and sends missing icon files before the user reviews the final Dock.

Sources: [DockHunt CLI](https://github.com/Basedash/dockhunt-cli), [DockHunt web app](https://github.com/Basedash/dockhunt).

## Dockfold v1

Dockfold keeps the reliable part—the native macOS preference export—and replaces the server handoff.

```text
com.apple.dock
      ↓ persistent-apps only
SwiftUI review list
      ↓ selected names + bundle IDs
Base64URL manifest
      ↓ opens /share?dock=…
Web review + profile details
      ↓
Portable /d/<payload> link
```

The payload schema is intentionally small and versioned:

```json
{
  "v": 1,
  "apps": [
    { "name": "Figma", "bundleIdentifier": "com.figma.Desktop" }
  ]
}
```

The web review adds `name`, `role`, `note`, and `category` before creating the final URL. Known bundle identifiers resolve to the repository’s local icon catalog. Unknown apps get a typographic fallback, so the capture never needs to upload a local icon.

## Why no backend yet

- A link can be shared immediately and renders on any device.
- No OAuth, profile database, retention policy, or account deletion workflow is required.
- The user sees the exact app list before the browser opens.
- Vercel can deploy the full experience as a deterministic Next.js app.
- The schema can later be accepted by an API without breaking v1 links.

The tradeoff is that new shared links do not automatically enter the Discover feed. A later, opt-in submission service can store a validated manifest only after the user asks to be listed.

## Security and privacy boundaries

- The helper reads only the user-level Dock preference domain.
- It ignores `recent-apps`, `persistent-others`, files, folders, and Trash.
- It exports app display names and bundle identifiers, not paths or icons.
- The final link is public to anyone who receives it; the review page states this clearly.
- URL payloads are encoding, not encryption. Secrets must never be placed in a Dock note.
- The app is suitable for direct distribution. A sandboxed Mac App Store build would require a different preference-access design.

## Later server-backed directory

If automatic public listings become necessary, keep the same manifest and add an explicit “Submit to Discover” action. Recommended Vercel architecture:

- Route Handler validates the v1 manifest with Zod.
- Vercel-managed Neon stores profiles and ordered app references.
- A short-lived edit token is returned once; its hash is stored.
- Rate limiting is provided by Vercel-managed Upstash.
- Unknown icon uploads remain a separate, opt-in moderation flow rather than part of capture.
