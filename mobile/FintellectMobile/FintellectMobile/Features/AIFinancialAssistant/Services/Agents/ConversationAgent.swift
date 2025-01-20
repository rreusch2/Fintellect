import Foundation

class ConversationAgent: BaseAgent {
    private var conversationHistory: [String] = []
    private let maxHistoryLength = 10
    
    init(aiService: AIServiceClient = AIServiceClient(), userId: Int) {
        super.init(aiService: aiService, userId: userId)
    }
    
    func analyzeIntent(_ input: String) async throws -> Intent {
        // Use Gemini to analyze intent
        let prompt = """
        Analyze the following user input and determine the intent category:
        Input: \(input)
        
        Categories:
        - conversation: General chat and questions
        - insight: Financial analysis and recommendations
        - learning: Educational content requests
        - analytics: Data analysis and visualization requests
        
        Return only the category name and confidence score.
        """
        
        let response = try await aiService.chat(message: prompt)
        // Parse response to determine intent
        // This is a simplified example
        let category: IntentCategory = .conversation // Default
        let confidence: Float = 0.8
        
        return Intent(category: category, confidence: confidence, parameters: nil)
    }
    
    override func processRequest(_ request: String, context: [String: Any]? = nil) async throws -> AgentResponse {
        // Add to conversation history
        conversationHistory.append(request)
        if conversationHistory.count > maxHistoryLength {
            conversationHistory.removeFirst()
        }
        
        // Generate response using Gemini
        let response = try await aiService.chat(message: request)
        
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
    
    private func generateActions(from response: String) -> [ActionItem]? {
        // Analyze response to generate relevant actions
        // This is a placeholder implementation
        return nil
    }
} 