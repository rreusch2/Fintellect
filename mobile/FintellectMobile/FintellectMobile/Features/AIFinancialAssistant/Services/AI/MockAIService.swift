import Foundation

// Protocol that both mock and real services will implement
protocol AIService {
    func analyzeFinances(
        type: PromptType,
        userData: UserFinancialData,
        additionalContext: [String: Any]?
    ) async throws -> AIResponse
}

// Mock service for testing
class MockAIService: AIService {
    func analyzeFinances(
        type: PromptType,
        userData: UserFinancialData,
        additionalContext: [String: Any]? = nil
    ) async throws -> AIResponse {
        // Simulate network delay
        try await Task.sleep(nanoseconds: 1_000_000_000)
        
        // Return mock responses based on type
        switch type {
        case .spendingAnalysis:
            return AIResponse(message: """
                Spending Analysis Results:
                
                Top Spending Categories:
                1. Groceries: \(userData.formatMoney(userData.categories[0].amount))
                   - 20% higher than previous month
                2. Entertainment: \(userData.formatMoney(userData.categories[1].amount))
                   - Within normal range
                
                Potential Savings Areas:
                • Grocery spending could be optimized by meal planning
                • Consider bulk purchases for frequently bought items
                
                Unusual Patterns:
                • No significant anomalies detected
                • All transactions appear legitimate
                """)
            
        case .budgetOptimization:
            return AIResponse(message: """
                Budget Optimization Plan:
                
                Current Status:
                • Monthly Income: \(userData.formatMoney(userData.monthlyIncome))
                • Total Expenses: \(userData.formatMoney(userData.fixedExpenses + userData.variableExpenses))
                
                Recommended Allocations:
                • Essential Expenses: 50% (\(userData.formatMoney(userData.monthlyIncome * 0.5)))
                • Savings: 30% (\(userData.formatMoney(userData.monthlyIncome * 0.3)))
                • Discretionary: 20% (\(userData.formatMoney(userData.monthlyIncome * 0.2)))
                
                Action Items:
                1. Reduce variable expenses by 15%
                2. Automate savings transfers
                3. Review subscriptions monthly
                """)
            
        case .investmentStrategy:
            return AIResponse(message: """
                Investment Strategy Analysis:
                
                Profile Overview:
                • Risk Tolerance: \(userData.riskTolerance)
                • Investment Horizon: \(userData.investmentHorizon) years
                
                Recommended Asset Allocation:
                • 60% Stocks (Growth focus)
                • 30% Bonds (Stability)
                • 10% Cash (Emergency fund)
                
                Action Steps:
                1. Increase monthly investments to \(userData.formatMoney(userData.monthlyInvestmentCapacity * 1.2))
                2. Diversify current portfolio
                3. Set up automatic rebalancing
                """)
        }
    }
} 