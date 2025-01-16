import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String?
    let username: String
    let hasPlaidSetup: Bool
    let hasCompletedOnboarding: Bool
    let monthlyIncome: Double?
    let onboardingStep: String?
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case username
        case hasPlaidSetup
        case hasCompletedOnboarding
        case monthlyIncome
        case onboardingStep
        case createdAt
        case updatedAt
    }
} 