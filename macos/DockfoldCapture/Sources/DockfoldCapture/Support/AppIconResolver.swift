import AppKit
import UniformTypeIdentifiers
import Foundation

enum AppIconResolver {
    static func image(for app: CapturedApp) -> NSImage {
        guard let url = app.applicationURL else { return NSWorkspace.shared.icon(for: .applicationBundle) }
        return NSWorkspace.shared.icon(forFile: url.path)
    }
}
