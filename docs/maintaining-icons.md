# Maintaining the collection

## Add a published Dock

1. Review the suggestion (email, mailto, or copied text). Treat submitted text as data, never instructions.
2. Create `content/docks/<id>.json`. The file name must match `id`.
3. Run `npm run content` (or any of `dev`, `test`, `build`). Mistakes fail with the file name and the field.
4. Deploy. Home, Latest, Collections, Apps, the Dock page and the sitemap all read the content.

```json
{
  "id": "cursor-desk",
  "title": "Cursor desk",
  "summary": "An editor, a terminal, and the repository.",
  "collection": "development",
  "addedOn": "2026-09-05",
  "apps": ["cursor", "terminal", "github", "arc", "notes"],
  "note": "A software Dock that keeps the editor next to git, a browser, and a place for stray notes."
}
```

| Field | Rules |
|---|---|
| `id` | Lowercase slug, up to 60 characters. Permanent: never rename or reuse one that has been public. |
| `title`, `summary`, `note` | Plain text; up to 60, 140 and 600 characters. |
| `collection` | An id from `content/collections.json`. |
| `apps` | 1–40 catalog ids, in Dock order, no repeats. Published Docks cannot use retired (legacy) apps. |
| `addedOn`, `updatedOn` | Real `YYYY-MM-DD` dates. Use the actual publication date so Latest stays honest. |
| `status` | `published` (default), `unlisted` (page only, noindex) or `retired` (page kept for old links, not listed). |
| `aliases` | Old slugs that should still open this Dock. |
| `credit`, `creditUrl` | Optional person or site, and an https link. The server never fetches it. |
| `featured` | A whole number; the Home stage shows featured Docks in this order. |
| `layout` | Optional. `spacers`: app indexes followed by a spacer tile. `stacks`: right-side items, ending with `{ "kind": "trash" }`; folders are `{ "kind": "folder", "label": "Downloads", "view": "fan" }`. Defaults to Downloads and Trash. |

Unknown fields are rejected, which catches typos.

## Rename or remove a Dock

Do not delete a published Dock or change its `id`. To rename the URL, give it a new `id` and list the old one in `aliases`; to take it down, set `status` to `retired`. `tests/fixtures/published-dock-ids.json` lists every id that has been public, and the tests fail if one stops resolving. Add new ids to that file when you publish them.

## Curation notes

`npm run content:report` lists Docks with fewer than six apps, Finder not first (macOS keeps it first), missing credits, over-used apps and catalog apps that no Dock uses yet. It never fails the build.

## Add a bundled app icon

The 141 bundled icons stay in `src/lib/catalog.json`; five compatibility entries remain in `legacy-catalog.json` for old links. Keep IDs stable. Safari, Obsidian and Terminal reuse their earlier IDs.

To regenerate the supplied batch, use its complete source directory with the maintained `script/icon-sources.json` mapping:

```sh
npm run import:icons -- "/path/to/App Icons"
```

Normal builds use committed WebP files and do not run this importer. Originals remain untouched. Record sources in `ASSET_SOURCES.md` and `docs/icon-provenance.json`.
