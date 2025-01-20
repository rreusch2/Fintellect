import Foundation

// Main Agent System Coordinator
class AIAgentSystem {
    private let conversationAgent: ConversationAgent
    private let insightAgent: InsightAgent
    private let learningAgent: LearningAgent
    private let analyticsAgent: AnalyticsAgent
    
    init(userId: Int = 0) { // Default userId for testing
        let aiService = AIServiceClient()
        self.conversationAgent = ConversationAgent(aiService: aiService, userId: userId)
        self.insightAgent = InsightAgent(aiService: aiService, userId: userId)
        self.learningAgent = LearningAgent(aiService: aiService, userId: userId)
        self.analyticsAgent = AnalyticsAgent(aiService: aiService, userId: userId)
    }
    
    func processUserInput(_ input: String) async throws -> AgentResponse {
        // 1. Analyze intent
        let intent = try await conversationAgent.analyzeIntent(input)
        
        // 2. Route to appropriate agent
        switch intent.category {
        case .conversation:
            return try await conversationAgent.respond(to: input)
        case .insight:
            return try await insightAgent.generateInsight(for: input)
        case .learning:
            return try await learningAgent.provideLearningContent(for: input)
        case .analytics:
            return try await analyticsAgent.analyze(input)
        }
    }
}

// Response structure with rich content support
struct AgentResponse {
    let message: String
    let visualContent: [VisualContent]?
    let actions: [ActionItem]?
    let metadata: ResponseMetadata?
}

enum VisualContent {
    case chart(ChartData)
    case table(TableData)
    case card(CardData)
}

struct ActionItem {
    let title: String
    let action: () -> Void
    let style: ActionStyle
} 