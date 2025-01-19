import SwiftUI

@MainActor
class AIFinancialAssistantViewModel: ObservableObject {
    private let aiService: AIService
    @Published var chatMessages: [PremiumChatMessage] = []
    @Published var workflows: [AIWorkflow] = []
    @Published var proactiveInsights: [ProactiveInsight] = []
    @Published var learningModules: [LearningModule] = []
    @Published var analyzedDocuments: [AnalyzedDocument] = []
    @Published var isTyping = false
    @Published var currentMessage = ""
    
    init(aiService: AIService = AIService()) {
        self.aiService = aiService
        setupInitialData()
    }
    
    private func setupInitialData() {
        setupWorkflows()
        setupLearningModules()
        
        chatMessages = [
            PremiumChatMessage(
                content: "Welcome to your premium AI Financial Assistant! How can I help you today?",
                type: .assistant,
                timestamp: Date()
            )
        ]
        
        Task {
            await fetchProactiveInsights()
        }
    }
    
    func sendMessage(_ message: String) async {
        let userMessage = PremiumChatMessage(content: message, type: .user, timestamp: Date())
        chatMessages.append(userMessage)
        currentMessage = ""
        isTyping = true
        
        do {
            let response = try await aiService.chat(message: message)
            let aiMessage = PremiumChatMessage(
                content: response.message,
                type: .assistant,
                timestamp: Date()
            )
            chatMessages.append(aiMessage)
        } catch {
            let errorMessage = PremiumChatMessage(
                content: "I apologize, but I'm having trouble processing your request at the moment. Please try again later.",
                type: .system,
                timestamp: Date()
            )
            chatMessages.append(errorMessage)
        }
        
        isTyping = false
    }
    
    func startWorkflow(_ workflow: AIWorkflow) async {
        let message = PremiumChatMessage(
            content: "Starting the \(workflow.title) workflow. Let me analyze your data...",
            type: .system,
            timestamp: Date()
        )
        chatMessages.append(message)
        
        // Simulate workflow analysis
        isTyping = true
        do {
            let response = try await aiService.chat(message: "Start workflow: \(workflow.title)")
            let aiMessage = PremiumChatMessage(
                content: response.message,
                type: .assistant,
                timestamp: Date()
            )
            chatMessages.append(aiMessage)
        } catch {
            let errorMessage = PremiumChatMessage(
                content: "I apologize, but I couldn't start the workflow at this time. Please try again later.",
                type: .system,
                timestamp: Date()
            )
            chatMessages.append(errorMessage)
        }
        isTyping = false
    }
    
    private func fetchProactiveInsights() async {
        do {
            let tips = try await aiService.getSavingsTips()
            proactiveInsights = tips.map { response in
                ProactiveInsight(
                    title: response.metadata?.category ?? "Insight",
                    description: response.message,
                    type: .saving,
                    severity: .info,
                    timestamp: Date()
                )
            }
        } catch {
            print("Error fetching proactive insights: \(error)")
            #if DEBUG
            setupDemoInsights()
            #endif
        }
    }
    
    private func setupWorkflows() {
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
    }
    
    private func setupLearningModules() {
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
    }
    
    #if DEBUG
    private func setupDemoInsights() {
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
    }
    #endif
} 