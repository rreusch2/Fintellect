import SwiftUI

class TransactionsViewModel: ObservableObject {
    @Published var transactions: [Transaction] = []
    @Published var startDate: Date?
    @Published var endDate: Date?
    @Published var isLoading = false
    @Published var error: String?
    
    // MARK: - Computed Properties
    var totalSpending: Double {
        transactions.filter { $0.isExpense }.reduce(0.0) { $0 + abs($1.amount) }
    }
    
    var averageTransaction: Double {
        guard !transactions.isEmpty else { return 0.0 }
        return totalSpending / Double(transactions.filter { $0.isExpense }.count)
    }
    
    var topCategory: TransactionCategory? {
        let categoryTotals = Dictionary(grouping: transactions.filter { $0.isExpense }, by: { $0.category })
            .mapValues { transactions in
                transactions.reduce(0.0) { $0 + abs($1.amount) }
            }
        return categoryTotals.max(by: { $0.value < $1.value })?.key
    }
    
    var topCategoryAmount: Double {
        guard let category = topCategory else { return 0.0 }
        return transactions
            .filter { $0.category == category && $0.isExpense }
            .reduce(0.0) { $0 + abs($1.amount) }
    }
    
    init() {
        Task { await fetchTransactions() }
    }
    
    @MainActor
    func fetchTransactions() async {
        isLoading = true
        error = nil
        
        do {
            print("[Transactions] Fetching transactions")
            let data = try await APIClient.shared.get("/api/plaid/transactions")
            
            if let transactionsData = try? JSONDecoder().decode([PlaidTransaction].self, from: data) {
                print("[Transactions] Successfully decoded \(transactionsData.count) transactions")
                self.transactions = transactionsData.map { plaidTx in
                    Transaction(
                        id: plaidTx.id,
                        name: plaidTx.merchantName ?? plaidTx.name,
                        amount: Double(plaidTx.amount) / 100.0,
                        date: plaidTx.date,
                        category: mapPlaidCategory(plaidTx.category)
                    )
                }
            } else {
                throw APIError.decodingError(NSError(domain: "TransactionsViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode transactions"]))
            }
        } catch {
            print("[Transactions] Error fetching transactions:", error)
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func mapPlaidCategory(_ category: String) -> TransactionCategory {
        let upperCategory = category.uppercased()
        switch upperCategory {
        case _ where upperCategory.contains("FOOD") || upperCategory.contains("RESTAURANT"):
            return .food
        case _ where upperCategory.contains("TRANSPORT"):
            return .transportation
        case _ where upperCategory.contains("ENTERTAINMENT") || upperCategory.contains("RECREATION"):
            return .entertainment
        case _ where upperCategory.contains("SHOPPING") || upperCategory.contains("MERCHANDISE"):
            return .shopping
        case _ where upperCategory.contains("UTILITIES") || upperCategory.contains("SERVICE"):
            return .utilities
        case _ where upperCategory.contains("HEALTH") || upperCategory.contains("MEDICAL"):
            return .health
        case _ where upperCategory.contains("HOUSE") || upperCategory.contains("RENT") || upperCategory.contains("MORTGAGE"):
            return .housing
        case _ where upperCategory.contains("TRAVEL"):
            return .travel
        case _ where upperCategory.contains("INCOME") || upperCategory.contains("DEPOSIT"):
            return .income
        default:
            return .other
        }
    }
}

// MARK: - Models
struct PlaidTransaction: Codable {
    let id: String
    let name: String
    let merchantName: String?
    let amount: Int
    let date: Date
    let category: String
    
    enum CodingKeys: String, CodingKey {
        case id = "plaidTransactionId"
        case name
        case merchantName
        case amount
        case date
        case category
    }
}

extension TransactionCategory {
    var color: Color {
        switch self {
        case .food:
            return Color(hex: "3B82F6")  // Blue
        case .transportation:
            return Color(hex: "10B981")  // Green
        case .entertainment:
            return Color(hex: "8B5CF6")  // Purple
        case .shopping:
            return Color(hex: "F59E0B")  // Orange
        case .utilities:
            return Color(hex: "EC4899")  // Pink
        case .health:
            return Color(hex: "6366F1")  // Indigo
        case .housing:
            return Color(hex: "14B8A6")  // Teal
        case .travel:
            return Color(hex: "EAB308")  // Yellow
        case .income:
            return Color(hex: "22C55E")  // Green
        case .other:
            return Color(hex: "94A3B8")  // Gray
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