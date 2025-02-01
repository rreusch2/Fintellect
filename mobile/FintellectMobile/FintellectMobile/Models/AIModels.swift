import Foundation

// MARK: - AI Insight Model
struct AIInsight: Codable, Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let description: String
    let priority: String
    let impact: String?
    let confidence: Double?
    let category: String?
    let badge: String?
    
    // API-specific fields (optional)
    let modelVersion: String?
    let responseMetrics: ResponseMetrics?
    
    init(
        type: String,
        title: String,
        description: String,
        priority: String = "MEDIUM",
        impact: String? = nil,
        confidence: Double? = nil,
        category: String? = nil,
        badge: String? = nil
    ) {
        self.type = type
        self.title = title
        self.description = description
        self.priority = priority
        self.impact = impact
        self.confidence = confidence
        self.category = category
        self.badge = badge
    }
    
    enum CodingKeys: String, CodingKey {
        case type, title, description, priority, impact, confidence, category, badge
        case modelVersion = "model_version"
        case responseMetrics = "response_metrics"
    }
    
    #if DEBUG
    static var demoInsights: [AIInsight] {
        [
            AIInsight(
                type: "spending",
                title: "High Food & Drink Spending",
                description: "Your food and dining expenses are $366.18 (22.9% of total spending). Consider setting a monthly budget of $292.94 to save $73.24 per month.",
                priority: "HIGH",
                impact: "$73.24 monthly savings potential",
                confidence: 0.95,
                category: "FOOD_AND_DRINK",
                badge: "ACTION NEEDED"
            ),
            AIInsight(
                type: "budget",
                title: "Top Spending Categories",
                description: "Your highest spending areas are: UTILITIES $594.96 (37.3%) FOOD AND DRINK $366.18 (22.9%) SHOPPING $314.92 (19.7%)",
                priority: "MEDIUM",
                impact: "Budget optimization opportunity",
                confidence: 0.9,
                category: "BUDGET",
                badge: "REVIEW"
            ),
            AIInsight(
                type: "saving",
                title: "Monthly Budget Optimization",
                description: "Based on your spending patterns, here's a recommended monthly budget: Essential expenses $1410.65 (70.7%) Potential monthly savings: $239.40 by optimizing essential expenses.",
                priority: "HIGH",
                impact: "$239.40 monthly savings potential",
                confidence: 0.85,
                category: "OPTIMIZATION",
                badge: "OPPORTUNITY"
            )
        ]
    }
    #endif
}

// MARK: - Response Metrics
struct ResponseMetrics: Codable {
    let evalDuration: Double?
    let totalTokens: Int?
    
    enum CodingKeys: String, CodingKey {
        case evalDuration = "eval_duration"
        case totalTokens = "total_tokens"
    }
}

// MARK: - AI Response Model
struct AIResponse: Codable {
    let message: String
    let type: String?
    let metadata: AIMetadata?
    
    // Ollama specific fields
    let modelName: String?
    let totalDuration: Double?
    let loadDuration: Double?
    let promptEvalCount: Int?
    let evalCount: Int?
    let contextWindow: Int?
}

// MARK: - AI Metadata
struct AIMetadata: Codable {
    let confidence: Double?
    let category: String?
    let actionable: Bool?
    let suggestedActions: [String]?
    
    // Ollama specific metadata
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