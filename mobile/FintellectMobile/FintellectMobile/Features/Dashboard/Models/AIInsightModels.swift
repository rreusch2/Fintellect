import Foundation

struct AIInsight: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let type: InsightType
    let timestamp: Date
    
    enum InsightType {
        case spending
        case saving
        case budget
        case subscription
    }
}

extension AIInsight.InsightType {
    var iconName: String {
        switch self {
        case .spending: return "chart.pie.fill"
        case .saving: return "arrow.up.circle.fill"
        case .budget: return "dollarsign.circle.fill"
        case .subscription: return "repeat.circle.fill"
        }
    }
    
    var color: String {
        switch self {
        case .spending: return "3B82F6"
        case .saving: return "10B981"
        case .budget: return "F59E0B"
        case .subscription: return "8B5CF6"
        }
    }
} 