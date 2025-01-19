import Foundation

enum AIError: Error {
    case invalidResponse
    case networkError(Error)
    case decodingError(Error)
}

class AIService {
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    // MARK: - Dashboard Insights
    func fetchDashboardInsights() async throws -> [AIInsight] {
        let response: [String: Any] = try await apiClient.get("/api/ai/insights")
        guard let insights = try? JSONDecoder().decode([AIInsight].self, from: JSONSerialization.data(withJSONObject: response)) else {
            throw AIError.decodingError(NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode insights"]))
        }
        return insights
    }
    
    // MARK: - Chat
    func sendChatMessage(_ message: String) async throws -> String {
        let response: [String: Any] = try await apiClient.post("/api/ai/chat", body: ["message": message])
        guard let aiResponse = response["message"] as? String else {
            throw AIError.invalidResponse
        }
        return aiResponse
    }
    
    // MARK: - Financial Tips
    func fetchFinancialTips() async throws -> [FinancialTip] {
        let response: [String: Any] = try await apiClient.get("/api/ai/savings-tips")
        guard let tips = try? JSONDecoder().decode([FinancialTip].self, from: JSONSerialization.data(withJSONObject: response)) else {
            throw AIError.decodingError(NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode tips"]))
        }
        return tips
    }
    
    // MARK: - Budget Analysis
    func fetchBudgetAnalysis() async throws -> BudgetAnalysis {
        let response: [String: Any] = try await apiClient.get("/api/ai/budget-analysis")
        guard let analysis = try? JSONDecoder().decode(BudgetAnalysis.self, from: JSONSerialization.data(withJSONObject: response)) else {
            throw AIError.decodingError(NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode budget analysis"]))
        }
        return analysis
    }
}

// MARK: - Models
struct FinancialTip: Codable {
    let title: String
    let description: String
    let potentialSavings: String
    let difficulty: String
    let timeframe: String
    let category: String?
}

struct BudgetAnalysis: Codable {
    struct Overview: Codable {
        let totalSpend: Int
        let topCategories: [TopCategory]
        let monthOverMonthChange: Double
        
        struct TopCategory: Codable {
            let category: String
            let amount: Int
            let trend: String
        }
    }
    
    struct Insight: Codable {
        let category: String
        let finding: String
        let suggestedAction: String
        let potentialSavings: Int
    }
    
    struct Recommendation: Codable {
        let title: String
        let description: String
        let impact: String
        let effort: String
        let timeframe: String
    }
    
    let overview: Overview
    let insights: [Insight]
    let recommendations: [Recommendation]
} 