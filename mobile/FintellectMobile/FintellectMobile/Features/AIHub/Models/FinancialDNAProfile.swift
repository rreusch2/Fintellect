import Foundation

// MARK: - Financial DNA Profile Models
struct FinancialDNAProfile: Codable {
    var id: UUID = UUID()
    var requiredInfo: RequiredInformation
    var optionalInfo: OptionalInformation
    var lastUpdated: Date = Date()
    
    var completionPercentage: Double {
        var total = 0.0
        var completed = 0.0
        
        // Required fields (weight: 60%)
        total += 3 // financialGoals, incomeStructure, livingSituation
        if !requiredInfo.financialGoals.isEmpty { completed += 1 }
        if requiredInfo.incomeStructure.primaryIncome > 0 { completed += 1 }
        if requiredInfo.livingSituation.monthlyHousingCost > 0 { completed += 1 }
        
        // Optional fields (weight: 40%)
        total += 4 // career, preferences, lifeEvents, stressPoints
        if optionalInfo.career.profession != nil { completed += 1 }
        if optionalInfo.preferences.riskTolerance != nil { completed += 1 }
        if !optionalInfo.lifeEvents.isEmpty { completed += 1 }
        if !optionalInfo.stressPoints.isEmpty { completed += 1 }
        
        return (completed / total) * 100
    }
}

// MARK: - Required Information
struct RequiredInformation: Codable {
    var financialGoals: [FinancialGoal]
    var incomeStructure: IncomeStructure
    var livingSituation: LivingSituation
}

struct FinancialGoal: Codable, Identifiable {
    var id: UUID = UUID()
    var timeframe: GoalTimeframe
    var description: String
    var targetAmount: Double?
    var priority: Int // 1-3
}

enum GoalTimeframe: String, Codable, CaseIterable {
    case shortTerm = "Short-term (12 months)"
    case mediumTerm = "Medium-term (1-5 years)"
    case longTerm = "Long-term (5+ years)"
}

struct IncomeStructure: Codable {
    var primaryIncome: Double
    var frequency: IncomeFrequency
    var additionalSources: [IncomeSource]
    var stabilityRating: Int // 1-5
}

enum IncomeFrequency: String, Codable, CaseIterable {
    case weekly = "Weekly"
    case biweekly = "Bi-weekly"
    case monthly = "Monthly"
    case annually = "Annually"
}

struct IncomeSource: Codable, Identifiable {
    var id: UUID = UUID()
    var description: String
    var amount: Double
    var frequency: IncomeFrequency
}

struct LivingSituation: Codable {
    var housingStatus: HousingStatus
    var monthlyHousingCost: Double
    var householdSize: Int
}

enum HousingStatus: String, Codable, CaseIterable {
    case own = "Own"
    case rent = "Rent"
    case other = "Other"
}

// MARK: - Optional Information
struct OptionalInformation: Codable {
    var career: CareerInfo
    var preferences: FinancialPreferences
    var lifeEvents: [LifeEvent]
    var stressPoints: [StressPoint]
}

struct CareerInfo: Codable {
    var profession: String?
    var careerGoals: [String]
    var educationLevel: EducationLevel?
    var certifications: [String]
}

enum EducationLevel: String, Codable, CaseIterable {
    case highSchool = "High School"
    case associate = "Associate's Degree"
    case bachelor = "Bachelor's Degree"
    case master = "Master's Degree"
    case doctorate = "Doctorate"
    case other = "Other"
}

struct FinancialPreferences: Codable {
    var riskTolerance: Int? // 1-5
    var preferredSavingMethods: [SavingMethod]
    var investmentInterests: [InvestmentType]
    var debtComfortLevel: Int? // 1-5
}

enum SavingMethod: String, Codable, CaseIterable {
    case traditional = "Traditional Savings"
    case automatic = "Automatic Transfers"
    case roundUp = "Round-up Savings"
    case goalBased = "Goal-based Saving"
}

enum InvestmentType: String, Codable, CaseIterable {
    case stocks = "Stocks"
    case bonds = "Bonds"
    case realEstate = "Real Estate"
    case crypto = "Cryptocurrency"
    case retirement = "Retirement Accounts"
}

struct LifeEvent: Codable, Identifiable {
    var id: UUID = UUID()
    var type: LifeEventType
    var expectedDate: Date
    var estimatedCost: Double?
    var description: String
}

enum LifeEventType: String, Codable, CaseIterable {
    case marriage = "Marriage"
    case children = "Children"
    case homeOwnership = "Home Ownership"
    case education = "Education"
    case retirement = "Retirement"
    case other = "Other"
}

struct StressPoint: Codable, Identifiable {
    var id: UUID = UUID()
    var category: StressCategory
    var description: String
    var priority: Int // 1-3
}

enum StressCategory: String, Codable, CaseIterable {
    case debt = "Debt"
    case savings = "Savings"
    case income = "Income"
    case expenses = "Expenses"
    case investment = "Investment"
    case other = "Other"
} 