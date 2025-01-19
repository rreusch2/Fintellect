import Foundation

struct ChatMessage: Identifiable, Equatable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let timestamp: Date
}

struct QuickAction: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    let description: String
    let icon: String
    
    static let actions = [
        QuickAction(
            title: "Analyze Spending",
            message: "Can you analyze my spending patterns and suggest areas where I could save money?",
            description: "Review spending patterns and find savings",
            icon: "chart.pie.fill"
        ),
        QuickAction(
            title: "Budget Help",
            message: "Can you help me create a budget based on my spending patterns?",
            description: "Create a personalized budget plan",
            icon: "dollarsign.circle.fill"
        ),
        QuickAction(
            title: "Savings Tips",
            message: "What are some personalized tips to help me save more money?",
            description: "Get personalized savings advice",
            icon: "arrow.up.circle.fill"
        ),
        QuickAction(
            title: "Recurring Charges",
            message: "Can you identify my recurring charges and suggest which ones I might want to cancel or reduce?",
            description: "Optimize your subscriptions",
            icon: "repeat.circle.fill"
        )
    ]
} 