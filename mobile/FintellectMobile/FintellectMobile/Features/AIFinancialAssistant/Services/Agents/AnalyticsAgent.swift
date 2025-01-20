import Foundation

class AnalyticsAgent: BaseAgent {
    init(aiService: AIServiceClient = AIServiceClient(), userId: Int) {
        super.init(aiService: aiService, userId: userId)
    }
    
    func analyze(_ input: String) async throws -> AgentResponse {
        let response = try await aiService.chat(message: input)
        
        return AgentResponse(
            message: response.message,
            visualContent: nil,
            actions: nil,
            metadata: ResponseMetadata(
                category: "analytics",
                timestamp: Date(),
                confidence: 0.9,
                source: "DeepSeek",
                tags: ["analysis"]
            )
        )
    }
} 