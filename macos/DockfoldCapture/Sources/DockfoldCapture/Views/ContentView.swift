import SwiftUI

struct ContentView: View {
    let store: CaptureStore
    @Environment(\.colorScheme) private var colorScheme
    @AppStorage("dockfoldBaseURL") private var baseURL = "https://dockfold.vercel.app"

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            content
            Divider()
            footer
        }
        .tint(colorScheme == .dark ? Color(red: 1, green: 0.46, blue: 0.78) : Color(red: 0.78, green: 0, blue: 0.48))
        .toolbar {
            ToolbarItemGroup {
                Button { store.exportManifest() } label: { Label("Save capture", systemImage: "square.and.arrow.down") }
                    .disabled(store.includedCount == 0 || store.isBusy)
                    .help("Save a capture to import in your browser")
                Button { store.scan() } label: { Label("Scan Dock", systemImage: "arrow.clockwise") }
                    .disabled(store.isBusy)
                    .help("Refresh pinned apps (⇧⌘R)")
            }
        }
        .task { if store.apps.isEmpty { store.scan() } }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("Your Dock, at a glance.")
                        .font(.system(size: 29, weight: .semibold)).tracking(-0.8)
                    Text("A small collection of the apps you keep close.")
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "dock.rectangle")
                    .font(.system(size: 32, weight: .light)).foregroundStyle(.secondary)
                    .accessibilityHidden(true)
            }
            HStack {
                Label("\(store.includedCount) of \(store.apps.count) included", systemImage: "checkmark.circle")
                    .font(.callout).foregroundStyle(.secondary)
                Spacer()
                Button(store.includedCount == store.apps.count ? "Deselect all" : "Select all") {
                    store.setAllIncluded(store.includedCount != store.apps.count)
                }.buttonStyle(.borderless).disabled(store.apps.isEmpty || store.isBusy)
            }
        }.padding(28)
    }

    @ViewBuilder private var content: some View {
        if store.apps.isEmpty {
            if case .failed(let message) = store.phase {
                ContentUnavailableView {
                    Label("Couldn’t read this Dock", systemImage: "dock.rectangle")
                } description: { Text(message) } actions: {
                    Button("Scan again") { store.scan() }.buttonStyle(.borderedProminent)
                }.frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ProgressView("Reading pinned apps…").frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        } else {
            List(store.apps) { app in
                AppRow(app: app) { store.setIncluded(app, isIncluded: $0) }
            }.listStyle(.inset).disabled(store.isBusy)
        }
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 15) {
            if case .failed(let message) = store.phase, !store.apps.isEmpty {
                Label(message, systemImage: "exclamationmark.circle")
                    .font(.callout).foregroundStyle(.red).textSelection(.enabled)
            }
            HStack(alignment: .center, spacing: 24) {
                VStack(alignment: .leading, spacing: 5) {
                    Label("Review first. Share when ready.", systemImage: "hand.raised")
                        .font(.callout).fontWeight(.medium)
                    Text("Only selected app names and identifiers go to your browser.\nYour Dock, files, and folders stay unchanged.")
                        .font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                continueButton
                    .keyboardShortcut(.defaultAction)
                    .disabled(store.includedCount == 0 || store.isBusy)
            }
        }.padding(24)
    }

    @ViewBuilder private var continueButton: some View {
        #if compiler(>=6.2)
        if #available(macOS 26, *) {
            Button("Continue in browser", systemImage: "arrow.up.right") { store.openInDockfold(baseURL: baseURL) }
                .buttonStyle(.glassProminent).controlSize(.large)
        } else {
            Button("Continue in browser", systemImage: "arrow.up.right") { store.openInDockfold(baseURL: baseURL) }
                .buttonStyle(.borderedProminent).controlSize(.large)
        }
        #else
        Button("Continue in browser", systemImage: "arrow.up.right") { store.openInDockfold(baseURL: baseURL) }
            .buttonStyle(.borderedProminent).controlSize(.large)
        #endif
    }
}
