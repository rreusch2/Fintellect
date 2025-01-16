import Foundation
import SwiftUI

enum OnboardingStep: Int, CaseIterable {
    case terms = 0
    case bankConnection = 1
    
    var title: String {
        switch self {
        case .terms:
            return "Terms & Privacy"
        case .bankConnection:
            return "Connect Bank"
        }
    }
}

@MainActor
class OnboardingViewModel: ObservableObject {
    @Published var currentStep = OnboardingStep.terms
    @Published var hasAcceptedTerms = false
    @Published var hasAcceptedPrivacy = false
    @Published var showTermsSheet = false
    @Published var showPrivacySheet = false
    @Published var showBankConnectionSheet = false
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
        }
    }
    
    // Check onboarding status
    func checkStatus() async {
        do {
            let response: Data = try await APIClient.shared.get("/api/onboarding/status")
            if let status = try? JSONDecoder().decode(OnboardingStatus.self, from: response) {
                if let step = OnboardingStep(rawValue: status.onboardingStep) {
                    currentStep = step
                }
                
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
            case .terms:
                let success = await acceptTerms()
                if success {
                    withAnimation {
                        currentStep = .bankConnection
                    }
                }
            case .bankConnection:
                completeOnboarding()
            }
        }
    }
    
    private func completeOnboarding() {
        // TODO: Implement backend integration
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
        NotificationCenter.default.post(name: NSNotification.Name("OnboardingCompleted"), object: nil)
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