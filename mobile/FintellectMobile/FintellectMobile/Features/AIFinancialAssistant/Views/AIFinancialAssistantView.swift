import SwiftUI

struct AIFinancialAssistantView: View {
    @StateObject private var viewModel = AIDashboardAssistantViewModel()
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 8) {
                Label("AI Assistant", systemImage: "sparkles")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("BETA")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(Color(hex: "3B82F6"))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color(hex: "3B82F6").opacity(0.2))
                    .cornerRadius(6)
                
                Button(action: { viewModel.isExpanded.toggle() }) {
                    Image(systemName: viewModel.isExpanded ? "chevron.down" : "chevron.up")
                        .foregroundColor(.gray)
                        .padding(8)
                        .background(Color(hex: "1E293B"))
                        .clipShape(Circle())
                }
            }
            
            Text("Get personalized financial guidance through natural conversation")
                .font(.subheadline)
                .foregroundColor(.gray)
            
            // Quick Actions
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(QuickAction.actions) { action in
                        QuickActionButton(action: action) {
                            Task {
                                await viewModel.sendMessage(action.message)
                            }
                        }
                    }
                }
            }
            
            // Chat Area
            if !viewModel.messages.isEmpty || viewModel.isExpanded {
                ChatArea(viewModel: viewModel)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(hex: "0F172A"))
                .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
        )
        .sheet(isPresented: $viewModel.isExpanded) {
            ExpandedChatView(viewModel: viewModel)
        }
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
                        ChatMessageBubble(message: message)
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
            ChatInput(currentMessage: $viewModel.currentMessage) { message in
                await viewModel.sendMessage(message)
            }
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
                            ChatMessageBubble(message: message)
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
    var onSend: (String) async -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            TextField("Ask about your finances...", text: $currentMessage)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .disabled(currentMessage.isEmpty)
            
            Button {
                let message = currentMessage
                currentMessage = "" // Clear input immediately
                Task {
                    await onSend(message)
                }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(Color(hex: "3B82F6"))
            }
            .disabled(currentMessage.isEmpty)
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

struct ChatMessageBubble: View {
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

struct ChatBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer()
            }
            
            Text(message.content)
                .padding(12)
                .foregroundColor(.white)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(message.isUser ? Color(hex: "3B82F6") : Color(hex: "1E293B"))
                )
                .frame(maxWidth: 280, alignment: message.isUser ? .trailing : .leading)
            
            if !message.isUser {
                Spacer()
            }
        }
        .padding(.horizontal, 8)
    }
}

struct ChatArea: View {
    @ObservedObject var viewModel: AIDashboardAssistantViewModel
    
    var body: some View {
        VStack(spacing: 12) {
            ScrollView {
                ScrollViewReader { proxy in
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.messages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }
                        
                        if viewModel.isLoading {
                            HStack(spacing: 4) {
                                ProgressView()
                                    .scaleEffect(0.8)
                                Text("Thinking...")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding()
                        }
                    }
                    .padding(.vertical, 8)
                    .onChange(of: viewModel.messages) { messages in
                        if let lastMessage = messages.last {
                            withAnimation {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                }
            }
            .frame(maxHeight: viewModel.isExpanded ? .infinity : 200)
            
            ChatInput(currentMessage: $viewModel.currentMessage) { message in
                await viewModel.sendMessage(message)
            }
        }
    }
}

@MainActor
class AIDashboardAssistantViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var currentMessage = ""
    @Published var isLoading = false
    @Published var isExpanded = false
    
    private let aiService: AIServiceClient
    
    init(aiService: AIServiceClient = AIServiceClient()) {
        self.aiService = aiService
    }
    
    func sendMessage(_ message: String) async {
        guard !message.isEmpty else { return }
        
        let userMessage = ChatMessage(content: message, isUser: true, timestamp: Date())
        messages.append(userMessage)
        isLoading = true
        
        do {
            let response = try await aiService.chat(message: message)
            let aiMessage = ChatMessage(content: response, isUser: false, timestamp: Date())
            messages.append(aiMessage)
        } catch {
            print("Error in chat:", error)
            let errorMessage = ChatMessage(
                content: "I apologize, but I'm having trouble processing your request. Please try again.",
                isUser: false,
                timestamp: Date()
            )
            messages.append(errorMessage)
        }
        
        isLoading = false
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantView()
    }
} 