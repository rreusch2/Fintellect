import SwiftUI

// MARK: - Housing Status
enum HousingStatus: String, CaseIterable {
    case own = "Own"
    case rent = "Rent"
    case other = "Other"
}

// MARK: - Education Level
enum EducationLevel: String, CaseIterable {
    case highSchool = "High School"
    case associate = "Associate's Degree"
    case bachelor = "Bachelor's Degree"
    case master = "Master's Degree"
    case doctorate = "Doctorate"
    case other = "Other"
}

// MARK: - Saving Method
enum SavingMethod: String, CaseIterable {
    case traditionalSavings = "Traditional Savings Account"
    case highYieldSavings = "High-Yield Savings Account"
    case cd = "Certificate of Deposit (CD)"
    case moneyMarket = "Money Market Account"
    case retirement401k = "401(k)"
    case ira = "IRA"
    case other = "Other"
}

// MARK: - Investment Type
enum InvestmentType: String, CaseIterable {
    case stocks = "Stocks"
    case bonds = "Bonds"
    case mutualFunds = "Mutual Funds"
    case etfs = "ETFs"
    case realEstate = "Real Estate"
    case crypto = "Cryptocurrency"
    case commodities = "Commodities"
    case other = "Other"
}

// MARK: - Life Event Type
enum LifeEventType: String, CaseIterable {
    case education = "Education"
    case career = "Career Change"
    case marriage = "Marriage"
    case children = "Children"
    case homeOwnership = "Home Ownership"
    case retirement = "Retirement"
    case travel = "Travel"
    case other = "Other"
}

// MARK: - Stress Category
enum StressCategory: String, CaseIterable {
    case debt = "Debt"
    case income = "Income"
    case expenses = "Expenses"
    case savings = "Savings"
    case investment = "Investment"
    case retirement = "Retirement"
    case other = "Other"
}

// MARK: - Financial Goal
struct FinancialGoal: Identifiable {
    let id = UUID()
    var timeframe: GoalTimeframe
    var description: String
    var priority: Int
    var targetAmount: Double?
    var currentAmount: Double?
    
    enum GoalTimeframe: String, CaseIterable {
        case shortTerm = "Short Term (< 1 year)"
        case mediumTerm = "Medium Term (1-5 years)"
        case longTerm = "Long Term (> 5 years)"
    }
}

// MARK: - Living Situation
struct LivingSituation {
    var housingStatus: HousingStatus = .rent
    var monthlyHousingCost: Double = 0
    var householdSize: Int = 1
}

// MARK: - Career Info
struct CareerInfo {
    var profession: String?
    var educationLevel: EducationLevel?
    var careerGoals: [String] = []
    var certifications: [String] = []
}

// MARK: - Financial Preferences
struct FinancialPreferences {
    var riskTolerance: Int?
    var preferredSavingMethods: [SavingMethod] = []
    var investmentInterests: [InvestmentType] = []
    var debtComfortLevel: Int?
}

// MARK: - Life Event
struct LifeEvent: Identifiable {
    let id = UUID()
    var type: LifeEventType
    var expectedDate: Date
    var description: String
    var estimatedCost: Double?
}

// MARK: - Stress Point
struct StressPoint: Identifiable {
    let id = UUID()
    var category: StressCategory
    var description: String
    var priority: Int
}

// MARK: - Required Info
struct RequiredInfo {
    var financialGoals: [FinancialGoal] = []
    var incomeStructure = IncomeStructure()
    var livingSituation = LivingSituation()
}

// MARK: - Optional Info
struct OptionalInfo {
    var career = CareerInfo()
    var preferences = FinancialPreferences()
    var lifeEvents: [LifeEvent] = []
    var stressPoints: [StressPoint] = []
}

// MARK: - Financial DNA Profile
struct FinancialDNAProfile {
    var requiredInfo = RequiredInfo()
    var optionalInfo = OptionalInfo()
} 