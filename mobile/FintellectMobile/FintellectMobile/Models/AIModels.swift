import SwiftUI

// MARK: - AI Models
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

struct ChatMessage: Identifiable, Equatable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let timestamp: Date
    
    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id &&
        lhs.content == rhs.content &&
        lhs.isUser == rhs.isUser &&
        lhs.timestamp == rhs.timestamp
    }
}

// MARK: - Premium Chat Models
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