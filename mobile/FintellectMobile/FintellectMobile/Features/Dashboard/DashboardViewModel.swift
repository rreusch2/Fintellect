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
        
        #if DEBUG
        // Use mock data in debug builds
        totalBalance = 6988.76
        monthlySpending = 1595.97
        monthlySavings = 892.45
        
        aiInsights = [
            AIInsight(
                type: "HIGH",
                title: "High Food & Drink Spending",
                description: "Your food and dining expenses are $366.18 (22.9% of total spending). Consider setting a monthly budget of $292.94 to save $73.24 per month."
            ),
            AIInsight(
                type: "MEDIUM",
                title: "Top Spending Categories",
                description: "Your highest spending areas are: UTILITIES $594.96 (37.3%) FOOD AND DRINK $366.18 (22.9%) SHOPPING $314.92 (19.7%)"
            ),
            AIInsight(
                type: "HIGH",
                title: "Monthly Budget Optimization",
                description: "Based on your spending patterns, here's a recommended monthly budget: Essential expenses $1410.65 (70.7%) Potential monthly savings: $239.40 by optimizing essential expenses."
            )
        ]
        
        isLoading = false
        return
        #endif
        
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
struct TransactionSummary: Codable {
    let totalTransactions: Int
    let totalAmount: Double
    let averageAmount: Double
    
    enum CodingKeys: String, CodingKey {
        case totalTransactions = "total_transactions"
        case totalAmount = "total_amount"
        case averageAmount = "average_amount"
    }
}

struct AIInsight: Codable, Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let description: String
} 