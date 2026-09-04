import SwiftUI

struct ContentView: View {
    let store: CaptureStore
    @AppStorage("dockfoldBaseURL") private var baseURL = "https://dockfold.vercel.app"

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            content
            Divider()
            footer
        }
        .background(.regularMaterial)
        .toolbar {
            ToolbarItem {
                Button { store.scan() } label: { Label("Scan Dock", systemImage: "arrow.clockwise") }
                    .disabled(store.isBusy)
            }
        }
        .task {
            if store.apps.isEmpty { store.scan() }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 7) {
                Text("Review your Dock").font(.system(size: 27, weight: .semibold))
                Text(statusText).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(store.includedCount) included")
                .font(.caption.monospaced())
                .foregroundStyle(.secondary)
        }
        .padding(28)
    }

    @ViewBuilder
    private var content: some View {
        switch store.phase {
        case .ready, .scanning where store.apps.isEmpty:
            ProgressView("Reading pinned apps…")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed(let message) where store.apps.isEmpty:
            ContentUnavailableView("Couldn’t read this Dock", systemImage: "dock.rectangle", description: Text(message))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        default:
            List(store.apps) { app in
                AppRow(app: app) { store.setIncluded(app, isIncluded: $0) }
            }
            .listStyle(.inset)
        }
    }

    private var footer: some View {
        HStack(spacing: 14) {
            Label("Recent and running-only apps are ignored", systemImage: "hand.raised")
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            if case .failed(let message) = store.phase, !store.apps.isEmpty {
                Text(message).font(.caption).foregroundStyle(.red).lineLimit(2)
            }
            Button("Open in Dockfold") { store.openInDockfold(baseURL: baseURL) }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.defaultAction)
                .disabled(store.includedCount == 0 || store.isBusy)
        }
        .padding(20)
    }

    private var statusText: String {
        switch store.phase {
        case .ready: return "Ready to read the apps pinned in macOS."
        case .scanning: return "Refreshing from com.apple.dock…"
        case .review: return "Nothing leaves this Mac until you continue."
        case .opening: return "Creating a private handoff link…"
        case .failed: return store.apps.isEmpty ? "Scan failed." : "Your last scan is still available."
        }
    }
}
