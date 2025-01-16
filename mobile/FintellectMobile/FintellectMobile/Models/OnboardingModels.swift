import Foundation

struct OnboardingStatus: Codable {
    let currentStep: String
    let isComplete: Bool
    let hasAcceptedTerms: Bool
    let hasAcceptedPrivacy: Bool
}

struct LegalConsent: Codable {
    let termsAccepted: Bool
    let privacyAccepted: Bool
    let acceptedAt: Date?
} 