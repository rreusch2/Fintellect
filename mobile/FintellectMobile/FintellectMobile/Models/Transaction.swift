import Foundation

struct TransactionSummary: Codable {
    let totalIncome: Double
    let totalExpenses: Double
    let netSavings: Double
    let topCategories: [CategorySummary]
    let recentTransactions: [Transaction]
}

struct CategorySummary: Codable {
    let name: String
    let amount: Double
    let percentage: Double
}

struct Transaction: Codable, Identifiable {
    let id: String
    let date: Date
    let merchantName: String
    let amount: Double
    let category: String
}

struct AIInsight: Codable, Identifiable {
    let id: String
    let type: InsightType
    let title: String
    let description: String
    let severity: InsightSeverity
    let category: String
    let timestamp: Date
}

enum InsightType: String, Codable {
    case spending
    case saving
    case budget
    case income
    case investment
}

enum InsightSeverity: String, Codable {
    case low
    case medium
    case high
    case positive
} 