import SwiftUI

struct SettingsView: View {
    @AppStorage("dockfoldBaseURL") private var baseURL = "https://dockfold.vercel.app"

    var body: some View {
        Form {
            TextField("Dockfold website", text: $baseURL, prompt: Text("https://dockfold.vercel.app"))
            Text("The helper opens this website with the reviewed manifest encoded in the URL.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
        .frame(width: 470)
        .padding()
    }
}
