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
        Window("DockFold", id: "capture") {
            ContentView(store: store)
                .frame(minWidth: 700, minHeight: 560)
        }
        .defaultSize(width: 760, height: 680)
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
