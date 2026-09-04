# Dockfold

Dockfold is a privacy-first directory for sharing the apps pinned in a Mac Dock. It contains:

- a Next.js 16 site designed for Vercel;
- a native SwiftUI capture helper built with Swift Package Manager;
- a URL-encoded, versioned manifest format, so public profile links work without accounts or a database;
- original `.icns` downloads from macOSicons and 512px PNG conversions for the demo directory.

Live site: [dockfold.vercel.app](https://dockfold.vercel.app)

## Web app

```bash
npm install
npm run dev
```

The app is intentionally storage-free. A capture manifest opens at `/share?dock=<payload>`. After review, the user receives `/d/<payload>`, where the complete public profile is encoded as Base64URL JSON.

## macOS capture helper

Requirements: macOS 14+, Xcode Command Line Tools, and Swift 5.9+.

```bash
./script/build_and_run.sh
```

The script builds the SwiftPM product, stages a real `dist/DockfoldCapture.app` bundle, and launches it. Optional modes: `--debug`, `--logs`, `--telemetry`, and `--verify`.

The helper executes `/usr/bin/defaults export com.apple.dock -`, parses only `persistent-apps`, resolves app names and bundle identifiers from installed bundles, presents every item for review, then opens the Dockfold site with the manifest encoded in the URL. It does not upload icon files or telemetry.

## Repository map

```text
src/                         Next.js App Router site
macos/DockfoldCapture/       SwiftUI capture helper
assets/icns/original/        Complete .icns source files
public/app-icons/            Converted 512 × 512 PNGs
docs/capture-architecture.md System rationale and threat model
script/build_and_run.sh      Reproducible macOS build/run entrypoint
```

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

The Swift target must be compiled on macOS because SwiftUI and AppKit are unavailable on Linux.

## Credits

Dockfold is an independent implementation informed by the open-source DockHunt capture pattern. Demo icon files are downloaded from [macOSicons](https://macosicons.com/) and retain their source links in [ASSET_SOURCES.md](./ASSET_SOURCES.md).
