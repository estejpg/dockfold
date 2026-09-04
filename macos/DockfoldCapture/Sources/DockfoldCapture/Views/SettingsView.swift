import SwiftUI

struct SettingsView: View {
    @AppStorage("dockfoldBaseURL") private var baseURL = "https://dockfold.vercel.app"

    var body: some View {
        Form {
            TextField("Dockfold website", text: $baseURL, prompt: Text("https://dockfold.vercel.app"))
            Text("The selected apps open in your browser for review. A profile is stored only after you choose Create unlisted link. Use HTTPS, or HTTP on localhost for development.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
        .frame(width: 470)
        .padding()
    }
}
