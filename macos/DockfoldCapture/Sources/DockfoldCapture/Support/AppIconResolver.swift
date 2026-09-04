import AppKit
import Foundation

enum AppIconResolver {
    static func image(for app: CapturedApp) -> NSImage {
        guard let url = app.applicationURL else { return NSWorkspace.shared.icon(forFileType: "app") }
        return NSWorkspace.shared.icon(forFile: url.path)
    }
}
