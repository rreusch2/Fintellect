import SwiftUI

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
    
    @Published var availableServices: [AIService] = []
    @Published var upcomingServices: [AIService] = []
    
    init() {
        setupServices()
    }
    
    private func setupServices() {
        // Available Services
        availableServices = [
            AIService(
                title: "AI Financial Assistant",
                description: "Your personal AI-powered financial advisor, available 24/7 to help you make smarter financial decisions.",
                icon: "brain.head.profile",
                iconColor: Color(hex: "3B82F6"),
                features: [
                    "Real-time financial insights",
                    "Personalized recommendations",
                    "Smart budgeting assistance"
                ]
            ),
            AIService(
                title: "AI Investment Strategist",
                description: "Advanced AI algorithms analyze market trends and your portfolio to provide tailored investment strategies.",
                icon: "chart.line.uptrend.xyaxis",
                iconColor: Color(hex: "10B981"),
                features: [
                    "Portfolio analysis",
                    "Risk assessment",
                    "Investment recommendations"
                ]
            )
        ]
        
        // Upcoming Services
        upcomingServices = [
            AIService(
                title: "AI Budget Analyst",
                description: "Sophisticated AI-driven budget analysis and optimization to help you achieve your financial goals.",
                icon: "dollarsign.circle",
                iconColor: Color(hex: "8B5CF6"),
                features: [
                    "Smart budget optimization",
                    "Spending pattern analysis",
                    "Goal-based recommendations"
                ]
            ),
            AIService(
                title: "AI Tax Strategist",
                description: "AI-powered tax planning and optimization to maximize your returns and minimize tax liability.",
                icon: "doc.text.magnifyingglass",
                iconColor: Color(hex: "F59E0B"),
                features: [
                    "Tax optimization strategies",
                    "Deduction recommendations",
                    "Year-round tax planning"
                ]
            )
        ]
    }
} 