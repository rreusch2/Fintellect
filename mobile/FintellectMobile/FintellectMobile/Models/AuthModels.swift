import Foundation

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: String
    let email: String?
    let username: String
    let hasPlaidSetup: Bool
    let hasCompletedOnboarding: Bool
    let monthlyIncome: Double?
    let createdAt: Date?
    let updatedAt: Date?
}

// MARK: - Authentication Response Models
struct LoginResponse: Codable {
    let message: String
    let user: User
    let tokens: Tokens
}

struct RegisterResponse: Codable {
    let message: String
    let user: User
}

struct RefreshResponse: Codable {
    let message: String
    let accessToken: String
}

struct Tokens: Codable {
    let accessToken: String
    let refreshToken: String
}

// MARK: - Onboarding Models
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
} 