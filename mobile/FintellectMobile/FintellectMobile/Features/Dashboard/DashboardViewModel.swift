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
}

struct AIInsight: Codable, Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let description: String
}

// MARK: - View Model
@MainActor
class DashboardViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var transactionSummary: TransactionSummary?
    @Published var insights: [AIInsight] = []
    
    init() {
        Task {
            await fetchDashboardData()
        }
    }
    
    func fetchDashboardData() async {
        isLoading = true
        error = nil
        
        do {
            // Since we haven't integrated Plaid yet, use demo data
            if let user = try? await fetchUser(), user.username == "DemoUser" {
                self.transactionSummary = TransactionSummary.demoData
                self.insights = AIInsight.demoInsights
                return
            }
            
            // Fetch real data once Plaid is integrated
            await withThrowingTaskGroup(of: Void.self) { group in
                group.addTask {
                    let data = try await APIClient.shared.get("/api/dashboard/transactions/summary")
                    if let summary = try? JSONDecoder().decode(TransactionSummary.self, from: data) {
                        self.transactionSummary = summary
                    }
                }
                
                group.addTask {
                    let data = try await APIClient.shared.get("/api/dashboard/insights")
                    if let fetchedInsights = try? JSONDecoder().decode([AIInsight].self, from: data) {
                        self.insights = fetchedInsights
                    }
                }
                
                // Wait for all tasks to complete
                try await group.waitForAll()
            }
        } catch {
            self.error = error.localizedDescription
            print("[Dashboard] Error fetching data:", error)
        }
        
        isLoading = false
    }
    
    private func fetchUser() async throws -> User? {
        let data = try await APIClient.shared.get("/api/auth/mobile/verify")
        return try? JSONDecoder().decode(User.self, from: data)
    }
}

// MARK: - Demo Data
extension TransactionSummary {
    static var demoData: TransactionSummary {
        TransactionSummary(
            totalIncome: 5000.00,
            totalExpenses: 3500.00,
            netSavings: 1500.00,
            topCategories: [
                CategorySummary(name: "Housing", amount: 1500.00, percentage: 0.43),
                CategorySummary(name: "Food", amount: 800.00, percentage: 0.23),
                CategorySummary(name: "Transportation", amount: 400.00, percentage: 0.11),
                CategorySummary(name: "Entertainment", amount: 300.00, percentage: 0.09)
            ],
            recentTransactions: [
                Transaction(
                    id: "1",
                    date: Date(),
                    merchantName: "Whole Foods",
                    amount: 85.47,
                    category: "Food"
                ),
                Transaction(
                    id: "2",
                    date: Date().addingTimeInterval(-86400),
                    merchantName: "Netflix",
                    amount: 14.99,
                    category: "Entertainment"
                ),
                Transaction(
                    id: "3",
                    date: Date().addingTimeInterval(-172800),
                    merchantName: "Shell Gas",
                    amount: 45.00,
                    category: "Transportation"
                )
            ]
        )
    }
}

extension AIInsight {
    static var demoInsights: [AIInsight] {
        [
            AIInsight(
                id: "1",
                type: .spending,
                title: "Monthly Spending Analysis",
                description: "Your spending in Food & Dining is 15% higher than last month. Consider reviewing your grocery shopping habits.",
                severity: .medium,
                category: "Food & Dining",
                timestamp: Date()
            ),
            AIInsight(
                id: "2",
                type: .saving,
                title: "Savings Opportunity",
                description: "You could save $25/month by optimizing your streaming subscriptions.",
                severity: .low,
                category: "Entertainment",
                timestamp: Date()
            ),
            AIInsight(
                id: "3",
                type: .budget,
                title: "Budget Alert",
                description: "You're on track to stay under budget this month! Keep up the good work.",
                severity: .positive,
                category: "Overall",
                timestamp: Date()
            )
        ]
    }
} 