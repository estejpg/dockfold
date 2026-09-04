#!/usr/bin/env bash
set -euo pipefail
MODE="${1:-run}"
case "$MODE" in run|--debug|--logs|--telemetry|--verify|--package) ;; *) echo "usage: $0 [--verify|--package|--debug|--logs|--telemetry]" >&2; exit 2;; esac
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SWIFT_DIR="$ROOT_DIR/macos/DockfoldCapture"
APP_NAME="DockfoldCapture"
BUNDLE_ID="com.dockfold.capture"
APP_BUNDLE="$ROOT_DIR/dist/DockFold.app"
if [[ "$MODE" == "--package" ]]; then
  # Build each architecture independently; multi-arch SwiftPM invokes xcbuild,
  # which is absent from Command Line Tools-only installations.
  for ARCH in arm64 x86_64; do
    swift build --package-path "$SWIFT_DIR" --scratch-path "$SWIFT_DIR/.build/package-$ARCH" --triple "$ARCH-apple-macosx14.0" -c release --product "$APP_NAME"
  done
  ARM_BINARY="$(swift build --package-path "$SWIFT_DIR" --scratch-path "$SWIFT_DIR/.build/package-arm64" --triple arm64-apple-macosx14.0 -c release --show-bin-path)/$APP_NAME"
  INTEL_BINARY="$(swift build --package-path "$SWIFT_DIR" --scratch-path "$SWIFT_DIR/.build/package-x86_64" --triple x86_64-apple-macosx14.0 -c release --show-bin-path)/$APP_NAME"
  BUILD_BINARY="$SWIFT_DIR/.build/DockFold-universal"
  /usr/bin/lipo -create "$ARM_BINARY" "$INTEL_BINARY" -output "$BUILD_BINARY"
else
  pkill -x "$APP_NAME" >/dev/null 2>&1 || true
  swift build --package-path "$SWIFT_DIR"
  BUILD_BINARY="$(swift build --package-path "$SWIFT_DIR" --show-bin-path)/$APP_NAME"
fi
# Only remove the generated bundle under this checkout, never an installed app.
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources"
cp "$BUILD_BINARY" "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
swift "$ROOT_DIR/script/make_icon.swift" "$APP_BUNDLE/Contents/Resources/DockFold.icns"
cat > "$APP_BUNDLE/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>$APP_NAME</string>
<key>CFBundleIdentifier</key><string>$BUNDLE_ID</string>
<key>CFBundleName</key><string>DockFold</string>
<key>CFBundleDisplayName</key><string>DockFold</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.2.0</string>
<key>CFBundleVersion</key><string>2</string>
<key>CFBundleIconFile</key><string>DockFold</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSPrincipalClass</key><string>NSApplication</string>
<key>NSHumanReadableCopyright</key><string>DockFold · estejpg</string>
</dict></plist>
PLIST
/usr/bin/xattr -cr "$APP_BUNDLE"
/usr/bin/codesign --force --sign - "$APP_BUNDLE"
open_app() { /usr/bin/open -n "$APP_BUNDLE"; }
case "$MODE" in
  run) open_app ;;
  --debug) lldb -- "$APP_BUNDLE/Contents/MacOS/$APP_NAME" ;;
  --logs) open_app; /usr/bin/log stream --info --style compact --predicate "process == \"$APP_NAME\"" ;;
  --telemetry) open_app; /usr/bin/log stream --info --style compact --predicate "subsystem == \"$BUNDLE_ID\"" ;;
  --verify) open_app; for attempt in 1 2 3 4 5; do if pgrep -x "$APP_NAME" >/dev/null; then echo "DockFold is running."; exit 0; fi; sleep 1; done; exit 1 ;;
  --package)
    mkdir -p "$ROOT_DIR/public/downloads"
    /usr/bin/ditto -c -k --sequesterRsrc --keepParent "$APP_BUNDLE" "$ROOT_DIR/public/downloads/DockFold.zip"
    /usr/bin/shasum -a 256 "$ROOT_DIR/public/downloads/DockFold.zip" | awk '{print $1 "  DockFold.zip"}' > "$ROOT_DIR/public/downloads/SHA256SUMS.txt"
    echo "Created universal macOS app and public/downloads/DockFold.zip." ;;
esac
