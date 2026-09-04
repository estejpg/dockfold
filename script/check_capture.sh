#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/macos/DockfoldCapture/Sources/DockfoldCapture"
CHECK_DIR="$ROOT_DIR/macos/DockfoldCapture/.build/checks"
mkdir -p "$CHECK_DIR"
swiftc -parse-as-library "$SOURCE_DIR/Models/DockManifest.swift" "$SOURCE_DIR/Services/DockScanner.swift" "$SOURCE_DIR/Services/ManifestLinkBuilder.swift" "$ROOT_DIR/script/CaptureChecks.swift" -o "$CHECK_DIR/CaptureChecks"
"$CHECK_DIR/CaptureChecks" "$CHECK_DIR/swift-manifest.json"
