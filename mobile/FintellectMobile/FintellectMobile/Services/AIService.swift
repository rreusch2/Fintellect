import Foundation

enum AIEndpoint {
    case chat
    case insights
    case savingsTips
    
    var path: String {
        switch self {
        case .chat:
            return "/api/ai/chat"
        case .insights:
            return "/api/ai/insights"
        case .savingsTips:
            return "/api/ai/savings-tips"
        }
    }
}

actor AIServiceClient {
    private let apiClient: APIClient
    private let decoder: JSONDecoder
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
        self.decoder = JSONDecoder()
    }
    
    func chat(message: String) async throws -> AIResponse {
        let body = ["message": message]
        let data = try await apiClient.post(AIEndpoint.chat.path, body: body)
        return try decoder.decode(AIResponse.self, from: data)
    }
    
    func getDashboardInsights() async throws -> [AIInsight] {
        let data = try await apiClient.get(AIEndpoint.insights.path)
        return try decoder.decode([AIInsight].self, from: data)
    }
    
    func getSavingsTips() async throws -> [AIResponse] {
        let data = try await apiClient.get(AIEndpoint.savingsTips.path)
        return try decoder.decode([AIResponse].self, from: data)
    }
}

// MARK: - Response Models
struct AIResponse: Codable {
    let message: String
    let type: String?
    let metadata: AIMetadata?
}

struct AIMetadata: Codable {
    let confidence: Double?
    let category: String?
    let actionable: Bool?
    let suggestedActions: [String]?
    
    enum CodingKeys: String, CodingKey {
        case confidence
        case category
        case actionable
        case suggestedActions = "suggested_actions"
    }
} 