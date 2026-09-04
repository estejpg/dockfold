import Foundation

enum ManifestLinkError: LocalizedError {
    case invalidBaseURL
    case noIncludedApps
    case couldNotBuildURL

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL: return "The Dockfold website URL is invalid. Check Settings and try again."
        case .noIncludedApps: return "Include at least one app before continuing."
        case .couldNotBuildURL: return "Dockfold could not create the share handoff URL."
        }
    }
}

struct ManifestLinkBuilder {
    static func build(from apps: [CapturedApp], baseURL: String) throws -> URL {
        let included = apps.filter(\.isIncluded)
        guard !included.isEmpty else { throw ManifestLinkError.noIncludedApps }
        guard let rootURL = URL(string: baseURL), var components = URLComponents(url: rootURL, resolvingAgainstBaseURL: false) else {
            throw ManifestLinkError.invalidBaseURL
        }

        let manifest = DockManifest(v: 1, apps: included.map { ManifestApp(name: $0.name, bundleIdentifier: $0.bundleIdentifier) })
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        let data = try encoder.encode(manifest)
        let payload = data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")

        components.path = "/share"
        components.queryItems = [URLQueryItem(name: "dock", value: payload)]
        guard let url = components.url else { throw ManifestLinkError.couldNotBuildURL }
        return url
    }
}
