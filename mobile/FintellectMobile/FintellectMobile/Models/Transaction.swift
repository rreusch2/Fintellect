import SwiftUI

enum TransactionCategory {
    case food(String)
    case transportation(String)
    case entertainment(String)
    case shopping(String)
    case utilities(String)
    case health(String)
    case housing(String)
    case travel(String)
    case income(String)
    case other(String)
    
    var displayName: String {
        switch self {
        case .food(let name),
             .transportation(let name),
             .entertainment(let name),
             .shopping(let name),
             .utilities(let name),
             .health(let name),
             .housing(let name),
             .travel(let name),
             .income(let name),
             .other(let name):
            return name
        }
    }
    
    var color: Color {
        switch self {
        case .food:
            return Color(hex: "FF9800")  // Orange
        case .transportation:
            return Color(hex: "2196F3")  // Blue
        case .entertainment:
            return Color(hex: "E91E63")  // Pink
        case .shopping:
            return Color(hex: "9C27B0")  // Purple
        case .utilities:
            return Color(hex: "FFA726")  // Amber
        case .health:
            return Color(hex: "FF4081")  // Rose
        case .housing:
            return Color(hex: "4CAF50")  // Green
        case .travel:
            return Color(hex: "00BCD4")  // Cyan
        case .income:
            return Color(hex: "66BB6A")  // Light Green
        case .other:
            return Color(hex: "9E9E9E")  // Gray
        }
    }
    
    var icon: String {
        switch self {
        case .food:
            return "fork.knife"
        case .transportation:
            return "car.fill"
        case .entertainment:
            return "tv.fill"
        case .shopping:
            return "cart.fill"
        case .utilities:
            return "bolt.fill"
        case .health:
            return "cross.case.fill"
        case .housing:
            return "house.fill"
        case .travel:
            return "airplane"
        case .income:
            return "arrow.down.circle.fill"
        case .other:
            return "tag.fill"
        }
    }
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
            Transaction(id: UUID().uuidString, name: "Whole Foods Market", amount: -82.47, date: dates[0], category: .food("Whole Foods Market")),
            Transaction(id: UUID().uuidString, name: "Netflix Subscription", amount: -15.99, date: dates[1], category: .entertainment("Netflix")),
            Transaction(id: UUID().uuidString, name: "Target", amount: -156.32, date: dates[2], category: .shopping("Target")),
            Transaction(id: UUID().uuidString, name: "Electric Bill", amount: -124.56, date: dates[3], category: .utilities("Electricity")),
            Transaction(id: UUID().uuidString, name: "Uber Ride", amount: -28.45, date: dates[4], category: .transportation("Uber"))
        ]
    }
    #endif
} 