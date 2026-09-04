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

    func openInDockfold(baseURL: String) {
        guard !isBusy else { return }
        phase = .opening
        do {
            let url = try ManifestLinkBuilder.build(from: apps, baseURL: baseURL)
            NSWorkspace.shared.open(url)
            phase = .review
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}
