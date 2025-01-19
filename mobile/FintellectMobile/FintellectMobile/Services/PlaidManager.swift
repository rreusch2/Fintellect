import Foundation
import LinkKit
import UIKit

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
    
    private init() {}
    
    func createAndPresentLink() async {
        isLoading = true
        error = nil
        
        do {
            // Get link token from our backend
            let response = try await APIClient.shared.post("/api/plaid/create-link-token", body: [:])
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let linkToken = json["link_token"] as? String {
                print("[Plaid] Link token created successfully")
                
                let result = try await withCheckedThrowingContinuation { continuation in
                    let viewController = PLKPlaidLinkViewController(
                        linkToken: linkToken,
                        onSuccess: { success in
                            continuation.resume(returning: success.publicToken)
                        },
                        onExit: { error in
                            if let error = error {
                                continuation.resume(throwing: error)
                            } else {
                                continuation.resume(throwing: NSError(domain: "Plaid", code: -1, userInfo: [NSLocalizedDescriptionKey: "User exited"]))
                            }
                        }
                    )
                    
                    if let rootViewController = UIApplication.shared.windows.first?.rootViewController {
                        rootViewController.present(viewController, animated: true)
                    }
                }
                
                // Handle success
                print("[Plaid] Link success - public token: \(result)")
                await exchangePublicToken(publicToken: result)
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