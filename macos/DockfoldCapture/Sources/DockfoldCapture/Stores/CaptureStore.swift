import AppKit
import Foundation
import Observation

@MainActor
@Observable
final class CaptureStore {
    var apps: [CapturedApp] = []
    var phase: CapturePhase = .ready
    private let scanner = DockScanner()

    var includedCount: Int { apps.lazy.filter(\.isIncluded).count }
    var isBusy: Bool { phase == .scanning || phase == .opening }

    func scan() {
        guard !isBusy else { return }
        phase = .scanning
        Task {
            do {
                apps = try await scanner.scan()
                phase = .review
            } catch {
                phase = .failed(error.localizedDescription)
            }
        }
    }

    func setIncluded(_ app: CapturedApp, isIncluded: Bool) {
        guard let index = apps.firstIndex(where: { $0.id == app.id }) else { return }
        apps[index].isIncluded = isIncluded
    }

    func setAllIncluded(_ included: Bool) {
        guard !isBusy else { return }
        for index in apps.indices { apps[index].isIncluded = included }
    }

    func exportManifest() {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "My Dock.dockfold.json"
        panel.allowedContentTypes = [.json]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        do { try ManifestLinkBuilder.manifestData(from: apps).write(to: url, options: .atomic) }
        catch { phase = .failed(error.localizedDescription) }
    }

    func openInDockfold(baseURL: String) {
        guard !isBusy else { return }
        phase = .opening
        do {
            let url = try ManifestLinkBuilder.build(from: apps, baseURL: baseURL)
            guard NSWorkspace.shared.open(url) else {
                phase = .failed("Your browser could not open. Check Settings and try again.")
                return
            }
            phase = .review
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}
