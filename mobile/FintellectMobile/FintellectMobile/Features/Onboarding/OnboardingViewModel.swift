import Foundation
import SwiftUI

@MainActor
class OnboardingViewModel: ObservableObject {
    @Published var currentStep = 1
    @Published var hasAcceptedTerms = false
    @Published var hasAcceptedPrivacy = false
    @Published var showTermsSheet = false
    @Published var showPrivacySheet = false
    @Published var error: String?
    @Published var isLoading = false
    
    // Terms acceptance
    func acceptTerms() async -> Bool {
        guard hasAcceptedTerms && hasAcceptedPrivacy else {
            error = "Please accept both Terms of Service and Privacy Policy"
            return false
        }
        
        isLoading = true
        error = nil
        
        do {
            let response: Data = try await APIClient.shared.post("/api/onboarding/accept-terms", body: [:])
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let message = json["message"] as? String {
                print("[Onboarding] Terms accepted:", message)
                return true
            }
            return false
        } catch {
            self.error = error.localizedDescription
            print("[Onboarding] Terms acceptance error:", error)
            return false
        } finally {
            isLoading = false
        }
    }
    
    // Check onboarding status
    func checkStatus() async {
        do {
            let response: Data = try await APIClient.shared.get("/api/onboarding/status")
            if let status = try? JSONDecoder().decode(OnboardingStatus.self, from: response) {
                currentStep = status.onboardingStep
                
                if let consent = status.legalConsent {
                    hasAcceptedTerms = consent.termsAccepted
                    hasAcceptedPrivacy = consent.privacyAccepted
                }
            }
        } catch {
            print("[Onboarding] Status check error:", error)
        }
    }
    
    func nextStep() {
        Task {
            switch currentStep {
            case 1: // Terms step
                if await acceptTerms() {
                    withAnimation {
                        currentStep += 1
                    }
                }
            default:
                withAnimation {
                    currentStep += 1
                }
            }
        }
    }
}

// Response Models
struct OnboardingStatus: Codable {
    let onboardingStep: Int
    let hasCompletedOnboarding: Bool
    let legalConsent: LegalConsent?
    let consentVersion: String?
}

struct LegalConsent: Codable {
    let termsAccepted: Bool
    let privacyAccepted: Bool
    let acceptedAt: String
    let version: String
} 