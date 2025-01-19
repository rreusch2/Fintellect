import SwiftUI

enum TransactionCategory: String {
    case food = "FOOD_AND_DRINK"
    case transportation = "TRANSPORTATION"
    case entertainment = "ENTERTAINMENT"
    case shopping = "GENERAL_MERCHANDISE"
    case utilities = "GENERAL_SERVICES"
    case health = "PERSONAL_CARE"
    case housing = "HOUSING"
    case travel = "TRAVEL"
    case income = "INCOME"
    case other = "OTHER"
}

struct Transaction: Identifiable {
    let id: String
    let name: String
    let amount: Double
    let date: Date
    let category: TransactionCategory
    
    var isExpense: Bool {
        amount > 0  // In Plaid, positive amounts are expenses
    }
    
    var formattedAmount: String {
        amount.formatted(.currency(code: "USD"))
    }
    
    var formattedDate: String {
        date.formatted(date: .abbreviated, time: .omitted)
    }
    
    #if DEBUG
    static var demoTransactions: [Transaction] {
        let calendar = Calendar.current
        let today = Date()
        let dates = (0..<30).map { days in
            calendar.date(byAdding: .day, value: -days, to: today) ?? today
        }
        
        return [
            Transaction(id: UUID().uuidString, name: "Whole Foods Market", amount: -82.47, date: dates[0], category: .food),
            Transaction(id: UUID().uuidString, name: "Netflix Subscription", amount: -15.99, date: dates[1], category: .entertainment),
            Transaction(id: UUID().uuidString, name: "Target", amount: -156.32, date: dates[2], category: .shopping),
            Transaction(id: UUID().uuidString, name: "Electric Bill", amount: -124.56, date: dates[3], category: .utilities),
            Transaction(id: UUID().uuidString, name: "Uber Ride", amount: -28.45, date: dates[4], category: .transportation)
        ]
    }
    #endif
}

enum TransactionCategory: String, Codable, CaseIterable {
    case food = "Food & Dining"
    case shopping = "Shopping"
    case utilities = "Utilities"
    case entertainment = "Entertainment"
    case transportation = "Transportation"
    case health = "Health"
    case other = "Other"
    
    var color: Color {
        switch self {
        case .food: return Color(hex: "10B981")         // Green
        case .shopping: return Color(hex: "8B5CF6")     // Purple
        case .utilities: return Color(hex: "3B82F6")    // Blue
        case .entertainment: return Color(hex: "F59E0B") // Orange
        case .transportation: return Color(hex: "EC4899")// Pink
        case .health: return Color(hex: "6366F1")       // Indigo
        case .other: return Color(hex: "64748B")        // Gray
        }
    }
    
    var icon: String {
        switch self {
        case .food: return "fork.knife"
        case .shopping: return "cart.fill"
        case .utilities: return "bolt.fill"
        case .entertainment: return "tv.fill"
        case .transportation: return "car.fill"
        case .health: return "heart.fill"
        case .other: return "circle.fill"
        }
    }
} 