import Foundation

protocol Agent {
    func processRequest(_ request: String, context: [String: Any]?) async throws -> AgentResponse
}

class BaseAgent: Agent {
    let aiService: AIServiceClient
    let userId: Int
    
    init(aiService: AIServiceClient = AIServiceClient(), userId: Int) {
        self.aiService = aiService
        self.userId = userId
    }
    
    func processRequest(_ request: String, context: [String: Any]? = nil) async throws -> AgentResponse {
        fatalError("Subclasses must implement processRequest")
    }
    
    // Shared utility methods
    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "en_US")
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
    
    func formatPercentage(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .percent
        formatter.minimumFractionDigits = 1
        formatter.maximumFractionDigits = 1
        return formatter.string(from: NSNumber(value: value/100)) ?? "0%"
    }
} 