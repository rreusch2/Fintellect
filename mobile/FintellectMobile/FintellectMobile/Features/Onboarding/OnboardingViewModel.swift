import SwiftUI

@MainActor
class OnboardingViewModel: ObservableObject {
    @Published var currentStep = 0
    @Published var hasAcceptedTerms = false
    @Published var hasAcceptedPrivacy = false
    @Published var isLoading = false
    @Published var error: String?
    @Published var showTermsSheet = false
    @Published var showPrivacySheet = false
    
    // Reference to the auth view model for user state
    @Published var user: User?
    private let authViewModel: AuthViewModel
    
    init(authViewModel: AuthViewModel = .shared) {
        self.authViewModel = authViewModel
        self.user = authViewModel.currentUser
    }
    
    func acceptTerms() async {
        guard hasAcceptedTerms && hasAcceptedPrivacy else { return }
        
        isLoading = true
        error = nil
        
        do {
            let response = try await APIClient.shared.post("/api/auth/mobile/accept-terms", body: [:])
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let userData = json["user"] as? [String: Any] {
                // Update the user data
                if let updatedUser = try? User.from(dictionary: userData) {
                    user = updatedUser
                    authViewModel.currentUser = updatedUser
                    currentStep = 1 // Move to bank connection step
                }
            }
        } catch {
            print("[Onboarding] Error accepting terms:", error)
            self.error = "Failed to accept terms. Please try again."
        }
        
        isLoading = false
    }
    
    func completeOnboarding() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await APIClient.shared.post("/api/auth/mobile/complete-onboarding", body: [:])
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let userData = json["user"] as? [String: Any] {
                // Update the user data
                if let updatedUser = try? User.from(dictionary: userData) {
                    user = updatedUser
                    authViewModel.currentUser = updatedUser
                }
            }
        } catch {
            print("[Onboarding] Error completing onboarding:", error)
            self.error = "Failed to complete onboarding. Please try again."
        }
        
        isLoading = false
    }
} 