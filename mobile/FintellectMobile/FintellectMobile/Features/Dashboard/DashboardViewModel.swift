import Foundation
import SwiftUI

// MARK: - Models
struct TransactionSummary: Codable {
    let totalBalance: Int
    let monthlySpending: Int
    let monthlySavings: Int
    let monthOverMonthChange: Double
    let categoryTotals: [String: Int]
    let spendingTrends: SpendingTrends
    let hasPlaidConnection: Bool
    let status: String?
    let message: String?
    
    struct SpendingTrends: Codable {
        let labels: [String]
        let data: [Int]
    }
    
    #if DEBUG
    static var demoData: TransactionSummary {
        TransactionSummary(
            totalBalance: 698876,  // $6,988.76
            monthlySpending: 159597, // $1,595.97
            monthlySavings: 89245,  // $892.45
            monthOverMonthChange: -2.5,
            categoryTotals: [
                "UTILITIES": 59496,
                "FOOD_AND_DRINK": 36618,
                "SHOPPING": 31492,
                "ENTERTAINMENT": 20000,
                "OTHER": 12000
            ],
            spendingTrends: SpendingTrends(
                labels: ["Jan 2024", "Feb 2024", "Mar 2024"],
                data: [145000, 159597, 155000]
            ),
            hasPlaidConnection: true,
            status: nil,
            message: nil
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
    @Published var monthOverMonthChange: Double = 0
    @Published var spendingCategories: [SpendingCategory] = []
    @Published var aiInsights: [AIInsight] = []
    @Published var isLoading = false
    @Published var error: String?
    
    func fetchDashboardData() async {
        isLoading = true
        error = nil
        
        #if DEBUG
        // Use demo data in debug builds
        let summary = TransactionSummary.demoData
        updateDashboardData(with: summary)
        isLoading = false
        return
        #endif
        
        do {
            // Fetch transaction summary
            let summaryData = try await APIClient.shared.get("/api/plaid/transactions/summary")
            if let summary = try? JSONDecoder().decode(TransactionSummary.self, from: summaryData) {
                updateDashboardData(with: summary)
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
    
    private func updateDashboardData(with summary: TransactionSummary) {
        // Convert amounts from cents to dollars
        totalBalance = Double(summary.totalBalance) / 100.0
        monthlySpending = Double(summary.monthlySpending) / 100.0
        monthlySavings = Double(summary.monthlySavings) / 100.0
        monthOverMonthChange = summary.monthOverMonthChange
        
        // Calculate total spending for percentages
        let totalSpending = Double(summary.monthlySpending)
        
        // Map category totals to SpendingCategory objects
        let categoryColors: [String: Color] = [
            "UTILITIES": Color(hex: "3B82F6"),
            "FOOD_AND_DRINK": Color(hex: "10B981"),
            "SHOPPING": Color(hex: "8B5CF6"),
            "ENTERTAINMENT": Color(hex: "F59E0B"),
            "OTHER": Color(hex: "EC4899")
        ]
        
        spendingCategories = summary.categoryTotals.map { category, amount in
            let percentage = totalSpending > 0 ? Double(amount) / totalSpending : 0
            return SpendingCategory(
                name: category.replacingOccurrences(of: "_", with: " ").capitalized,
                amount: Double(amount) / 100.0,
                percentage: percentage,
                color: categoryColors[category] ?? Color(hex: "EC4899")
            )
        }.sorted { $0.amount > $1.amount }
    }
} 