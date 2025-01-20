import Foundation

class AIServiceFactory {
    static let shared = AIServiceFactory()
    
    private var geminiService: GeminiService?
    private var openAIService: OpenAIService?
    private var deepSeekService: DeepSeekService?
    
    func configureServices(
        geminiKey: String,
        openAIKey: String,
        deepSeekKey: String
    ) {
        geminiService = GeminiService(apiKey: geminiKey)
        openAIService = OpenAIService(apiKey: openAIKey)
        deepSeekService = DeepSeekService(apiKey: deepSeekKey)
    }
    
    func getService(for type: AIServiceType) -> any AIService {
        switch type {
        case .gemini:
            return geminiService ?? GeminiService(apiKey: "")
        case .openAI:
            return openAIService ?? OpenAIService(apiKey: "")
        case .deepSeek:
            return deepSeekService ?? DeepSeekService(apiKey: "")
        }
    }
}

enum AIServiceType {
    case gemini
    case openAI
    case deepSeek
}

// DeepSeek Service Implementation
class DeepSeekService: AIService {
    private let apiKey: String
    private let baseURL = "https://api.deepseek.com"
    
    init(apiKey: String) {
        self.apiKey = apiKey
    }
    
    func chat(message: String) async throws -> AIResponse {
        let url = URL(string: "\(baseURL)/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = [
            "model": "deepseek-chat",
            "messages": [
                ["role": "system", "content": "You are an AI financial advisor specializing in personal finance analysis, budgeting, and investment strategies."],
                ["role": "user", "content": message]
            ],
            "stream": false
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(DeepSeekResponse.self, from: data)
        
        return AIResponse(message: response.choices[0].message.content)
    }
}

// DeepSeek Response Models
struct DeepSeekResponse: Codable {
    let choices: [Choice]
    
    struct Choice: Codable {
        let message: Message
    }
    
    struct Message: Codable {
        let content: String
    }
} 