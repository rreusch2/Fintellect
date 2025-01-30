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
        decoder.keyDecodingStrategy = .convertFromSnakeCase
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
    
    // Add support for Ollama specific fields
    let modelName: String?
    let totalDuration: Double?
    let loadDuration: Double?
    let promptEvalCount: Int?
    let evalCount: Int?
    let contextWindow: Int?
}

struct AIMetadata: Codable {
    let confidence: Double?
    let category: String?
    let actionable: Bool?
    let suggestedActions: [String]?
    
    // Add Ollama specific metadata
    let promptTokens: Int?
    let completionTokens: Int?
    let totalTokens: Int?
    
    enum CodingKeys: String, CodingKey {
        case confidence
        case category
        case actionable
        case suggestedActions = "suggested_actions"
        case promptTokens = "prompt_tokens"
        case completionTokens = "completion_tokens"
        case totalTokens = "total_tokens"
    }
}

struct AIInsight: Codable {
    let title: String
    let description: String
    let type: String
    let priority: String
    let impact: String?
    let confidence: Double?
    let category: String?
    
    // Add Ollama specific fields
    let modelVersion: String?
    let responseMetrics: ResponseMetrics?
    
    enum CodingKeys: String, CodingKey {
        case title, description, type, priority, impact, confidence, category
        case modelVersion = "model_version"
        case responseMetrics = "response_metrics"
    }
}

struct ResponseMetrics: Codable {
    let evalDuration: Double?
    let totalTokens: Int?
    
    enum CodingKeys: String, CodingKey {
        case evalDuration = "eval_duration"
        case totalTokens = "total_tokens"
    }
} 