import Foundation

struct FinancialPrompts {
    // System prompts for different contexts
    static let systemPrompts = [
        "financial_advisor": """
        You are an expert financial advisor with deep knowledge in personal finance, budgeting, investing, and financial planning.
        Focus on providing actionable, specific advice based on the user's financial data.
        Always consider:
        1. User's current financial situation
        2. Historical spending patterns
        3. Financial goals
        4. Risk tolerance
        5. Market conditions
        Format responses with clear sections and bullet points when appropriate.
        """,
        
        "pattern_detector": """
        You are a financial pattern detection specialist.
        Analyze transaction data to identify:
        1. Spending patterns and trends
        2. Potential areas of overspending
        3. Opportunities for savings
        4. Unusual transactions or behaviors
        5. Recurring charges and subscriptions
        Provide insights in a structured format with specific numbers and percentages.
        """,
        
        "budget_analyzer": """
        You are a budget optimization expert.
        Focus on:
        1. Category-wise spending analysis
        2. Budget vs. actual comparisons
        3. Specific recommendations for optimization
        4. Practical saving strategies
        5. Monthly and yearly projections
        Use concrete numbers and percentages in your analysis.
        """
    ]
    
    // Function to generate context-aware prompts
    static func generatePrompt(
        type: PromptType,
        userData: UserFinancialData,
        additionalContext: [String: Any]? = nil
    ) -> String {
        switch type {
        case .spendingAnalysis:
            return """
            Analyze the following transaction data for the past 30 days:
            Total Spending: \(userData.formatMoney(userData.totalSpending))
            Categories:
            \(userData.categories.map { "- \($0.name): \(userData.formatMoney($0.amount))" }.joined(separator: "\n"))
            
            Provide:
            1. Top spending categories
            2. Notable changes from previous month
            3. Specific areas for potential savings
            4. Unusual spending patterns
            Format the response with clear sections and bullet points.
            """
            
        case .budgetOptimization:
            return """
            Based on the following financial data:
            Monthly Income: \(userData.formatMoney(userData.monthlyIncome))
            Fixed Expenses: \(userData.formatMoney(userData.fixedExpenses))
            Variable Expenses: \(userData.formatMoney(userData.variableExpenses))
            Savings Goal: \(userData.formatMoney(userData.savingsGoal))
            
            Provide:
            1. Optimized budget allocation
            2. Specific saving strategies
            3. Expense reduction opportunities
            4. Timeline to reach savings goal
            Include specific dollar amounts and percentages.
            """
            
        case .investmentStrategy:
            return """
            Consider the following investment profile:
            Risk Tolerance: \(userData.riskTolerance)
            Investment Horizon: \(userData.investmentHorizon) years
            Current Portfolio: \(userData.formatMoney(userData.currentPortfolio))
            Monthly Investment Capacity: \(userData.formatMoney(userData.monthlyInvestmentCapacity))
            
            Provide:
            1. Recommended asset allocation
            2. Investment strategy adjustments
            3. Specific investment vehicles to consider
            4. Risk management suggestions
            Include market context and specific recommendations.
            """
        }
    }
}

enum PromptType {
    case spendingAnalysis
    case budgetOptimization
    case investmentStrategy
}

// Helper struct to format financial data
struct UserFinancialData {
    let totalSpending: Double
    let categories: [(name: String, amount: Double)]
    let monthlyIncome: Double
    let fixedExpenses: Double
    let variableExpenses: Double
    let savingsGoal: Double
    let riskTolerance: String
    let investmentHorizon: Int
    let currentPortfolio: Double
    let monthlyInvestmentCapacity: Double
    
    func formatMoney(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "en_US")
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
} 