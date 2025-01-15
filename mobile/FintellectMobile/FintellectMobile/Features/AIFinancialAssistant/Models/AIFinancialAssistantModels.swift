import SwiftUI

// MARK: - Chat Models
struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let type: MessageType
    let timestamp: Date
    var attachments: [MessageAttachment]?
    
    enum MessageType {
        case user
        case assistant
        case system
    }
}

struct MessageAttachment: Identifiable {
    let id = UUID()
    let type: AttachmentType
    let data: Any
    
    enum AttachmentType {
        case chart
        case table
        case image
    }
}

// MARK: - Workflow Models
struct AIWorkflow: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let color: Color
    let category: WorkflowCategory
    
    enum WorkflowCategory {
        case financial
        case savings
        case investment
        case bills
    }
}

// MARK: - Insight Models
struct ProactiveInsight: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let type: InsightType
    let severity: InsightSeverity
    let timestamp: Date
    
    enum InsightType {
        case spending
        case saving
        case investment
        case bill
    }
    
    enum InsightSeverity {
        case info
        case warning
        case alert
    }
}

// MARK: - Learning Models
struct LearningModule: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let topics: [String]
    let duration: TimeInterval
    let difficulty: Difficulty
    
    enum Difficulty {
        case beginner
        case intermediate
        case advanced
    }
}

// MARK: - Document Analysis Models
struct AnalyzedDocument: Identifiable {
    let id = UUID()
    let name: String
    let type: DocumentType
    let insights: [String]
    let dateAnalyzed: Date
    
    enum DocumentType {
        case bill
        case statement
        case contract
    }
} 