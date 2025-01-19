import Foundation

enum AIError: Error {
    case invalidResponse
    case networkError(Error)
    case decodingError(Error)
}

final class AIService {
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    // MARK: - Dashboard Insights
    func fetchDashboardInsights() async throws -> [AIInsight] {
        let data = try await apiClient.get("/api/ai/insights")
        do {
            return try JSONDecoder().decode([AIInsight].self, from: data)
        } catch {
            throw AIError.decodingError(error)
        }
    }
    
    // MARK: - Chat
    func sendChatMessage(_ message: String) async throws -> String {
        let data = try await apiClient.post("/api/ai/chat", body: ["message": message])
        do {
            let response = try JSONDecoder().decode([String: String].self, from: data)
            guard let aiResponse = response["message"] else {
                throw AIError.invalidResponse
            }
            return aiResponse
        } catch {
            throw AIError.decodingError(error)
        }
    }
    
    // MARK: - Financial Tips
    func fetchFinancialTips() async throws -> [FinancialTip] {
        let data = try await apiClient.get("/api/ai/savings-tips")
        do {
            return try JSONDecoder().decode([FinancialTip].self, from: data)
        } catch {
            throw AIError.decodingError(error)
        }
    }
    
    // MARK: - Budget Analysis
    func fetchBudgetAnalysis() async throws -> BudgetAnalysis {
        let data = try await apiClient.get("/api/ai/budget-analysis")
        do {
            return try JSONDecoder().decode(BudgetAnalysis.self, from: data)
        } catch {
            throw AIError.decodingError(error)
        }
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