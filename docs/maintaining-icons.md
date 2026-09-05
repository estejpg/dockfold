# Adding apps and reviewing requests

1. Open [App requests](https://dockfold.vercel.app/#/requests). Its ranking uses 👍 reactions on the first post of each open issue labeled `app-request`. Search before creating duplicates; point duplicate requests to the original and close them so votes are not split.
2. Review the app’s official website and supplied PNG. A request does not automatically publish an image. Check that the image represents the app, has an appropriate source, and does not contain unrelated content. Prefer a square transparent PNG at 512 × 512 or greater; re-export to strip unnecessary metadata and keep the shipped image small.
3. Save the reviewed icon as `public/app-icons/<stable-id>.png`. Record its source in `ASSET_SOURCES.md`.
4. Add an entry to `src/lib/catalog.json`:

```json
{
  "id": "example-app",
  "name": "Example App",
  "category": "Design",
  "icon": "/app-icons/example-app.png"
}
```

The ID must be unique, lowercase, and contain only letters, digits, or hyphens. Do not rename or remove existing IDs: shared links reference them. Use Design, Development, Writing, Music, Browsers, or Communication; Communication currently appears under All. To add a visible category tab, update the filters in `composer.tsx`.

5. Run `npm test`, `npm run lint`, and `npm run build`. Check the icon in light and dark mode, search for it, and create a share link containing it. Verify the link in a separate browser.
6. Commit the catalog and PNG, deploy, then close the completed request. Closed requests disappear from the board when its cache refreshes. Never execute code or shell commands supplied in a request.

## How contributors can export an icon

These instructions are also on the live site at `#/contribute`:

1. Finder → Applications → select the app → Get Info (`⌘ I`).
2. Click the small icon at the top-left of Get Info and copy it (`⌘ C`).
3. In Preview, choose File → New from Clipboard (`⌘ N`).
4. Select the largest available thumbnail, then File → Export or its Export As context-menu action. Choose PNG and preserve transparency.
5. Drag the PNG into the request form’s optional icon field or a comment on the existing request. Include the app’s website and icon source.

Some apps and macOS versions expose different export options. A website-only request is welcome if a PNG cannot be exported.

## Activating the request form

GitHub uses issue templates from the default branch. The `app-request` label must exist before the form is used. This release creates that label and places the form in `.github/ISSUE_TEMPLATE/`. The public repository has Issues enabled. PNG uploads and voting happen in GitHub’s authenticated interface; no token belongs in the static site.
