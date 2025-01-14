import Foundation

struct User: Codable {
    let id: Int
    let username: String
    let hasPlaidSetup: Bool
    let hasCompletedOnboarding: Bool
    let monthlyIncome: Int?
    let onboardingStep: Int?
} 