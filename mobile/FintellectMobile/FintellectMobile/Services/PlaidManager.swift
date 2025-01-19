import Foundation
import LinkKit

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
                
                // Create configuration
                let linkConfiguration = LinkKit.Configuration(
                    linkToken: linkToken
                ) { linkSuccess in
                    print("[Plaid] Link success - public token: \(linkSuccess.publicToken)")
                    Task {
                        await self.exchangePublicToken(publicToken: linkSuccess.publicToken)
                    }
                }
                
                // Add event handlers
                linkConfiguration.onEvent = { event in
                    print("[Plaid] Link event: \(event)")
                }
                
                linkConfiguration.onExit = { exit in
                    if let error = exit.error {
                        print("[Plaid] Link exit with error: \(error)")
                        self.error = error.localizedDescription
                    } else {
                        print("[Plaid] Link exit without error")
                    }
                    self.isLoading = false
                }
                
                // Present Plaid Link
                let handler = Plaid.createHandler(configuration: linkConfiguration)
                try await handler.open(presentUsing: .viewController)
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