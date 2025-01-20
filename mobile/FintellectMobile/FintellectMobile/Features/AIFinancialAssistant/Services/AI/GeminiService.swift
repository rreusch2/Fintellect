import Foundation

class GeminiService: AIService {
    private let apiKey: String
    
    init(apiKey: String) {
        self.apiKey = apiKey
    }
    
    func analyzeFinances(
        type: PromptType,
        userData: UserFinancialData,
        additionalContext: [String: Any]? = nil
    ) async throws -> AIResponse {
        // Implementation will be added when we set up the actual Gemini API
        // For now, return mock data
        return AIResponse(message: "Gemini Service Mock Response")
    }
} 