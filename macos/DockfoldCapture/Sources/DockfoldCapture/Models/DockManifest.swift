import Foundation

struct CapturedApp: Identifiable, Hashable, Sendable {
    let id: UUID
    let name: String
    let bundleIdentifier: String?
    let applicationURL: URL?
    var isIncluded: Bool

    init(name: String, bundleIdentifier: String?, applicationURL: URL?, isIncluded: Bool = true) {
        self.id = UUID()
        self.name = name
        self.bundleIdentifier = bundleIdentifier
        self.applicationURL = applicationURL
        self.isIncluded = isIncluded
    }
}

struct ManifestApp: Codable, Sendable {
    let name: String
    let bundleIdentifier: String?
}

struct DockManifest: Codable, Sendable {
    let v: Int
    let apps: [ManifestApp]
}

enum CapturePhase: Equatable {
    case ready
    case scanning
    case review
    case opening
    case failed(String)
}
