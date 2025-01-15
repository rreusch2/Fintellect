import SwiftUI

// MARK: - Income Frequency
enum IncomeFrequency: String, CaseIterable {
    case weekly = "Weekly"
    case biweekly = "Bi-weekly"
    case monthly = "Monthly"
    case quarterly = "Quarterly"
    case annually = "Annually"
    case irregular = "Irregular"
}

// MARK: - Income Source Type
enum IncomeSourceType: String, CaseIterable {
    case salary = "Salary"
    case hourlyWage = "Hourly Wage"
    case bonus = "Bonus"
    case commission = "Commission"
    case investment = "Investment"
    case rental = "Rental"
    case business = "Business"
    case freelance = "Freelance"
    case sideGig = "Side Gig"
    case other = "Other"
}

// MARK: - Income Source
struct IncomeSource: Identifiable {
    let id = UUID()
    var type: IncomeSourceType
    var amount: Double
    var frequency: IncomeFrequency
    var description: String
}

// MARK: - Income Structure
struct IncomeStructure {
    var primaryIncome: Double = 0
    var frequency: IncomeFrequency = .monthly
    var additionalSources: [IncomeSource] = []
    var stabilityRating: Int = 3 // 1-5 scale
    
    var monthlyIncome: Double {
        let primaryMonthly = convertToMonthly(amount: primaryIncome, frequency: frequency)
        let additionalMonthly = additionalSources.reduce(0) { total, source in
            total + convertToMonthly(amount: source.amount, frequency: source.frequency)
        }
        return primaryMonthly + additionalMonthly
    }
    
    private func convertToMonthly(amount: Double, frequency: IncomeFrequency) -> Double {
        switch frequency {
        case .weekly:
            return amount * 52 / 12
        case .biweekly:
            return amount * 26 / 12
        case .monthly:
            return amount
        case .quarterly:
            return amount / 3
        case .annually:
            return amount / 12
        case .irregular:
            return amount // Assume irregular income is already normalized to monthly
        }
    }
} 