import Foundation

class ConversationAgent: BaseAgent {
    private var conversationHistory: [String] = []
    private let maxHistoryLength = 10
    
    override init(aiService: AIServiceClient = AIServiceClient(), userId: Int) {
        super.init(aiService: aiService, userId: userId)
    }
    
    override func processRequest(_ input: String, context: [String: Any]? = nil) async throws -> AgentResponse {
        // Add to conversation history
        conversationHistory.append(input)
        if conversationHistory.count > maxHistoryLength {
            conversationHistory.removeFirst()
        }
        
        // Generate response using Gemini
        let response = try await aiService.chat(message: input)
        
        // Process response and generate rich content
        return AgentResponse(
            message: response.message,
            visualContent: nil,
            actions: generateActions(from: response.message),
            metadata: ResponseMetadata(
                category: "conversation",
                timestamp: Date(),
                confidence: 0.9,
                source: "Gemini",
                tags: ["chat", "financial-advice"]
            )
        )
    }
    
    func analyzeIntent(_ input: String) async throws -> Intent {
        let response = try await aiService.chat(message: input)
        // Parse response to determine intent
        let category: IntentCategory = .conversation // Default
        let confidence: Float = 0.8
        return Intent(category: category, confidence: confidence, parameters: nil)
    }
    
    private func generateActions(from response: String) -> [ActionItem]? {
        // Placeholder implementation
        return nil
    }
} 