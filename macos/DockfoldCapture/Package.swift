// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DockfoldCapture",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "DockfoldCapture", targets: ["DockfoldCapture"])
    ],
    targets: [
        .executableTarget(
            name: "DockfoldCapture",
            path: "Sources/DockfoldCapture"
        )
    ]
)
