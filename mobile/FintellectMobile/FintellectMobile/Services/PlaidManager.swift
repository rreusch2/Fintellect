import Foundation
import LinkKit
import SwiftUI

extension UIApplication {
    var keyWindow: UIWindow? {
        // Get connected scenes
        return UIApplication.shared.connectedScenes
            // Keep only active scenes, onscreen and visible to the user
            .filter { $0.activationState == .foregroundActive }
            // Keep only the first `UIWindowScene`
            .first(where: { $0 is UIWindowScene })
            // Get its associated windows
            .flatMap({ $0 as? UIWindowScene })?.windows
            // Finally, keep only the key window
            .first(where: \.isKeyWindow)
    }
}

@MainActor
class PlaidManager: ObservableObject {
    static let shared = PlaidManager()
    
    @Published var isLoading = false
    @Published var error: String?
    @Published var isPresentingLink = false
    var linkController: LinkController?
    
    private init() {}
    
    func createAndPresentLink() async {
        print("[Plaid] Creating link token")
        do {
            // Request link token from our backend
            let response = try await APIClient.shared.post("/api/plaid/create-link-token", body: [:])
            
            // Parse the response
            guard let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
                  let linkToken = json["linkToken"] as? String else {
                throw NSError(domain: "PlaidManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to get link token"])
            }
            
            print("[Plaid] Link token created successfully")
            
            // Create basic configuration
            let linkConfiguration = LinkTokenConfiguration(token: linkToken)
            
            // Create handler
            let handler = try Plaid.create(linkConfiguration)
            
            // Set up success handler
            handler.onSuccess = { [weak self] success in
                print("[Plaid] Link success")
                Task { @MainActor in
                    await self?.handleSuccess(publicToken: success.publicToken)
                }
            }
            
            // Set up exit handler
            handler.onExit = { [weak self] exit in
                print("[Plaid] Link exit: \(exit.error?.localizedDescription ?? "No error")")
                Task { @MainActor in
                    self?.isPresentingLink = false
                    if let error = exit.error?.localizedDescription {
                        self?.error = error
                    }
                }
            }
            
            // Set up event handler
            handler.onEvent = { event in
                print("[Plaid] Link event: \(event.eventName)")
            }
            
            // Present the link
            await MainActor.run {
                linkController = LinkController(handler: handler)
                isPresentingLink = true
            }
            
        } catch {
            print("[Plaid] Error creating link: \(error)")
            self.error = error.localizedDescription
        }
    }
    
    private func handleSuccess(publicToken: String) async {
        print("[Plaid] Exchanging public token")
        do {
            // Exchange public token for access token
            let body: [String: Any] = ["public_token": publicToken]
            let response = try await APIClient.shared.post("/api/plaid/exchange-public-token", body: body)
            
            // Parse response
            guard let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
                  json["success"] as? Bool == true else {
                throw NSError(domain: "PlaidManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to exchange public token"])
            }
            
            print("[Plaid] Public token exchanged successfully")
            
            // Sync transactions
            try await syncTransactions()
            
            // Post notification that Plaid account was linked
            await MainActor.run {
                NotificationCenter.default.post(name: NSNotification.Name("PlaidAccountLinked"), object: nil)
                isPresentingLink = false
            }
            
        } catch {
            print("[Plaid] Error handling success: \(error)")
            self.error = error.localizedDescription
        }
    }
    
    func syncTransactions() async throws {
        print("[Plaid] Syncing transactions")
        do {
            // Request transaction sync
            let response = try await APIClient.shared.post("/api/plaid/sync", body: [:])
            
            // Parse response
            guard let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
                  json["success"] as? Bool == true else {
                throw NSError(domain: "PlaidManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to sync transactions"])
            }
            
            print("[Plaid] Transactions synced successfully")
            
        } catch {
            print("[Plaid] Error syncing transactions: \(error)")
            throw error
        }
    }
}

// Bridge between SwiftUI and UIKit for Plaid Link
struct LinkController: UIViewControllerRepresentable {
    private let handler: Handler

    init(handler: Handler) {
        self.handler = handler
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self, handler: handler)
    }

    func makeUIViewController(context: Context) -> UIViewController {
        let viewController = UIViewController()
        context.coordinator.present(handler, in: viewController)
        return viewController
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        // Empty implementation
    }

    final class Coordinator: NSObject {
        private let parent: LinkController
        private let handler: Handler

        fileprivate init(parent: LinkController, handler: Handler) {
            self.parent = parent
            self.handler = handler
        }

        fileprivate func present(_ handler: Handler, in viewController: UIViewController) {
            handler.open(presentUsing: .custom({ linkViewController in
                viewController.addChild(linkViewController)
                viewController.view.addSubview(linkViewController.view)
                linkViewController.view.translatesAutoresizingMaskIntoConstraints = false
                linkViewController.view.frame = viewController.view.bounds
                NSLayoutConstraint.activate([
                    linkViewController.view.centerXAnchor.constraint(equalTo: viewController.view.centerXAnchor),
                    linkViewController.view.centerYAnchor.constraint(equalTo: viewController.view.centerYAnchor),
                    linkViewController.view.widthAnchor.constraint(equalTo: viewController.view.widthAnchor),
                    linkViewController.view.heightAnchor.constraint(equalTo: viewController.view.heightAnchor),
                ])
                linkViewController.didMove(toParent: viewController)
            }))
        }
    }
} 