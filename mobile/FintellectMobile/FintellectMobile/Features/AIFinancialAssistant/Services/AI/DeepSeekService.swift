class DeepSeekService: AIService {
    private let apiKey: String
    private let baseURL = "https://api.deepseek.com"
    
    func analyzeFinances(
        type: PromptType,
        userData: UserFinancialData,
        additionalContext: [String: Any]? = nil
    ) async throws -> AIResponse {
        let systemPrompt: String
        switch type {
        case .spendingAnalysis:
            systemPrompt = FinancialPrompts.systemPrompts["pattern_detector"]!
        case .budgetOptimization:
            systemPrompt = FinancialPrompts.systemPrompts["budget_analyzer"]!
        case .investmentStrategy:
            systemPrompt = FinancialPrompts.systemPrompts["financial_advisor"]!
        }
        
        let userPrompt = FinancialPrompts.generatePrompt(
            type: type,
            userData: userData,
            additionalContext: additionalContext
        )
        
        let body: [String: Any] = [
            "model": "deepseek-chat",
            "messages": [
                ["role": "system", "content": systemPrompt],
                ["role": "user", "content": userPrompt]
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        ]
        
        // Make API request and return response
        return try await makeRequest(body: body)
    }
    
    private func makeRequest(body: [String: Any]) async throws -> AIResponse {
        let url = URL(string: "\(baseURL)/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(DeepSeekResponse.self, from: data)
        
        return AIResponse(message: response.choices[0].message.content)
    }
} 