import SwiftUI

@MainActor
class AIFinancialAssistantViewModel: ObservableObject {
    @Published var chatMessages: [PremiumChatMessage] = []
    @Published var workflows: [AIWorkflow] = []
    @Published var proactiveInsights: [ProactiveInsight] = []
    @Published var learningModules: [LearningModule] = []
    @Published var analyzedDocuments: [AnalyzedDocument] = []
    @Published var isTyping = false
    @Published var currentMessage = ""
    
    init() {
        setupMockData()
    }
    
    private func setupMockData() {
        // Mock Workflows
        workflows = [
            AIWorkflow(
                title: "Financial Health Scan",
                description: "Get a comprehensive analysis of your financial health with personalized recommendations.",
                icon: "heart.text.square.fill",
                color: Color(hex: "3B82F6"),
                category: .financial
            ),
            AIWorkflow(
                title: "Smart Savings Detective",
                description: "Discover hidden savings opportunities in your recurring expenses.",
                icon: "magnifyingglass.circle.fill",
                color: Color(hex: "8B5CF6"),
                category: .savings
            ),
            AIWorkflow(
                title: "Wealth Growth Planner",
                description: "Create a personalized investment strategy based on your goals.",
                icon: "chart.line.uptrend.xyaxis.circle.fill",
                color: Color(hex: "10B981"),
                category: .investment
            ),
            AIWorkflow(
                title: "Bill Negotiation Assistant",
                description: "Find opportunities to lower your bills with AI-powered negotiation tips.",
                icon: "dollarsign.circle.fill",
                color: Color(hex: "F59E0B"),
                category: .bills
            )
        ]
        
        // Mock Insights
        proactiveInsights = [
            ProactiveInsight(
                title: "Unusual Spending Detected",
                description: "Your entertainment spending is 45% higher than your monthly average.",
                type: .spending,
                severity: .warning,
                timestamp: Date()
            ),
            ProactiveInsight(
                title: "Savings Opportunity",
                description: "You could save $25/month by switching your phone plan.",
                type: .saving,
                severity: .info,
                timestamp: Date()
            ),
            ProactiveInsight(
                title: "Investment Alert",
                description: "Market conditions suggest a good time to rebalance your portfolio.",
                type: .investment,
                severity: .info,
                timestamp: Date()
            )
        ]
        
        // Mock Learning Modules
        learningModules = [
            LearningModule(
                title: "Investment Basics",
                description: "Learn the fundamentals of investing and portfolio management.",
                topics: ["Stocks", "Bonds", "ETFs", "Risk Management"],
                duration: 1800,
                difficulty: .beginner
            ),
            LearningModule(
                title: "Advanced Tax Strategies",
                description: "Optimize your tax situation with advanced planning techniques.",
                topics: ["Tax Deductions", "Investment Tax", "Estate Planning"],
                duration: 2400,
                difficulty: .advanced
            )
        ]
        
        // Mock Chat Messages
        chatMessages = [
            PremiumChatMessage(
                content: "Welcome to your premium AI Financial Assistant! How can I help you today?",
                type: .assistant,
                timestamp: Date()
            )
        ]
    }
    
    func sendMessage(_ message: String) {
        let userMessage = PremiumChatMessage(content: message, type: .user, timestamp: Date())
        chatMessages.append(userMessage)
        currentMessage = ""
        
        // Simulate AI typing
        isTyping = true
        
        // Simulate AI response after delay
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            let response = PremiumChatMessage(
                content: "I understand you're interested in \(message.lowercased()). Let me analyze your financial data and provide personalized insights.",
                type: .assistant,
                timestamp: Date()
            )
            chatMessages.append(response)
            isTyping = false
        }
    }
    
    func startWorkflow(_ workflow: AIWorkflow) {
        // Simulate workflow start
        let message = PremiumChatMessage(
            content: "Starting the \(workflow.title) workflow. Let me analyze your data...",
            type: .system,
            timestamp: Date()
        )
        chatMessages.append(message)
    }
} 