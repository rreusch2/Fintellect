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
            totalBalance: 44766,  // $447.66
            monthlySpending: 300000, // $3,000 total monthly spending
            monthlySavings: 0,  // No savings detected yet
            monthOverMonthChange: 0,
            categoryTotals: [
                "FOOD_AND_DRINK": 88000,  // $880
                "TRANSPORTATION": 19800,   // $198
                "ENTERTAINMENT": 7500,     // $75
                "GENERAL_MERCHANDISE": 90000, // $900
                "LOAN_PAYMENTS": 17000,    // $170
                "PERSONAL_CARE": 2600,     // $26
                "GENERAL_SERVICES": 78100   // $781
            ],
            spendingTrends: SpendingTrends(
                labels: ["Previous", "Current"],
                data: [280000, 300000]  // $2,800 vs $3,000
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
    private let aiService: AIBackendService
    
    @Published var totalBalance: Double = 0
    @Published var monthlySpending: Double = 0
    @Published var monthlySavings: Double = 0
    @Published var monthOverMonthChange: Double = 0
    @Published var spendingCategories: [SpendingCategory] = []
    @Published var aiInsights: [AIInsight] = []
    @Published var isLoading = false
    @Published var error: Error?
    @Published var insights: [AIInsight] = []
    @Published var chatMessages: [ChatMessage] = []
    @Published var isLoadingInsights = false
    @Published var isLoadingChat = false
    
    init(aiService: AIBackendService = AIBackendService()) {
        self.aiService = aiService
        Task {
            await fetchInsights()
        }
    }
    
    func fetchInsights() async {
        isLoadingInsights = true
        error = nil
        
        do {
            insights = try await aiService.fetchDashboardInsights()
        } catch {
            self.error = error
            #if DEBUG
            insights = AIInsight.demoInsights
            #endif
        }
        
        isLoadingInsights = false
    }
    
    func sendChatMessage(_ message: String) async {
        isLoadingChat = true
        error = nil
        
        // Add user message immediately
        let userMessage = ChatMessage(content: message, isUser: true)
        chatMessages.append(userMessage)
        
        do {
            let response = try await aiService.sendChatMessage(message)
            let aiMessage = ChatMessage(content: response, isUser: false)
            chatMessages.append(aiMessage)
        } catch {
            self.error = error
            // Add error message to chat
            let errorMessage = ChatMessage(
                content: "Sorry, I encountered an error. Please try again.",
                isUser: false
            )
            chatMessages.append(errorMessage)
        }
        
        isLoadingChat = false
    }
    
    func fetchDashboardData() async {
        isLoading = true
        error = nil
        
        do {
            print("[Dashboard] Fetching transaction summary")
            let summaryData = try await APIClient.shared.get("/api/plaid/transactions/summary")
            
            if let summary = try? JSONDecoder().decode(TransactionSummary.self, from: summaryData) {
                print("[Dashboard] Successfully decoded transaction summary")
                if !summary.hasPlaidConnection {
                    error = APIError.decodingError(NSError(domain: "DashboardViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode transaction summary"]))
                    isLoading = false
                    return
                }
                
                updateDashboardData(with: summary)
                print("[Dashboard] Updated dashboard with transaction summary")
            } else {
                print("[Dashboard] Failed to decode transaction summary")
                throw APIError.decodingError(NSError(domain: "DashboardViewModel", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode transaction summary"]))
            }
            
            // Fetch AI insights
            print("[Dashboard] Fetching AI insights")
            let insightsData = try await APIClient.shared.get("/api/ai/dashboard-insights")
            if let insights = try? JSONDecoder().decode([AIInsight].self, from: insightsData) {
                aiInsights = insights
                print("[Dashboard] Successfully updated AI insights")
            }
            
        } catch {
            print("[Dashboard] Error fetching data:", error)
            if let apiError = error as? APIError {
                self.error = apiError
            } else {
                self.error = error
            }
        }
        
        isLoading = false
    }
    
    private func updateDashboardData(with summary: TransactionSummary) {
        // Convert amounts from cents to dollars
        totalBalance = Double(summary.totalBalance) / 100.0
        monthlySpending = Double(summary.monthlySpending) / 100.0
        monthOverMonthChange = summary.monthOverMonthChange
        
        // Filter categories like the web app
        let filteredCategories = summary.categoryTotals.filter { category, amount in
            amount > 0 &&
            category != "INCOME" &&
            !category.contains("TRANSFER") &&
            !["OTHER", "UNCATEGORIZED"].contains(category)
        }
        
        // Calculate total spending from filtered categories
        let totalSpending = Double(filteredCategories.values.reduce(0, +))
        
        // Map category totals to SpendingCategory objects with consistent colors
        let categoryColors: [String: Color] = [
            "FOOD_AND_DRINK": Color(hex: "3B82F6"),
            "TRANSPORTATION": Color(hex: "10B981"),
            "ENTERTAINMENT": Color(hex: "8B5CF6"),
            "GENERAL_MERCHANDISE": Color(hex: "F59E0B"),
            "LOAN_PAYMENTS": Color(hex: "EC4899"),
            "PERSONAL_CARE": Color(hex: "6366F1"),
            "GENERAL_SERVICES": Color(hex: "14B8A6"),
            "TRAVEL": Color(hex: "EAB308"),
            "INCOME": Color(hex: "22C55E")
        ]
        
        // Create spending categories sorted by amount
        spendingCategories = filteredCategories.map { category, amount in
            let amountInDollars = Double(amount) / 100.0
            let percentage = totalSpending > 0 ? (Double(amount) / totalSpending) * 100.0 : 0
            return SpendingCategory(
                name: formatCategoryName(category),
                amount: amountInDollars,
                percentage: percentage,
                color: categoryColors[category] ?? Color(hex: "94A3B8")
            )
        }
        .sorted { $0.amount > $1.amount }
        
        print("[Dashboard] Processed \(spendingCategories.count) spending categories")
        // Log percentages for debugging
        spendingCategories.forEach { category in
            print("[Dashboard] Category: \(category.name), Amount: $\(category.amount), Percentage: \(category.percentage)%")
        }
    }
    
    // Helper function to format category names like the web app
    private func formatCategoryName(_ category: String) -> String {
        category
            .replacingOccurrences(of: "_", with: " ")
            .split(separator: " ")
            .map { $0.prefix(1).uppercased() + $0.dropFirst().lowercased() }
            .joined(separator: " ")
    }
} 