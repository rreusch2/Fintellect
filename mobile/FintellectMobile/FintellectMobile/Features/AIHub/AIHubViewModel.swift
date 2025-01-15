import SwiftUI

// Import the AIFinancialAssistantView
@_exported import struct FintellectMobile.AIFinancialAssistantView

// MARK: - Models
struct AIStat: Identifiable {
    let id = UUID()
    let value: String
    let label: String
    let icon: String
    var color: Color = Color(hex: "3B82F6")
}

struct AIService: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let iconColor: Color
    let features: [String]
    var destination: AnyView
}

// MARK: - ViewModel
@MainActor
class AIHubViewModel: ObservableObject {
    @Published var aiStats: [AIStat] = [
        AIStat(value: "24/7", label: "AI Availability", icon: "clock.fill"),
        AIStat(value: "Bank-Grade", label: "Security", icon: "lock.shield.fill", color: Color(hex: "22C55E")),
        AIStat(value: "Real-Time", label: "Analysis", icon: "sparkles", color: Color(hex: "8B5CF6")),
        AIStat(value: "Plaid", label: "Integration", icon: "link.circle.fill", color: Color(hex: "3B82F6"))
    ]
    
    @Published var availableServices: [AIService] = [
        AIService(
            title: "AI Financial Assistant",
            description: "Your personal AI-powered financial advisor available 24/7. Get real-time insights, spending analysis, and personalized recommendations through natural conversation.",
            icon: "brain.head.profile",
            iconColor: Color(hex: "3B82F6"),
            features: [
                "Real-time financial guidance",
                "Natural language processing",
                "Personalized recommendations",
                "Transaction analysis"
            ],
            destination: AnyView(AIFinancialAssistantView())
        ),
        AIService(
            title: "AI Investment Strategist",
            description: "Harness the power of AI to analyze your financial profile and create personalized investment strategies. Get dynamic portfolio recommendations, risk assessments, and market insights.",
            icon: "chart.line.uptrend.xyaxis",
            iconColor: Color(hex: "8B5CF6"),
            features: [
                "Smart portfolio optimization",
                "AI risk analysis",
                "Real-time market insights",
                "Intelligent goal planning"
            ],
            destination: AnyView(AIInvestmentView())
        )
    ]
    
    @Published var upcomingServices: [AIService] = [
        AIService(
            title: "AI Budget Analyst",
            description: "Advanced AI-powered analysis of your spending patterns with predictive insights and intelligent optimization suggestions.",
            icon: "dollarsign.circle",
            iconColor: Color(hex: "10B981"),
            features: [
                "AI-driven spending analysis",
                "Smart budget optimization",
                "Automated savings detection"
            ],
            destination: AnyView(EmptyView())
        ),
        AIService(
            title: "AI Tax Strategist",
            description: "Intelligent tax optimization and planning powered by advanced AI analysis of your financial data.",
            icon: "doc.text.magnifyingglass",
            iconColor: Color(hex: "F59E0B"),
            features: [
                "AI tax optimization",
                "Smart deduction finder",
                "Proactive tax planning"
            ],
            destination: AnyView(EmptyView())
        )
    ]
} 