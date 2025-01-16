import Foundation

// MARK: - User
struct User: Codable {
    let id: Int
    let username: String
    let hasCompletedOnboarding: Bool
    let hasPlaidSetup: Bool
    let monthlyIncome: Int?
    let onboardingStep: Int?
    let consentVersion: String?
}

// MARK: - Tokens
struct Tokens: Codable {
    let accessToken: String
    let refreshToken: String
}

// MARK: - LoginResponse
struct LoginResponse: Codable {
    let message: String?
    let user: User
    let tokens: Tokens?
}

// MARK: - RegisterResponse
struct RegisterResponse: Codable {
    let user: User
    // Registration only returns the user object
    // We'll do a separate login call to get tokens
}

// MARK: - RefreshResponse
struct RefreshResponse: Codable {
    let accessToken: String
}

// MARK: - OnboardingStatus
struct OnboardingStatus: Codable {
    let onboardingStep: Int
    let hasCompletedOnboarding: Bool
    let legalConsent: LegalConsent?
    let consentVersion: String?
}

// MARK: - LegalConsent
struct LegalConsent: Codable {
    let termsAccepted: Bool
    let privacyAccepted: Bool
    let acceptedAt: String
    let version: String
} 