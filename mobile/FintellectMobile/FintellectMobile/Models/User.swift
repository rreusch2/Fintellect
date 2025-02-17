import Foundation

struct User: Codable {
    let id: Int
    let username: String
    let hasPlaidSetup: Bool
    let hasCompletedOnboarding: Bool
    let monthlyIncome: Int?
    let onboardingStep: Int?
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case hasPlaidSetup = "hasPlaidSetup"
        case hasCompletedOnboarding = "hasCompletedOnboarding"
        case monthlyIncome = "monthlyIncome"
        case onboardingStep = "onboardingStep"
    }
} 