import Foundation

@main struct CaptureChecks {
    static func main() async throws {
        var count = 0
        func check(_ result: Bool, _ label: String) throws {
            guard result else { throw NSError(domain: "CaptureChecks", code: 1, userInfo: [NSLocalizedDescriptionKey: label]) }
            count += 1
        }
        func rejects(_ label: String, _ operation: () throws -> Void) throws {
            do { try operation() } catch { count += 1; return }
            try check(false, label)
        }
        func tile(_ name: String, _ path: String, _ type: String = "file-tile") -> [String: Any] {
            ["tile-type": type, "tile-data": ["file-label": name, "bundle-identifier": "test.\(name)", "file-data": ["_CFURLString": path]]]
        }
        func plist(_ apps: [[String: Any]]) throws -> Data {
            try PropertyListSerialization.data(fromPropertyList: ["persistent-apps": apps, "persistent-others": [tile("Private", "file:///Applications/Private.app")]], format: .xml, options: 0)
        }
        let fixtures = [tile("One", "file:///Applications/One.app/"), tile("Folder", "file:///Users/test/Documents"), tile("Remote", "https://example.com/Fake.app"), tile("Space", "file:///Applications/Space.app", "spacer-tile"), tile("Two", "/Applications/Two.app"), tile("One", "file:///Applications/One.app/")]
        try check(DockScanner.parse(plist(fixtures)).map(\.name) == ["One", "Two"], "Only apps, order and deduplication")
        try rejects("Empty capture") { _ = try DockScanner.parse(plist([])) }
        try rejects("Malformed capture") { _ = try DockScanner.parse(Data("bad".utf8)) }
        let large = try plist((0..<1500).map { tile("App\($0)", "file:///Applications/App\($0).app") })
        try check(large.count > 65536, "Large fixture exceeds pipe capacity")
        try check(DockScanner.parse(large).count == 1500, "Large capture complete")
        let selected = CapturedApp(name: "Café 🧑🏽‍💻", bundleIdentifier: "test.cafe", applicationURL: URL(fileURLWithPath: "/private/secret.app"))
        let hidden = CapturedApp(name: "Hidden", bundleIdentifier: nil, applicationURL: nil, isIncluded: false)
        let apps = [selected, hidden]
        let data = try ManifestLinkBuilder.manifestData(from: apps)
        let manifest = try JSONDecoder().decode(DockManifest.self, from: data)
        try check(manifest.apps.count == 1 && manifest.apps[0].name == selected.name, "Unicode and selected apps")
        try check(!String(decoding: data, as: UTF8.self).contains("/private"), "No filesystem paths in manifest")
        let url = try ManifestLinkBuilder.build(from: apps, baseURL: "https://example.com/old?q=old#old")
        try check(url.query == nil && url.path == "/share" && url.fragment?.hasPrefix("dock=") == true, "Fragment-only browser handoff")
        for destination in ["file:///tmp", "javascript:alert(1)", "http://example.com", "https://user:pass@example.com", "/relative"] {
            try rejects("Reject \(destination)") { _ = try ManifestLinkBuilder.build(from: apps, baseURL: destination) }
        }
        try check(ManifestLinkBuilder.build(from: apps, baseURL: "http://localhost:3100").host == "localhost", "Allow local development")
        try rejects("No selected apps") { _ = try ManifestLinkBuilder.manifestData(from: [hidden]) }
        try rejects("App count cap") { _ = try ManifestLinkBuilder.manifestData(from: Array(repeating: selected, count: 81)) }
        let overlong = CapturedApp(name: String(repeating: "x", count: 81), bundleIdentifier: nil, applicationURL: nil)
        try rejects("Name cap") { _ = try ManifestLinkBuilder.manifestData(from: [overlong]) }
        let actual = try await DockScanner().scan()
        try check(!actual.isEmpty && actual.allSatisfy { $0.applicationURL?.isFileURL == true }, "Actual Dock read")
        // A fixture emitted by the actual Swift encoder for the TypeScript compatibility test.
        if let fixturePath = CommandLine.arguments.dropFirst().first { try data.write(to: URL(fileURLWithPath: fixturePath)) }
        print("PASS: \(count) native checks; actual Dock contains \(actual.count) pinned apps.")
    }
}
