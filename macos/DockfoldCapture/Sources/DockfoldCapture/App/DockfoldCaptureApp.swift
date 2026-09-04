import AppKit
import SwiftUI

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }
}

@main
struct DockfoldCaptureApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var store = CaptureStore()

    var body: some Scene {
        WindowGroup("Dockfold Capture", id: "capture") {
            ContentView(store: store)
                .frame(minWidth: 620, minHeight: 560)
        }
        .defaultSize(width: 720, height: 680)
        .commands {
            CommandGroup(after: .newItem) {
                Button("Scan Dock") { store.scan() }
                    .keyboardShortcut("r", modifiers: [.command, .shift])
            }
        }

        Settings {
            SettingsView()
        }
    }
}
