import Foundation
import SwiftUI

// MARK: - Models
struct TransactionSummary: Codable {
    let totalBalance: Int
    let monthlySpending: Int
    let monthlySavings: Int
    let transactions: [Transaction]
    let totalTransactions: Int
    let totalAmount: Double
    let averageAmount: Double
    
    enum CodingKeys: String, CodingKey {
        case totalBalance = "total_balance"
        case monthlySpending = "monthly_spending"
        case monthlySavings = "monthly_savings"
        case transactions
        case totalTransactions = "total_transactions"
        case totalAmount = "total_amount"
        case averageAmount = "average_amount"
    }
    
    #if DEBUG
    static var demoData: TransactionSummary {
        TransactionSummary(
            totalBalance: 698876,  // $6,988.76
            monthlySpending: 159597, // $1,595.97
            monthlySavings: 89245,  // $892.45
            transactions: Transaction.demoTransactions,
            totalTransactions: 5,
            totalAmount: 407.79,
            averageAmount: 81.56
        )
    }
    #endif
}

struct AIInsight: Codable, Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let description: String
    
    #if DEBUG
    static var demoInsights: [AIInsight] {
        [
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
    }
    #endif
}

// MARK: - View Model
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
        // Use demo data in debug builds
        let summary = TransactionSummary.demoData
        totalBalance = Double(summary.totalBalance) / 100.0
        monthlySpending = Double(summary.monthlySpending) / 100.0
        monthlySavings = Double(summary.monthlySavings) / 100.0
        recentTransactions = summary.transactions
        aiInsights = AIInsight.demoInsights
        isLoading = false
        return
        #endif
        
        do {
            // Fetch transaction summary
            let summaryData = try await APIClient.shared.get("/api/plaid/transactions/summary")
            if let summary = try? JSONDecoder().decode(TransactionSummary.self, from: summaryData) {
                totalBalance = Double(summary.totalBalance) / 100.0
                monthlySpending = Double(summary.monthlySpending) / 100.0
                monthlySavings = Double(summary.monthlySavings) / 100.0
                recentTransactions = summary.transactions
            }
            
            // Fetch AI insights
            let insightsData = try await APIClient.shared.get("/api/ai/dashboard-insights")
            if let insights = try? JSONDecoder().decode([AIInsight].self, from: insightsData) {
                aiInsights = insights
            }
            
        } catch {
            self.error = error.localizedDescription
            print("[Dashboard] Error fetching data:", error)
        }
        
        isLoading = false
    }
} 