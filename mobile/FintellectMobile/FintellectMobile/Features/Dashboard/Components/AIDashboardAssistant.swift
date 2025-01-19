import SwiftUI

// MARK: - Models
struct QuickAction: Identifiable {
    let id = UUID()
    let label: String
    let message: String
    let icon: String
    let color: Color
    let bgColor: Color
    
    static let actions = [
        QuickAction(
            label: "Analyze Spending",
            message: "Can you analyze my recent spending patterns and suggest areas for improvement?",
            icon: "chart.pie.fill",
            color: .blue,
            bgColor: Color.blue.opacity(0.1)
        ),
        QuickAction(
            label: "Budget Help",
            message: "Help me create a budget based on my spending patterns",
            icon: "target",
            color: .green,
            bgColor: Color.green.opacity(0.1)
        ),
        QuickAction(
            label: "Savings Tips",
            message: "What are some personalized saving tips based on my transaction history?",
            icon: "dollarsign.circle.fill",
            color: .purple,
            bgColor: Color.purple.opacity(0.1)
        ),
        QuickAction(
            label: "Recurring Charges",
            message: "Can you identify my recurring charges and suggest potential optimizations?",
            icon: "calendar",
            color: .orange,
            bgColor: Color.orange.opacity(0.1)
        )
    ]
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let timestamp: Date
}

// MARK: - View Model
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
        currentMessage = ""
        isLoading = true
        
        do {
            let response = try await aiService.chat(message: message)
            let aiMessage = ChatMessage(content: response.message, isUser: false, timestamp: Date())
            messages.append(aiMessage)
        } catch {
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

// MARK: - Main View
struct AIDashboardAssistant: View {
    @StateObject private var viewModel = AIDashboardAssistantViewModel()
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 8) {
                Label("AI Assistant", systemImage: "sparkles")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text("BETA")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.blue.opacity(0.2))
                    .cornerRadius(6)
                
                Button(action: { viewModel.isExpanded.toggle() }) {
                    Image(systemName: viewModel.isExpanded ? "chevron.down" : "chevron.up")
                        .foregroundColor(.gray)
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
                .fill(colorScheme == .dark ? Color(hex: "1E293B") : .white)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
        .sheet(isPresented: $viewModel.isExpanded) {
            ExpandedChatView(viewModel: viewModel)
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let action: QuickAction
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 6) {
                Image(systemName: action.icon)
                    .foregroundColor(action.color)
                Text(action.label)
                    .foregroundColor(.primary)
            }
            .font(.footnote)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(action.bgColor)
            .cornerRadius(20)
        }
    }
}

// MARK: - Chat Area
struct ChatArea: View {
    @ObservedObject var viewModel: AIDashboardAssistantViewModel
    
    var body: some View {
        VStack(spacing: 12) {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.messages) { message in
                        ChatBubble(message: message)
                    }
                    
                    if viewModel.isLoading {
                        HStack {
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
            }
            .frame(height: viewModel.isExpanded ? 400 : 200)
            
            HStack(spacing: 12) {
                TextField("Ask about your finances...", text: $viewModel.currentMessage)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button {
                    Task {
                        await viewModel.sendMessage(viewModel.currentMessage)
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.blue)
                }
                .disabled(viewModel.currentMessage.isEmpty || viewModel.isLoading)
            }
        }
    }
}

// MARK: - Chat Bubble
struct ChatBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer()
            }
            
            Text(message.content)
                .padding(12)
                .background(message.isUser ? Color.blue : Color(.systemGray6))
                .foregroundColor(message.isUser ? .white : .primary)
                .cornerRadius(16)
                .frame(maxWidth: 280, alignment: message.isUser ? .trailing : .leading)
            
            if !message.isUser {
                Spacer()
            }
        }
        .padding(.horizontal, 8)
    }
}

// MARK: - Expanded Chat View
struct ExpandedChatView: View {
    @ObservedObject var viewModel: AIDashboardAssistantViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                ChatArea(viewModel: viewModel)
                    .padding()
            }
            .navigationTitle("AI Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
} 