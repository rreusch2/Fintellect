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
        print("[Plaid] Starting createAndPresentLink")
        isLoading = true
        error = nil
        
        do {
            // Get link token from our backend
            print("[Plaid] Requesting link token from backend")
            let response = try await APIClient.shared.post("/api/plaid/create-link-token", body: [:])
            print("[Plaid] Response received: \(String(data: response, encoding: .utf8) ?? "nil")")
            
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let linkToken = json["link_token"] as? String {
                print("[Plaid] Link token created successfully: \(linkToken)")
                
                // Create the configuration
                var linkConfiguration = LinkTokenConfiguration(token: linkToken) { [weak self] success in
                    print("[Plaid] Success with public token: \(success.publicToken)")
                    Task { @MainActor in
                        await self?.exchangePublicToken(publicToken: success.publicToken)
                    }
                    self?.isPresentingLink = false
                    self?.isLoading = false
                }
                
                // Add exit handler
                linkConfiguration.onExit = { [weak self] exit in
                    if let error = exit.error {
                        print("[Plaid] Exit with error: \(error)")
                        self?.error = error.localizedDescription
                    } else {
                        print("[Plaid] User exited")
                        self?.error = "Bank connection cancelled"
                    }
                    self?.isPresentingLink = false
                    self?.isLoading = false
                }
                
                // Add event handler
                linkConfiguration.onEvent = { event in
                    print("[Plaid] Event: \(event)")
                }
                
                // Create the handler
                print("[Plaid] Creating Plaid handler")
                let result = Plaid.create(linkConfiguration)
                switch result {
                case .success(let handler):
                    print("[Plaid] Handler created successfully")
                    self.linkController = LinkController(handler: handler)
                    self.isPresentingLink = true
                case .failure(let error):
                    print("[Plaid] Handler creation failed: \(error)")
                    throw error
                }
            } else {
                print("[Plaid] Failed to parse link token from response")
                throw NSError(domain: "Plaid", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to get link token"])
            }
        } catch {
            print("[Plaid] Error: \(error)")
            self.error = error.localizedDescription
            self.isLoading = false
        }
    }
    
    private func exchangePublicToken(publicToken: String) async {
        do {
            let body: [String: Any] = ["public_token": publicToken]
            let response = try await APIClient.shared.post("/api/plaid/exchange-public-token", body: body)
            
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let success = json["success"] as? Bool, success {
                print("[Plaid] Public token exchanged successfully")
                NotificationCenter.default.post(name: NSNotification.Name("PlaidAccountLinked"), object: nil)
            }
        } catch {
            print("[Plaid] Error exchanging public token: \(error)")
            self.error = "Failed to link bank account. Please try again."
        }
        
        self.isLoading = false
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