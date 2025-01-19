import Foundation
import Plaid
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
                
                // Create handler
                let handler = PLKHandler(token: linkToken)
                handler.delegate = self
                
                // Present Plaid Link
                let viewController = handler.createLinkViewController()
                await MainActor.run {
                    if let topViewController = UIApplication.shared.keyWindow?.rootViewController {
                        topViewController.present(viewController, animated: true)
                    }
                }
            }
        } catch {
            print("[Plaid] Error creating link token: \(error)")
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

extension PlaidManager: PLKHandlerDelegate {
    func linkHandler(_ handler: PLKHandler, didSucceedWithPublicToken publicToken: String, metadata: [String: Any]?) {
        print("[Plaid] Link success with public token: \(publicToken)")
        Task {
            await exchangePublicToken(publicToken: publicToken)
        }
        isLoading = false
    }
    
    func linkHandler(_ handler: PLKHandler, didExitWithError error: Error?, metadata: [String: Any]?) {
        if let error = error {
            print("[Plaid] Link exit with error: \(error)")
            self.error = error.localizedDescription
        } else {
            print("[Plaid] Link exit without error")
        }
        isLoading = false
    }
    
    func linkHandler(_ handler: PLKHandler, didHandleEvent event: String, metadata: [String: Any]?) {
        print("[Plaid] Link event: \(event)")
    }
} 