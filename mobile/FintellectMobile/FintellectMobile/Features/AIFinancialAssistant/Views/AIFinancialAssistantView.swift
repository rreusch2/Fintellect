import SwiftUI

struct AIFinancialAssistantView: View {
    @StateObject private var viewModel = AIFinancialAssistantViewModel()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                PremiumBadge()
                MainAssistantCard(viewModel: viewModel)
                ProactiveInsightsSection(insights: viewModel.proactiveInsights)
                LearningHubSection(modules: viewModel.learningModules)
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationTitle("AI Assistant")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Premium Badge
struct PremiumBadge: View {
    var body: some View {
        HStack {
            Image(systemName: "crown.fill")
                .foregroundColor(Color(hex: "F59E0B"))
            Text("Premium AI Assistant")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color(hex: "F59E0B"))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(hex: "F59E0B").opacity(0.2))
        .clipShape(Capsule())
    }
}

// MARK: - Main Assistant Card
struct MainAssistantCard: View {
    @ObservedObject var viewModel: AIFinancialAssistantViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            AssistantHeader()
            SmartWorkflowsSection(workflows: viewModel.workflows, onWorkflowSelected: viewModel.startWorkflow)
            
            Divider()
                .background(Color(hex: "334155"))
                .padding(.vertical, 8)
            
            ChatSection(viewModel: viewModel)
        }
        .padding(.vertical)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(hex: "1E293B"))
                .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
        )
        .padding(.horizontal)
    }
}

// MARK: - Assistant Header
struct AssistantHeader: View {
    var body: some View {
        VStack(spacing: 8) {
            Text("AI Financial Assistant")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("Your personal AI-powered financial advisor")
                .font(.subheadline)
                .foregroundColor(Color(hex: "94A3B8"))
        }
        .padding(.top, 8)
    }
}

// MARK: - Smart Workflows Section
struct SmartWorkflowsSection: View {
    let workflows: [AIWorkflow]
    let onWorkflowSelected: (AIWorkflow) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "wand.and.stars")
                    .foregroundColor(Color(hex: "3B82F6"))
                Text("Smart AI Workflows")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            
            Text("Powerful automated workflows to analyze and optimize your finances")
                .font(.subheadline)
                .foregroundColor(Color(hex: "94A3B8"))
            
            VStack(spacing: 12) {
                ForEach(workflows) { workflow in
                    SmartWorkflowButton(workflow: workflow) {
                        onWorkflowSelected(workflow)
                    }
                }
            }
            
            Text("Select a workflow above or type your question below")
                .font(.caption)
                .foregroundColor(Color(hex: "64748B"))
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 4)
        }
        .padding(.horizontal)
    }
}

// MARK: - Chat Section
struct ChatSection: View {
    @ObservedObject var viewModel: AIFinancialAssistantViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ChatContent(viewModel: viewModel)
            ChatInput(currentMessage: $viewModel.currentMessage, onSend: viewModel.sendMessage)
        }
        .padding(.horizontal)
    }
}

// MARK: - Chat Content
struct ChatContent: View {
    @ObservedObject var viewModel: AIFinancialAssistantViewModel
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(hex: "0F172A"))
                .frame(height: 400)
            
            if viewModel.chatMessages.isEmpty {
                EmptyChatState()
            } else {
                ScrollView(showsIndicators: true) {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.chatMessages) { message in
                            PremiumChatBubble(message: message)
                        }
                        
                        if viewModel.isTyping {
                            HStack {
                                Text("AI is typing...")
                                    .font(.caption)
                                    .foregroundColor(Color(hex: "64748B"))
                                Spacer()
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.vertical)
                }
                .frame(maxWidth: .infinity)
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Chat Input
struct ChatInput: View {
    @Binding var currentMessage: String
    let onSend: (String) -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            TextField("Ask anything about your finances...", text: $currentMessage)
                .textFieldStyle(CustomTextFieldStyle())
            
            Button(action: {
                guard !currentMessage.isEmpty else { return }
                onSend(currentMessage)
            }) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title2)
                    .foregroundColor(Color(hex: "3B82F6"))
            }
        }
    }
}

// MARK: - Proactive Insights Section
struct ProactiveInsightsSection: View {
    let insights: [ProactiveInsight]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(Color(hex: "3B82F6"))
                Text("Proactive Insights")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            .padding(.horizontal)
            
            ForEach(insights) { insight in
                PremiumInsightCard(insight: insight)
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Learning Hub Section
struct LearningHubSection: View {
    let modules: [LearningModule]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "book.fill")
                    .foregroundColor(Color(hex: "3B82F6"))
                Text("Learning Hub")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            .padding(.horizontal)
            
            ForEach(modules) { module in
                LearningModuleCard(module: module)
            }
        }
        .padding(.horizontal)
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantView()
    }
} 