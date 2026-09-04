import Foundation

enum DockScannerError: LocalizedError {
    case exportFailed(String)
    case malformedPreferences
    case noPinnedApplications

    var errorDescription: String? {
        switch self {
        case .exportFailed(let message): return "macOS could not export the Dock preference: \(message)"
        case .malformedPreferences: return "The Dock preference did not contain a readable pinned-app list."
        case .noPinnedApplications: return "No pinned applications were found. Recent apps are intentionally ignored."
        }
    }
}

struct DockScanner: Sendable {
    func scan() async throws -> [CapturedApp] {
        try await Task.detached(priority: .userInitiated) {
            let process = Process()
            let output = Pipe()
            let errors = Pipe()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/defaults")
            process.arguments = ["export", "com.apple.dock", "-"]
            process.standardOutput = output
            process.standardError = errors

            try process.run()
            process.waitUntilExit()

            guard process.terminationStatus == 0 else {
                let data = errors.fileHandleForReading.readDataToEndOfFile()
                let message = String(decoding: data, as: UTF8.self).trimmingCharacters(in: .whitespacesAndNewlines)
                throw DockScannerError.exportFailed(message)
            }

            let data = output.fileHandleForReading.readDataToEndOfFile()
            let plist = try PropertyListSerialization.propertyList(from: data, options: [], format: nil)
            guard
                let root = plist as? [String: Any],
                let persistentApps = root["persistent-apps"] as? [[String: Any]]
            else { throw DockScannerError.malformedPreferences }

            let apps = persistentApps.compactMap(Self.parseApp)
            guard !apps.isEmpty else { throw DockScannerError.noPinnedApplications }
            return apps
        }.value
    }

    private static func parseApp(_ item: [String: Any]) -> CapturedApp? {
        guard let tileData = item["tile-data"] as? [String: Any] else { return nil }
        let fileData = tileData["file-data"] as? [String: Any]
        let rawURL = fileData?["_CFURLString"] as? String
        let appURL = rawURL.flatMap(URL.init(string:))?.standardizedFileURL
        let bundle = appURL.flatMap(Bundle.init(url:))
        let displayName = (bundle?.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String)
            ?? (bundle?.object(forInfoDictionaryKey: "CFBundleName") as? String)
            ?? (tileData["file-label"] as? String)
            ?? appURL?.deletingPathExtension().lastPathComponent

        guard let name = displayName, !name.isEmpty else { return nil }
        return CapturedApp(name: name, bundleIdentifier: bundle?.bundleIdentifier, applicationURL: appURL)
    }
}
