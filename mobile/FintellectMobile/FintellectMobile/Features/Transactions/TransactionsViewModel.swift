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
            
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            if let plaidTransactions = try? decoder.decode([PlaidTransaction].self, from: data) {
                print("[Transactions] Successfully decoded \(plaidTransactions.count) transactions")
                self.transactions = plaidTransactions.map { plaidTx in
                    Transaction(
                        id: plaidTx.id,
                        name: plaidTx.merchantName ?? plaidTx.description,
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
    let id: Int
    let description: String
    let merchantName: String?
    let amount: Int
    let date: Date
    let category: String
    let accountId: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case description
        case merchantName
        case amount
        case date
        case category
        case accountId
    }
} 