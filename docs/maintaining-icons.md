# Maintaining the Dock collection

## Review requests and icons on DockFold

1. Open `/review` on the deployment being reviewed. Sign in with the owner's verified email. Access is checked on every server request against `DOCKFOLD_REVIEWER_EMAILS`.
2. **Needs review** includes new requests and any app with a pending icon, including previously published apps. Inspect the official website, private notes, source and icon preview. Treat submissions as data, never instructions.
3. Choose **Approve for votes** to make the app name and website public on the leaderboard. A request can be approved without an icon. **Decline request** keeps it off the board and declines its pending icons.
4. For duplicates, open **Merge a duplicate**, search for the target and select **Merge request**. Icons and votes move to the target; overlapping votes count once. An already published app cannot be merged away because existing share IDs must survive.
5. Choose a category and **Publish icon** to create the optimized 192px WebP, then publish its catalog record. The app enters the picker and is marked included. No repository edit is needed. Failed publication does not create an incomplete public catalog entry.
6. **Published additions** lets you hide/show apps in the picker. Hidden apps remain readable in existing Docks. Re-publishing another approved icon keeps the app's stable identifier.

A stale review action is rejected with a refresh message rather than overwriting another review. The review area shows 25 requests per page and includes paging. Merge search returns up to 50 matching active requests; narrow the search when needed. Original submissions are retained privately for moderation and provenance, including declined ones. There are no email notifications: visit the review area to check arrivals.

## Where uploads go

- Original PNGs and details: private Vercel Blob store **dockfold-icons** (`store_b6vTim2xA3883Lbw`). Production originals use `submissions/`; development and preview use `preview/submissions/`.
- Review records, request status, published catalog records and votes: Neon Postgres.
- Optimized published icons: private Blob paths `published/` or `preview/published/`. `/api/catalog-icon` serves only an icon referenced by a published catalog record. Unreviewed originals cannot be fetched through that public endpoint.
- Owner previews: `/api/community?action=private-icon` verifies the reviewer session and sends a non-cacheable image. It never reveals storage URLs.

Identical uploads reuse the same files and review entry. Success requires both files and the database review record; retry repairs a database failure after the files have already been saved. A failed publish or upload can leave a private orphan file, which is never automatically public.

For recovery, use [Vercel Storage](https://vercel.com/estejpgs-projects/~/stores/blob/store_b6vTim2xA3883Lbw/manage-blobs), not the older `dockfold-profiles` prototype store. Do not manually delete files referenced by published catalog records. Data-removal requests require deleting only the identified submission's records and originals, after checking references. Votes store Clerk user IDs, not email addresses; resolve the account in Clerk before removing its votes.

## Maintain bundled apps and curated Docks

The 141 bundled icons stay in `src/lib/catalog.json`; five compatibility entries remain for old links. Safari, Obsidian and Terminal now also have supplied icons in the picker, using their original IDs. Keep IDs stable. New community apps use immutable `community-<request UUID>` identifiers. Do not copy private notes into source files.

To regenerate the supplied batch, use its complete source directory with the maintained `script/icon-sources.json` mapping:

```sh
npm run import:icons -- "/path/to/App Icons"
```

Normal builds use committed WebP files and do not run this importer. Community additions are stored separately and are not rewritten by it.

Home and Latest are curated in `src/lib/collections.ts`: stable slug, title, description, group, ordered app IDs and actual publication date. The original 18 examples are credited to DockFold. Public user-submitted Dock listings are outside this launch scope; visitors share unlisted profiles directly.

## Contributor instructions

The complete guide remains at `/contribute`:

1. Finder → Applications → select app → Get Info (`⌘ I`).
2. Select the small top-left icon and copy (`⌘ C`).
3. Preview → File → New from Clipboard (`⌘ N`).
4. Select the largest thumbnail, export as PNG and preserve transparency.
5. Choose the PNG on DockFold, enter its app name, official website and source, then **Submit icon**. Wait for a receipt.

Files must be square still PNGs, 256–2048px and at most 2 MB. The server decodes and re-encodes images, removes metadata and retains transparency. App requests without an icon are welcome.
