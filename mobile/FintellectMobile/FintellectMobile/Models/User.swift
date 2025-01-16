import Foundation

struct User: Codable {
    let id: Int
    let username: String
    let email: String
    let hasPlaidSetup: Bool
    let hasCompletedOnboarding: Bool
    let monthlyIncome: Int
    let onboardingStep: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case email
        case hasPlaidSetup = "hasPlaidSetup"
        case hasCompletedOnboarding = "hasCompletedOnboarding"
        case monthlyIncome = "monthlyIncome"
        case onboardingStep = "onboardingStep"
    }
} 