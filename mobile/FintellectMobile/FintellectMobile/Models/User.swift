import Foundation

struct User: Codable {
    let id: Int
    let username: String
    let hasCompletedOnboarding: Bool
    let hasPlaidSetup: Bool
    let monthlyIncome: Int?
    let onboardingStep: Int?
    
    var monthlyIncomeFormatted: String {
        guard let income = monthlyIncome else { return "Not set" }
        let dollars = Double(income) / 100.0
        return String(format: "$%.2f", dollars)
    }
} 