import SwiftUI

struct AppRow: View {
    let app: CapturedApp
    let onToggle: (Bool) -> Void

    var body: some View {
        Toggle(isOn: Binding(get: { app.isIncluded }, set: onToggle)) {
            HStack(spacing: 12) {
                Image(nsImage: AppIconResolver.image(for: app))
                    .resizable()
                    .scaledToFit()
                    .frame(width: 36, height: 36)
                VStack(alignment: .leading, spacing: 3) {
                    Text(app.name).fontWeight(.medium)
                    Text(app.bundleIdentifier ?? "Bundle identifier unavailable")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .toggleStyle(.checkbox)
        .padding(.vertical, 5)
    }
}
