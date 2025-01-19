import SwiftUI

// MARK: - Models
struct QuickAction: Identifiable {
    let id = UUID()
    let label: String
    let message: String
    let icon: String
    let color: Color
    let bgColor: Color
    let description: String
    
    static let actions = [
        QuickAction(
            label: "Analyze Spending",
            message: "Can you analyze my recent spending patterns and suggest areas for improvement?",
            icon: "chart.pie.fill",
            color: Color(hex: "3B82F6"),
            bgColor: Color(hex: "3B82F6").opacity(0.2),
            description: "Review spending patterns and find savings"
        ),
        QuickAction(
            label: "Budget Help",
            message: "Help me create a budget based on my spending patterns",
            icon: "target",
            color: Color(hex: "10B981"),
            bgColor: Color(hex: "10B981").opacity(0.2),
            description: "Create a personalized budget plan"
        ),
        QuickAction(
            label: "Savings Tips",
            message: "What are some personalized saving tips based on my transaction history?",
            icon: "dollarsign.circle.fill",
            color: Color(hex: "8B5CF6"),
            bgColor: Color(hex: "8B5CF6").opacity(0.2),
            description: "Get personalized savings advice"
        ),
        QuickAction(
            label: "Recurring Charges",
            message: "Can you identify my recurring charges and suggest potential optimizations?",
            icon: "calendar",
            color: Color(hex: "F59E0B"),
            bgColor: Color(hex: "F59E0B").opacity(0.2),
            description: "Optimize your subscriptions"
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

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let action: QuickAction
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 8) {
                Image(systemName: action.icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(action.color)
                    .frame(width: 24, height: 24)
                
                Text(action.label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(hex: "1E293B"))
                    .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(action.color.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

// MARK: - Chat Area
struct ChatArea: View {
    @ObservedObject var viewModel: AIDashboardAssistantViewModel
    private let scrollProxy = ScrollViewProxy.self
    
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
            
            HStack(spacing: 12) {
                TextField("Ask about your finances...", text: $viewModel.currentMessage)
                    .textFieldStyle(CustomTextFieldStyle())
                
                Button {
                    Task {
                        await viewModel.sendMessage(viewModel.currentMessage)
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(Color(hex: "3B82F6"))
                        .frame(width: 44, height: 44)
                        .background(Color(hex: "1E293B"))
                        .clipShape(Circle())
                }
                .disabled(viewModel.currentMessage.isEmpty || viewModel.isLoading)
            }
            .padding(.bottom, 8)
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
                .foregroundColor(.white)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(message.isUser ? Color(hex: "3B82F6") : Color(hex: "1E293B"))
                        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
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
            ZStack {
                Color(hex: "0F172A").ignoresSafeArea()
                
                VStack(spacing: 16) {
                    // Quick Actions Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        ForEach(QuickAction.actions) { action in
                            CompactQuickActionButton(action: action) {
                                Task {
                                    await viewModel.sendMessage(action.message)
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // Chat Area
                    ChatArea(viewModel: viewModel)
                        .padding(.horizontal)
                }
                .padding(.vertical, 8)
            }
            .navigationTitle("AI Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color(hex: "0F172A"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(Color(hex: "3B82F6"))
                }
            }
        }
    }
}

// Add a new compact version of the quick action button for the expanded view
struct CompactQuickActionButton: View {
    let action: QuickAction
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 12) {
                    Image(systemName: action.icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(action.color)
                        .frame(width: 36, height: 36)
                        .background(action.bgColor)
                        .clipShape(Circle())
                    
                    Text(action.label)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                }
                
                Text(action.description)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(hex: "1E293B"))
                    .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(action.color.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
} 