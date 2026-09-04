import Foundation

enum DockScannerError: LocalizedError {
    case exportFailed
    case malformedPreferences
    case noPinnedApplications

    var errorDescription: String? {
        switch self {
        case .exportFailed: return "macOS could not read the Dock. Try scanning again."
        case .malformedPreferences: return "The Dock did not contain a readable pinned-app list."
        case .noPinnedApplications: return "No pinned applications were found. Pin an app in your Dock, then scan again."
        }
    }
}

struct DockScanner: Sendable {
    func scan() async throws -> [CapturedApp] {
        try await Task.detached(priority: .userInitiated) {
            let process = Process()
            let output = Pipe()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/defaults")
            process.arguments = ["export", "com.apple.dock", "-"]
            // Drain while the child runs. Waiting first can deadlock when the pipe fills.
            process.standardOutput = output
            process.standardError = output
            try process.run()
            let timeout = DispatchWorkItem { if process.isRunning { process.terminate() } }
            DispatchQueue.global().asyncAfter(deadline: .now() + 10, execute: timeout)
            defer { timeout.cancel() }
            let data = output.fileHandleForReading.readDataToEndOfFile()
            process.waitUntilExit()
            guard process.terminationStatus == 0 else { throw DockScannerError.exportFailed }
            return try Self.parse(data)
        }.value
    }

    static func parse(_ data: Data) throws -> [CapturedApp] {
        let plist = try PropertyListSerialization.propertyList(from: data, options: [], format: nil)
        guard let root = plist as? [String: Any],
              let tiles = root["persistent-apps"] as? [[String: Any]] else {
            throw DockScannerError.malformedPreferences
        }
        var seen = Set<String>()
        let apps = tiles.compactMap(parseApp).filter {
            seen.insert($0.bundleIdentifier ?? $0.applicationURL?.path ?? $0.name).inserted
        }
        guard !apps.isEmpty else { throw DockScannerError.noPinnedApplications }
        return apps
    }

    private static func parseApp(_ item: [String: Any]) -> CapturedApp? {
        guard item["tile-type"] as? String == "file-tile",
              let tile = item["tile-data"] as? [String: Any],
              let file = tile["file-data"] as? [String: Any],
              let raw = file["_CFURLString"] as? String else { return nil }
        let url = raw.hasPrefix("/") ? URL(fileURLWithPath: raw) : URL(string: raw)
        guard let url, url.isFileURL, url.host == nil || url.host == "" || url.host == "localhost",
              url.pathExtension.lowercased() == "app" else { return nil }
        let appURL = url.standardizedFileURL
        let bundle = Bundle(url: appURL)
        let displayName = (bundle?.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String)
            ?? (bundle?.object(forInfoDictionaryKey: "CFBundleName") as? String)
            ?? (tile["file-label"] as? String)
            ?? appURL.deletingPathExtension().lastPathComponent
        let name = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return nil }
        let identifier = bundle?.bundleIdentifier ?? (tile["bundle-identifier"] as? String)
        return CapturedApp(name: name, bundleIdentifier: identifier, applicationURL: appURL)
    }
}
