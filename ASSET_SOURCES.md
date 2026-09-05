# Icon sources

## Current supplied collection

The user supplied 61 PNG files in an App Icons folder. The current picker uses 56 distinct app entries: four folder images were omitted and the byte-identical `iMessage.png` duplicate was consolidated into `Messages.png`. Named variants such as Dia / Dia (Early Birds) remain distinct.

`script/icon-sources.json` records each display name, stable ID, category, and original filename. `docs/icon-provenance.json` records original filenames, SHA-256 checksums, and dimensions without private machine paths. All sources are 1024 × 1024 PNGs. `script/import-icons.mjs` preserves the originals and creates transparent 192 × 192 WebP assets in `public/app-icons/curated/`, stripping metadata. These 56 files total 342,576 bytes (about 343 KB) before transfer compression.

All 18 curated Docks use the supplied set. No images were generated. App artwork belongs to its respective owners; supplied files establish provenance, not a new license.

## Earlier prototype assets

Safari, Chrome, Visual Studio Code, Obsidian, and Terminal remain in `src/lib/legacy-catalog.json` only so existing links keep working. Earlier Figma, Notion, Spotify, Slack, and Arc PNGs are retained as historical assets; the current catalog uses the supplied WebP versions.

The earlier demo app images were downloaded as a complete `.icns` file from macOSicons with `wget`, then converted from its largest representation to a 512 × 512 PNG. The original files are retained in `assets/icns/original/`; the web-ready conversions live in `public/app-icons/`.

| App                | macOSicons page                                           | Files                           |
| ------------------ | --------------------------------------------------------- | ------------------------------- |
| Figma              | https://macosicons.com/icon/figma-i3FsrkYvf6              | `figma.icns`, `figma.png`       |
| Notion             | https://macosicons.com/icon/notion-AjSpIBDy7v             | `notion.icns`, `notion.png`     |
| Spotify            | https://macosicons.com/icon/spotify-BjiTS8HBuU            | `spotify.icns`, `spotify.png`   |
| Slack              | https://macosicons.com/icon/slack-L54y5CIc0p              | `slack.icns`, `slack.png`       |
| Google Chrome      | https://macosicons.com/icon/google-chrome-nSGxIaavTp      | `chrome.icns`, `chrome.png`     |
| Safari             | https://macosicons.com/icon/safari-7l5rTOJDBr             | `safari.icns`, `safari.png`     |
| Visual Studio Code | https://macosicons.com/icon/visual-studio-code-pjdgchxEze | `vscode.icns`, `vscode.png`     |
| Arc                | https://macosicons.com/icon/arc-p5hqrY9QK5                | `arc.icns`, `arc.png`           |
| Obsidian           | https://macosicons.com/icon/obsidian-p5MRk8eACC           | `obsidian.icns`, `obsidian.png` |
| Terminal           | https://macosicons.com/icon/terminal-fGnDyYQFwp           | `terminal.icns`, `terminal.png` |

These community-submitted icons are used as prototype filler assets. Review each source page and the app owner’s trademark rules before commercial distribution.
