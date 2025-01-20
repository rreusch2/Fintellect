import Foundation

protocol AIServiceProtocol {
    func analyzeFinances(
        type: PromptType,
        userData: UserFinancialData,
        additionalContext: [String: Any]?
    ) async throws -> AIResponse
    
    func chat(message: String) async throws -> AIResponse
} 