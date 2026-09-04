import Foundation

enum ManifestLinkError: LocalizedError {
    case invalidBaseURL, invalidApps, couldNotBuildURL
    var errorDescription: String? {
        switch self {
        case .invalidBaseURL: return "Choose an HTTPS website in Settings. HTTP is supported only for localhost development."
        case .invalidApps: return "Include 1–80 apps, with names up to 80 characters and bundle identifiers up to 160 characters."
        case .couldNotBuildURL: return "This Dock is too large for a browser handoff. Include fewer apps and try again."
        }
    }
}

struct ManifestLinkBuilder {
    static func manifestData(from apps: [CapturedApp]) throws -> Data {
        let included = apps.filter(\.isIncluded)
        // Match JavaScript string limits, which count UTF-16 code units.
        guard (1...80).contains(included.count), included.allSatisfy({
            !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && $0.name.utf16.count <= 80 && ($0.bundleIdentifier?.utf16.count ?? 0) <= 160
        }) else { throw ManifestLinkError.invalidApps }
        let manifest = DockManifest(v: 1, apps: included.map { ManifestApp(name: $0.name, bundleIdentifier: $0.bundleIdentifier) })
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        return try encoder.encode(manifest)
    }

    static func build(from apps: [CapturedApp], baseURL: String) throws -> URL {
        guard var components = URLComponents(string: baseURL.trimmingCharacters(in: .whitespacesAndNewlines)),
              let host = components.host, !host.isEmpty,
              components.user == nil, components.password == nil,
              components.scheme == "https" || (components.scheme == "http" && ["localhost", "127.0.0.1", "[::1]"].contains(host)) else {
            throw ManifestLinkError.invalidBaseURL
        }
        let data = try manifestData(from: apps)
        let payload = data.base64EncodedString().replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
        guard payload.count <= 48_000 else { throw ManifestLinkError.couldNotBuildURL }
        components.path = "/share"
        components.query = nil
        // Fragments are read by the browser, never included in the HTTP request.
        components.fragment = "dock=\(payload)"
        guard let url = components.url else { throw ManifestLinkError.couldNotBuildURL }
        return url
    }
}
