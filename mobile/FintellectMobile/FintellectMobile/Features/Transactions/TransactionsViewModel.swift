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
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
            dateFormatter.timeZone = TimeZone(abbreviation: "UTC")
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                let dateString = try container.decode(String.self)
                
                if let date = dateFormatter.date(from: dateString) {
                    return date
                }
                
                // Try without milliseconds if the first attempt fails
                dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
                if let date = dateFormatter.date(from: dateString) {
                    return date
                }
                
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
            }
            
            do {
                let plaidTransactions = try decoder.decode([PlaidTransaction].self, from: data)
                print("[Transactions] Successfully decoded \(plaidTransactions.count) transactions")
                self.transactions = plaidTransactions.map { plaidTx in
                    Transaction(
                        id: String(plaidTx.id),
                        name: plaidTx.merchantName ?? plaidTx.description,
                        amount: Double(plaidTx.amount) / 100.0,
                        date: plaidTx.date,
                        category: mapPlaidCategory(plaidTx.category)
                    )
                }
            } catch let decodingError {
                print("[Transactions] Decoding error details:", decodingError)
                throw APIError.decodingError(NSError(domain: "TransactionsViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode transactions"]))
            }
        } catch {
            print("[Transactions] Error fetching transactions:", error)
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func mapPlaidCategory(_ category: String) -> TransactionCategory {
        switch category {
        case "FOOD_AND_DRINK":
            return .food("Food & Drink")
        case "TRANSPORTATION":
            return .transportation("Transportation")
        case "ENTERTAINMENT":
            return .entertainment("Entertainment")
        case "GENERAL_MERCHANDISE", "SHOPPING":
            return .shopping("Shopping")
        case "UTILITIES":
            return .utilities("Bills & Utilities")
        case "HEALTHCARE":
            return .health("Healthcare")
        case "HOUSING":
            return .housing("Housing")
        case "TRAVEL":
            return .travel("Travel")
        case "INCOME", "TRANSFER_IN":
            return .income("Income")
        case "LOAN_PAYMENTS":
            return .other("Loan Payment")
        case "GENERAL_SERVICES":
            return .other("General Services")
        case "PERSONAL_CARE":
            return .other("Personal Care")
        case "TRANSFER_OUT":
            return .other("Transfer")
        default:
            return .other("Other")
        }
    }
}

// MARK: - Models
struct PlaidTransaction: Codable {
    let id: Int
    let amount: Int
    let category: String
    let subcategory: String?
    let originalCategory: String?
    let date: Date
    let description: String
    let merchantName: String?
    let accountId: Int
} 