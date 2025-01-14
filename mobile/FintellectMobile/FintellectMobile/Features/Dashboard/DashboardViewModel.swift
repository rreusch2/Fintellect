import Foundation

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var totalBalance: Double = 0
    @Published var monthlySpending: Double = 0
    @Published var monthlySavings: Double = 0
    @Published var recentTransactions: [Transaction] = []
    @Published var aiInsights: [AIInsight] = []
    @Published var isLoading = false
    @Published var error: String?
    
    func fetchDashboardData() async {
        isLoading = true
        error = nil
        
        do {
            let summary: TransactionSummary = try await APIClient.shared.get("/api/plaid/transactions/summary")
            
            totalBalance = Double(summary.totalBalance) / 100.0
            monthlySpending = Double(summary.monthlySpending) / 100.0
            monthlySavings = Double(summary.monthlySavings) / 100.0
            recentTransactions = summary.transactions
            
            // Fetch AI insights
            let insights: [AIInsight] = try await APIClient.shared.get("/api/ai/dashboard-insights")
            aiInsights = insights
            
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

// Models
struct Transaction: Codable, Identifiable {
    let id: Int
    let amount: Int
    let category: String
    let description: String
    let date: String
    let merchantName: String?
    
    var formattedAmount: String {
        let dollars = Double(amount) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

struct TransactionSummary: Codable {
    let hasPlaidConnection: Bool
    let totalBalance: Int
    let monthlySpending: Int
    let monthlySavings: Int
    let transactions: [Transaction]
}

struct AIInsight: Codable, Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let description: String
} 