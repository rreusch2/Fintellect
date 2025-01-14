import SwiftUI

class TransactionsViewModel: ObservableObject {
    @Published var transactions: [Transaction] = []
    @Published var startDate: Date?
    @Published var endDate: Date?
    
    // MARK: - Computed Properties
    var totalSpending: Double {
        transactions.filter { $0.isExpense }.reduce(0) { $0 + abs($1.amount) }
    }
    
    var averageTransaction: Double {
        guard !transactions.isEmpty else { return 0 }
        return totalSpending / Double(transactions.count)
    }
    
    var topCategory: TransactionCategory? {
        let categoryTotals = Dictionary(grouping: transactions.filter { $0.isExpense }, by: { $0.category })
            .mapValues { transactions in
                transactions.reduce(0) { $0 + abs($1.amount) }
            }
        return categoryTotals.max(by: { $0.value < $1.value })?.key
    }
    
    var topCategoryAmount: Double {
        guard let category = topCategory else { return 0 }
        return transactions
            .filter { $0.category == category && $0.isExpense }
            .reduce(0) { $0 + abs($1.amount) }
    }
    
    init() {
        loadMockData()
    }
    
    private func loadMockData() {
        // Generate dates for the last 30 days
        let calendar = Calendar.current
        let today = Date()
        let dates = (0..<30).map { days in
            calendar.date(byAdding: .day, value: -days, to: today) ?? today
        }
        
        // Mock transaction data
        transactions = [
            Transaction(name: "Whole Foods Market", amount: -82.47, date: dates[0], category: .food),
            Transaction(name: "Netflix Subscription", amount: -15.99, date: dates[1], category: .entertainment),
            Transaction(name: "Target", amount: -156.32, date: dates[2], category: .shopping),
            Transaction(name: "Electric Bill", amount: -124.56, date: dates[3], category: .utilities),
            Transaction(name: "Uber Ride", amount: -28.45, date: dates[4], category: .transportation),
            Transaction(name: "CVS Pharmacy", amount: -45.23, date: dates[5], category: .health),
            Transaction(name: "Amazon Prime", amount: -14.99, date: dates[6], category: .shopping),
            Transaction(name: "Starbucks", amount: -6.75, date: dates[7], category: .food),
            Transaction(name: "Movie Tickets", amount: -32.50, date: dates[8], category: .entertainment),
            Transaction(name: "Gas Station", amount: -48.62, date: dates[9], category: .transportation),
            Transaction(name: "Salary Deposit", amount: 3500.00, date: dates[10], category: .other),
            Transaction(name: "Gym Membership", amount: -79.99, date: dates[11], category: .health),
            Transaction(name: "Restaurant", amount: -95.43, date: dates[12], category: .food),
            Transaction(name: "Water Bill", amount: -78.34, date: dates[13], category: .utilities),
            Transaction(name: "Apple Music", amount: -9.99, date: dates[14], category: .entertainment)
        ]
    }
} 