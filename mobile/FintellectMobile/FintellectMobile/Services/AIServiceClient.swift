import Foundation
import SwiftUI

class AIServiceClient {
    static let shared = AIServiceClient()
    private let baseURL = APIClient.shared.baseURL
    
    private init() {}
    
    func chat(message: String) async throws -> (message: String, metadata: [String: Any]?) {
        print("[AI] Sending chat message: \(message)")
        
        let response = try await APIClient.shared.post("/api/ai/chat", body: [
            "message": message
        ])
        
        let decoder = JSONDecoder()
        
        struct ChatResponse: Codable {
            let message: String
            let metadata: [String: String]?
        }
        
        do {
            let chatResponse = try decoder.decode(ChatResponse.self, from: response)
            print("[AI] Received response: \(chatResponse.message)")
            return (chatResponse.message, chatResponse.metadata as [String : Any]?)
        } catch {
            print("[AI] Error decoding response: \(error)")
            throw APIError.decodingError(error)
        }
    }
    
    func getDashboardInsights() async throws -> [AIInsight] {
        print("[AI] Fetching dashboard insights")
        
        let response = try await APIClient.shared.get("/api/ai/dashboard-insights")
        
        let decoder = JSONDecoder()
        do {
            let insights = try decoder.decode([AIInsight].self, from: response)
            print("[AI] Received \(insights.count) insights")
            return insights
        } catch {
            print("[AI] Error decoding insights: \(error)")
            throw APIError.decodingError(error)
        }
    }
}

// MARK: - Models
struct AIInsight: Codable, Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let description: String
    
    enum CodingKeys: String, CodingKey {
        case type, title, description
    }
}

struct AIWorkflow: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let color: Color
    let message: String
}

struct PremiumChatMessage: Identifiable, Equatable {
    let id = UUID()
    let content: String
    let type: MessageType
    let timestamp: Date
    let attachments: [MessageAttachment]?
    
    enum MessageType {
        case user
        case assistant
        case system
    }
    
    static func == (lhs: PremiumChatMessage, rhs: PremiumChatMessage) -> Bool {
        lhs.id == rhs.id &&
        lhs.content == rhs.content &&
        lhs.type == rhs.type &&
        lhs.timestamp == rhs.timestamp
    }
}

struct MessageAttachment: Identifiable {
    let id = UUID()
    let type: AttachmentType
    let content: Any
    
    enum AttachmentType {
        case chart
        case link
        case suggestion
    }
} 