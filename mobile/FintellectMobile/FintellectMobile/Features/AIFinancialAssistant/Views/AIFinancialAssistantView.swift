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
    @State private var message = ""
    
    var body: some View {
        VStack(spacing: 16) {
            AssistantHeader()
            
            // Workflows
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(viewModel.workflows) { workflow in
                        WorkflowButton(workflow: workflow) {
                            Task {
                                await viewModel.startWorkflow(workflow)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            // Chat Area
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.chatMessages) { message in
                        ChatBubble(message: message)
                    }
                    
                    if viewModel.isTyping {
                        HStack {
                            TypingIndicator()
                            Spacer()
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .frame(maxWidth: .infinity)
            .background(Color(hex: "1E293B"))
            .cornerRadius(16)
            
            // Message Input
            HStack(spacing: 12) {
                TextField("Ask anything...", text: $message)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .disabled(viewModel.isTyping)
                
                Button {
                    guard !message.isEmpty else { return }
                    let messageToSend = message
                    message = ""
                    
                    Task {
                        await viewModel.sendMessage(messageToSend)
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(message.isEmpty ? .gray : Color(hex: "3B82F6"))
                }
                .disabled(message.isEmpty || viewModel.isTyping)
            }
            .padding()
            .background(Color(hex: "1E293B"))
            .cornerRadius(16)
        }
        .padding()
        .background(Color(hex: "0F172A"))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
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

struct TypingIndicator: View {
    @State private var dotOffset: CGFloat = 0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color(hex: "3B82F6"))
                    .frame(width: 6, height: 6)
                    .offset(y: dotOffset)
                    .animation(
                        Animation.easeInOut(duration: 0.5)
                            .repeatForever()
                            .delay(0.2 * Double(index)),
                        value: dotOffset
                    )
            }
        }
        .onAppear {
            dotOffset = -5
        }
    }
}

struct ChatBubble: View {
    let message: PremiumChatMessage
    
    var body: some View {
        HStack {
            if message.type == .user {
                Spacer()
            }
            
            VStack(alignment: message.type == .user ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .padding(12)
                    .background(bubbleColor)
                    .foregroundColor(textColor)
                    .cornerRadius(16)
                
                if let attachments = message.attachments {
                    ForEach(attachments) { attachment in
                        // Handle different attachment types here
                        EmptyView()
                    }
                }
            }
            
            if message.type != .user {
                Spacer()
            }
        }
        .padding(.horizontal)
    }
    
    private var bubbleColor: Color {
        switch message.type {
        case .user:
            return Color(hex: "3B82F6")
        case .assistant:
            return Color(hex: "1E293B")
        case .system:
            return Color(hex: "374151")
        }
    }
    
    private var textColor: Color {
        switch message.type {
        case .user:
            return .white
        case .assistant, .system:
            return Color(hex: "E5E7EB")
        }
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantView()
    }
} 