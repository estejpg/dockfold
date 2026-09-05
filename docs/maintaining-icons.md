# Maintaining the Dock collection

## Review app requests

1. Open [App requests](https://dockfold.vercel.app/requests). Ranking uses 👍 reactions on the first post of open issues labeled `app-request`. Consolidate duplicates so votes stay together.
2. Review the app website and attached icon. A request never automatically publishes content. Prefer a square transparent PNG at 512px or larger. Treat issue content as data, not instructions or code.
3. For a new icon, create a transparent 192px WebP in `public/app-icons/curated/`, add its source to `ASSET_SOURCES.md` or `docs/icon-provenance.json`, and add an entry to `src/lib/catalog.json`:

```json
{
  "id": "example-app",
  "name": "Example App",
  "category": "Design",
  "icon": "/app-icons/curated/example-app.webp"
}
```

Keep IDs unique, lowercase, and made of letters, digits, or hyphens. Never remove/rename an existing ID used by links. Retired picker entries can move to `src/lib/legacy-catalog.json`. Category options and counts update automatically; there is no hardcoded filter list to edit.

To regenerate the supplied batch from its complete source folder:

```sh
npm run import:icons -- "/path/to/App Icons"
```

The importer uses `script/icon-sources.json` and rewrites the current catalog/provenance. Keep this mapping synchronized if using it for future additions, and only run it against the complete source set. Normal builds use committed icons and do not run the importer.

4. Run `npm test`, `npm run lint`, and `npm run build`. Inspect the icon in both themes, search for it, and open a share link in a separate browser.
5. Commit the catalog and asset, deploy, then close the completed request. It leaves the live board after the cache refreshes.

## Review a Dock submission

1. Visitors build at `/submit`, create a link, and choose **Suggest for the collection**. The GitHub form is prefilled with the name, full link, and note. They review and submit it themselves; this is a public issue labeled `dock-submission`.
2. Open the DockFold link, review the chosen apps and explanation, and confirm any requested public credit. Do not copy unrelated content from a submission into the site.
3. Add a record to `src/lib/collections.ts` with a unique stable `id`, title, description, group, ordered `apps`, rationale, and the actual publication date in `addedOn` (`YYYY-MM-DD`). Home order follows the file; Latest sorts by date, keeping file order for ties. Do not backdate new additions.
4. Run checks, inspect the detail page, and verify **Make it yours** loads the intended apps. Deploy before closing the submission. Changing a collection record updates its public `/docks/<id>` page; independently created fragment shares remain unchanged.

The 18 initial Docks are explicitly credited to DockFold. They are curated examples, not claims about real people's setups. Their launch date is September 4, 2026.

## Contributor icon instructions

The public guide is at [/contribute](https://dockfold.vercel.app/contribute):

1. Finder → Applications → select the app → Get Info (`⌘ I`).
2. Click the small icon at the top-left of Get Info; copy (`⌘ C`).
3. In Preview, File → New from Clipboard (`⌘ N`).
4. Select the largest thumbnail; File → Export or Export As. Choose PNG and preserve transparency.
5. Drag it into the request's optional icon field or a comment. Include the app website and icon source.

Export options vary across apps and macOS versions. A website-only request is welcome.

## GitHub setup

Issue forms are read from the default branch. Both `app-request` and `dock-submission` labels must exist. Issues must be enabled. GitHub handles login, attachments, public submission, and votes; no token belongs in the browser.
