import Foundation

class InsightAgent: BaseAgent {
    private let geminiProVision: GeminiService
    private let deepSeek: DeepSeekService
    private let gpt4: OpenAIService
    
    override init(aiService: AIServiceClient = AIServiceClient(), userId: Int) {
        self.geminiProVision = GeminiService(apiKey: ProcessInfo.processInfo.environment["GEMINI_API_KEY"] ?? "")
        self.deepSeek = DeepSeekService(apiKey: ProcessInfo.processInfo.environment["DEEPSEEK_API_KEY"] ?? "")
        self.gpt4 = OpenAIService(apiKey: ProcessInfo.processInfo.environment["OPENAI_API_KEY"] ?? "")
        super.init(aiService: aiService, userId: userId)
    }
    
    override func processRequest(_ input: String, context: [String: Any]? = nil) async throws -> AgentResponse {
        let response = try await aiService.chat(message: input)
        
        return AgentResponse(
            message: response.message,
            visualContent: nil,
            actions: nil,
            metadata: ResponseMetadata(
                category: "insight",
                timestamp: Date(),
                confidence: 0.9,
                source: "DeepSeek",
                tags: ["financial-insight"]
            )
        )
    }
    
    func generateInsights() async throws -> [ProactiveInsight] {
        // Use DeepSeek for:
        // - Pattern detection in transaction data
        // - Trend analysis
        // - Initial financial insights
        
        // Use GPT-4 for:
        // - Complex financial strategy
        // - Risk assessment
        // - Investment recommendations
        
        // Use Gemini Pro Vision for:
        // - Chart generation and analysis
        // - Visual data interpretation
        return []
    }
} 