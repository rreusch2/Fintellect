import Foundation

class LearningAgent: BaseAgent {
    override init(aiService: AIServiceClient = AIServiceClient(), userId: Int) {
        super.init(aiService: aiService, userId: userId)
    }
    
    override func processRequest(_ input: String, context: [String: Any]? = nil) async throws -> AgentResponse {
        let response = try await aiService.chat(message: input)
        
        return AgentResponse(
            message: response.message,
            visualContent: nil,
            actions: nil,
            metadata: ResponseMetadata(
                category: "learning",
                timestamp: Date(),
                confidence: 0.9,
                source: "DeepSeek",
                tags: ["education"]
            )
        )
    }
} 