import XCTest
@testable import DockfoldCapture

final class CaptureTests: XCTestCase {
    func tile(_ name: String, _ url: String, type: String = "file-tile") -> [String: Any] {
        ["tile-type": type, "tile-data": ["file-label": name, "bundle-identifier": "test.\(name)", "file-data": ["_CFURLString": url]]]
    }
    func plist(_ apps: [[String: Any]], others: [[String: Any]] = []) throws -> Data {
        try PropertyListSerialization.data(fromPropertyList: ["persistent-apps": apps, "persistent-others": others], format: .xml, options: 0)
    }
    func testIgnoresNonAppsAndKeepsOrder() throws {
        let data = try plist([tile("One", "file:///Applications/One.app/"), tile("Folder", "file:///Users/test/Documents/"), tile("Web", "https://example.com/Fake.app"), tile("Space", "file:///Applications/Space.app", type: "spacer-tile"), tile("Two", "/Applications/Two.app"), tile("One", "file:///Applications/One.app/")], others: [tile("Ignored", "file:///Applications/Ignored.app")])
        XCTAssertEqual(try DockScanner.parse(data).map(\.name), ["One", "Two"])
    }
    func testEmptyAndMalformedDock() throws {
        XCTAssertThrowsError(try DockScanner.parse(try plist([])))
        XCTAssertThrowsError(try DockScanner.parse(Data("invalid".utf8)))
    }
    func testLargePreferenceParsesWithoutTruncation() throws {
        let data = try plist((0..<1500).map { tile("App\($0)", "file:///Applications/App\($0).app") })
        XCTAssertGreaterThan(data.count, 64 * 1024)
        XCTAssertEqual(try DockScanner.parse(data).count, 1500)
    }
    func testHandoffExcludesPathsAndDeselectedApps() throws {
        let apps = [CapturedApp(name: "Café 🧑🏽‍💻", bundleIdentifier: "test.cafe", applicationURL: URL(fileURLWithPath: "/private/secret.app")), CapturedApp(name: "Hidden", bundleIdentifier: nil, applicationURL: nil, isIncluded: false)]
        let url = try ManifestLinkBuilder.build(from: apps, baseURL: "https://dockfold.vercel.app/ignored?old=1#old")
        XCTAssertNil(url.query)
        XCTAssertEqual(url.path, "/share")
        let fragment = try XCTUnwrap(url.fragment)
        XCTAssertTrue(fragment.hasPrefix("dock="))
        let data = try ManifestLinkBuilder.manifestData(from: apps)
        let manifest = try JSONDecoder().decode(DockManifest.self, from: data)
        XCTAssertEqual(manifest.apps.count, 1)
        XCTAssertEqual(manifest.apps[0].name, "Café 🧑🏽‍💻")
        XCTAssertFalse(String(decoding: data, as: UTF8.self).contains("/private"))
    }
    func testRejectsUnsafeDestinations() {
        let apps = [CapturedApp(name: "Test", bundleIdentifier: nil, applicationURL: nil)]
        for destination in ["file:///tmp", "javascript:alert(1)", "http://example.com", "https://name:password@example.com", "/relative"] {
            XCTAssertThrowsError(try ManifestLinkBuilder.build(from: apps, baseURL: destination), destination)
        }
        XCTAssertNoThrow(try ManifestLinkBuilder.build(from: apps, baseURL: "http://localhost:3100"))
    }
    func testSelectionAndSizeLimits() {
        XCTAssertThrowsError(try ManifestLinkBuilder.manifestData(from: []))
        let long = CapturedApp(name: String(repeating: "x", count: 81), bundleIdentifier: nil, applicationURL: nil)
        XCTAssertThrowsError(try ManifestLinkBuilder.manifestData(from: [long]))
        let app = CapturedApp(name: "App", bundleIdentifier: nil, applicationURL: nil)
        XCTAssertThrowsError(try ManifestLinkBuilder.manifestData(from: Array(repeating: app, count: 81)))
    }
    func testReadsActualDock() async throws {
        try XCTSkipIf(ProcessInfo.processInfo.environment["CI"] != nil, "Hosted CI has no personal Dock; fixtures cover parsing there.")
        let apps = try await DockScanner().scan()
        XCTAssertFalse(apps.isEmpty)
        XCTAssertTrue(apps.allSatisfy { $0.applicationURL?.isFileURL == true })
    }
}
