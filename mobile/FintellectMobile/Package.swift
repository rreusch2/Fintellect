// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "FintellectMobile",
    platforms: [
        .iOS(.v16)
    ],
    dependencies: [
        .package(url: "https://github.com/plaid/plaid-link-ios-spm.git", from: "5.1.0")
    ],
    targets: [
        .target(
            name: "FintellectMobile",
            dependencies: [
                .product(name: "LinkKit", package: "plaid-link-ios-spm")
            ]
        )
    ]
) 