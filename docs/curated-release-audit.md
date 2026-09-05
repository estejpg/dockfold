# DockFold curated directory audit — September 4, 2026

Scope: replace the builder-first landing page with a lightweight curated directory, using the supplied app icons and Link Lowdown as the primary visual reference. The existing React/Vite static architecture remains appropriate. No macOS app, application server, database, or image generation was added.

## Findings and changes

| Priority | Finding                                                                                                     | Resolution                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| P2       | The ten-app picker and four examples were too limited to support browsing a varied Dock collection.         | 56 supplied icons and 18 reviewed starting points across six groups, each with a description, rationale, ordered app list, and stable page URL. |
| P2       | Builder-first navigation did not follow the requested Home / Latest / Submit structure.                     | Home is a searchable grouped directory; Latest lists actual additions; Submit contains the picker and optional GitHub collection submission.    |
| P2       | Replacing catalog IDs would invalidate earlier share links.                                                 | Five retired entries remain resolvable in a separate legacy catalog. Existing v2 share, customize, and example fragment routes stay readable.   |
| P2       | Customizing an example immediately replaced the saved browser draft.                                        | A nonempty prior draft can be recovered with Restore my previous draft during customization.                                                    |
| P2       | A stalled GitHub request could leave the board loading indefinitely.                                        | A ten-second deadline cancels the complete fetch; failures remain retryable and cached results stay visible.                                    |
| P2       | A future-dated cache timestamp could keep request results fresh indefinitely.                               | Reject nonfinite, nonpositive, and future timestamps; deduplicate issues across pagination before ranking.                                      |
| P2       | The new category selector's implicit label included option text in its accessible name.                     | Explicit label/input association, verified through accessible browser selectors and axe.                                                        |
| P2       | Faint metadata inherited from the visual direction did not meet normal-text contrast on all light surfaces. | Darker metadata/placeholder token, retaining the reference's quiet hierarchy.                                                                   |
| P3       | Encoding had no matching size guard and stored drafts were parsed before a size check.                      | Bound both generated share payloads and stored drafts; show a readable error if link creation fails.                                            |

No critical/high-severity exploitable issue was confirmed in the current static implementation during this review. This is a code and interaction audit, not a penetration-test certification.

## Before / after

| Before                                          | After                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Builder landing page and separate examples      | Home / Latest / Submit, with 18 individual curated pages                                                                  |
| Ten prototype icons                             | 56 supplied app entries, searchable by name and category                                                                  |
| Four broadly named example setups               | Everyday, design, photo/video, development, research/writing, and collaboration collections                               |
| Initial styling loosely followed the references | Inter, cool near-white/near-black colors, compact navigation, 8px grouped list containers, small metadata, quiet controls |
| No Dock submission workflow                     | Prefilled GitHub form, public review, deliberate inclusion in the collection                                              |
| Informal icon replacement                       | Reproducible optimization, source hashes, stable IDs, and documented maintenance                                          |

Link Lowdown's live Home, Latest, and Submit pages were inspected visually and in their HTML/CSS. Secondary references: estejpg, Digital Creator Club, Curated Supply, Macfolio, benji.org, and Resurf. DockFold uses three directory columns to accommodate several app icons per entry. The Submit page is wider than Link Lowdown's short form because it includes the icon picker and a live Dock preview. These are deliberate content-driven differences.

## Assets and performance

The supplied folder contains 61 PNGs. Four folder images were excluded; the identical iMessage/Messages duplicate was consolidated. Named variants remain selectable. The 56 source checksums match the untouched originals.

The committed transparent WebP set is 192 × 192 per icon and totals **342,576 bytes** (about 343 KB), sufficient for the largest displayed icons at high pixel density. All 18 curated Docks use these files. Build and deployment require no access to the original folder.

The production build's main JavaScript is about **72.3 KB gzip**, with separate composer and request chunks around **2.7 KB** and **2.0 KB**. Fonts and icons are served locally. No third-party requests were observed on Home, Latest, Submit, or Dock pages. Only App requests reads GitHub.

## Local verification

- 16 tests passed; lint, typecheck, and production build passed.
- Dependency audit reported zero known vulnerabilities at check time, including development dependencies.
- 14 browser scenarios passed: all 18 pages and icons; search/filter/empty state; selection/reordering; draft reload/recovery; clipboard; Unicode sharing in a fresh browser; GitHub prefill; legacy links; malformed links; 40-app limit; responsive layout; keyboard/theme behavior; request failures.
- Six routes checked at widths 320, 390, 768, 1024, and 1440: no horizontal page overflow. The maximum 40-app shared Dock also wraps correctly at those widths.
- axe checked six routes × two themes × two widths (24 settled views), with no WCAG A/AA violations reported. This supplements keyboard and visual checks; it is not full accessibility conformance proof.
- Request ranking and rate-limit retention were exercised with isolated fixtures. No fake public requests, votes, or Dock submissions were posted.

Aside inspected the reference sites. Because its browser viewport could not be controlled reliably and the Browser plugin was unavailable, bundled Playwright provided reproducible responsive and interaction checks.

## Remaining tradeoffs

- The browser app requires JavaScript. Static public routes share a generic HTML/social-preview document; custom names appear after rendering. Unknown paths use the static fallback and show an error page with an HTTP 200 response. Prerendering and true HTTP 404s would improve indexing as the public directory grows.
- Fragment share links are unlisted, encoded rather than encrypted, and cannot be revoked. Submitting one publicly to GitHub makes that link public. The interface and privacy page explain this distinction.
- GitHub handles login, attachments, and 👍 votes. The leaderboard can be five minutes behind and is subject to public API limits; it offers refresh and direct GitHub links. Only the first 500 open app requests are loaded.
- Icons and Dock submissions require maintainer review and deployment. Dates represent actual additions; all initial Docks share the launch date. No invented users, votes, or historical entries are shown.
- Existing Safari, Chrome, VS Code, Obsidian, and Terminal links remain readable; those five retired icons are not offered in the new picker.
- Chromium was automated at desktop/mobile sizes. Desktop Safari and Firefox were not separately automated.

## Reference evidence

- [Link Lowdown Home](https://www.linklowdown.com/), [Latest](https://www.linklowdown.com/latest), [Submit](https://www.linklowdown.com/submit)
- [estejpg](https://www.estejpg.com/) and [source](https://github.com/estejpg/estejpg-site)
- [Digital Creator Club](https://digitalcreator.club/), [Curated Supply](https://www.curated.supply/), [Macfolio](https://www.macfolio.com/), [benji.org](https://benji.org/), [Resurf](https://resurf.so/)
- [GitHub form field identifiers and query prefill](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)

See [maintenance](maintaining-icons.md) for adding icons/Docks, and [deployment](deployment.md) for the existing Vercel project and request-board behavior.
