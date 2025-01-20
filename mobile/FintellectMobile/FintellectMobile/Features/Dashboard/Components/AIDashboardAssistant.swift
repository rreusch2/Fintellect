import SwiftUI
import UIKit

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
            message: "What are my top spending categories this month and where can I cut back?",
            icon: "chart.pie.fill",
            color: Color(hex: "3B82F6"),
            bgColor: Color(hex: "3B82F6").opacity(0.2),
            description: "Review spending patterns and find savings"
        ),
        QuickAction(
            label: "Budget Help",
            message: "Based on my recent transactions, what would be a realistic monthly budget?",
            icon: "target",
            color: Color(hex: "10B981"),
            bgColor: Color(hex: "10B981").opacity(0.2),
            description: "Create a personalized budget plan"
        ),
        QuickAction(
            label: "Savings Tips",
            message: "Looking at my spending habits, what are 3 specific ways I could save money?",
            icon: "dollarsign.circle.fill",
            color: Color(hex: "8B5CF6"),
            bgColor: Color(hex: "8B5CF6").opacity(0.2),
            description: "Get personalized savings advice"
        ),
        QuickAction(
            label: "Recurring Charges",
            message: "Can you identify my monthly subscriptions and recurring bills?",
            icon: "calendar",
            color: Color(hex: "F59E0B"),
            bgColor: Color(hex: "F59E0B").opacity(0.2),
            description: "Optimize your subscriptions"
        )
    ]
}

struct ChatMessage: Identifiable, Equatable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let timestamp: Date
    
    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id &&
        lhs.content == rhs.content &&
        lhs.isUser == rhs.isUser &&
        lhs.timestamp == rhs.timestamp
    }
}

// MARK: - View Model
@MainActor
class AIDashboardAssistantViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var currentMessage = ""
    @Published var isLoading = false
    @Published var isExpanded = false
    @Published var errorMessage: String?
    
    private let aiService: AIServiceClient
    private let maxRetries = 2
    
    init(aiService: AIServiceClient = AIServiceClient()) {
        self.aiService = aiService
    }
    
    private func formatCategory(_ category: String) -> String {
        let categoryMap: [String: String] = [
            "FOOD_AND_DRINK": "Food & Dining",
            "GENERAL_MERCHANDISE": "Shopping",
            "GENERAL_SERVICES": "Services",
            "TRANSPORTATION": "Transportation",
            "TRAVEL": "Travel",
            "ENTERTAINMENT": "Entertainment",
            "PERSONAL_CARE": "Personal Care",
            "BILLS_AND_UTILITIES": "Bills & Utilities",
            "LOAN_PAYMENTS": "Loan Payments",
            "TRANSFER": "Transfers",
            "SHOPPING": "Shopping",
            "FINANCIAL": "Financial",
            "BILLS": "Bills & Utilities",
            "HOUSING": "Housing",
            "MEDICAL": "Healthcare",
            "EDUCATION": "Education",
            "BUSINESS": "Business",
            "SUBSCRIPTION": "Subscriptions"
        ]
        
        return categoryMap[category] ?? category.replacingOccurrences(of: "_", with: " ").capitalized
    }
    
    private func formatMessage(_ message: String) -> String {
        var formattedMessage = message
        
        // Format category names
        let categoryPattern = /[A-Z_]+(?=\s|:|,|\.|$)/
        formattedMessage = formattedMessage.replacing(categoryPattern) { match in
            formatCategory(String(match.0))
        }
        
        // Remove savings rate references
        let savingsRatePattern = /your current savings rate is \d+\.?\d*%\.?/i
        formattedMessage = formattedMessage.replacing(savingsRatePattern, with: "")
        
        // Remove income references when zero
        let zeroIncomePattern = /\*\*Income:\*\* \$0\.00|your monthly income of \$0\.00/i
        formattedMessage = formattedMessage.replacing(zeroIncomePattern, with: "")
        
        // Clean up any double spaces or periods
        formattedMessage = formattedMessage.replacing(/\s+/, with: " ")
        formattedMessage = formattedMessage.replacing(/\.+/, with: ".")
        formattedMessage = formattedMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        
        return formattedMessage
    }
    
    func sendMessage(_ message: String) async {
        guard !message.isEmpty else { return }
        
        let userMessage = ChatMessage(content: message, isUser: true, timestamp: Date())
        messages.append(userMessage)
        currentMessage = ""
        isLoading = true
        errorMessage = nil
        
        do {
            var lastError: Error?
            for attempt in 0...maxRetries {
                do {
                    if attempt > 0 {
                        try await Task.sleep(nanoseconds: UInt64(attempt * 500_000_000))
                    }
                    
                    let response = try await aiService.chat(message: message)
                    let formattedMessage = formatMessage(response.message)
                    let aiMessage = ChatMessage(content: formattedMessage, isUser: false, timestamp: Date())
                    messages.append(aiMessage)
                    isLoading = false
                    return
                } catch {
                    lastError = error
                    print("[AI Assistant] Attempt \(attempt + 1) failed: \(error.localizedDescription)")
                    continue
                }
            }
            
            throw lastError ?? APIError.serverError("Failed to get response after \(maxRetries) attempts")
            
        } catch let error as APIError {
            handleError(error)
        } catch {
            handleError(APIError.serverError(error.localizedDescription))
        }
        
        isLoading = false
    }
    
    private func handleError(_ error: APIError) {
        let errorMessage: String
        switch error {
        case .serverError(let message):
            if message.contains("401") || message.contains("unauthorized") || message.contains("Unauthorized") {
                errorMessage = "Session expired. Please try again."
            } else {
                errorMessage = "Server error: \(message)"
            }
        case .invalidResponse:
            errorMessage = "Invalid response from server"
        case .decodingError:
            errorMessage = "Error processing server response"
        }
        
        let errorChatMessage = ChatMessage(
            content: "I apologize, but I'm having trouble processing your request. \(errorMessage)",
            isUser: false,
            timestamp: Date()
        )
        messages.append(errorChatMessage)
        self.errorMessage = errorMessage
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
        Button {
            onTap()
        } label: {
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

// MARK: - Loading Animation View
struct LoadingDotsView: View {
    @State private var animating = false
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(Color.gray.opacity(0.5))
                    .frame(width: 8, height: 8)
                    .offset(y: animating ? -4 : 0)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(hex: "1E293B"))
        .cornerRadius(16)
        .onAppear {
            withAnimation(
                Animation
                    .easeInOut(duration: 0.5)
                    .repeatForever()
            ) {
                animating = true
            }
        }
    }
}

// MARK: - Compact Quick Action Button
struct CompactQuickActionButton: View {
    let action: QuickAction
    let onTap: () -> Void
    
    var body: some View {
        Button {
            onTap()
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: action.icon)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(action.color)
                    .frame(width: 32, height: 32)
                    .background(action.bgColor)
                    .clipShape(Circle())
                
                Text(action.label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text(action.description)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(hex: "1E293B"))
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
    
    var body: some View {
        VStack(spacing: 16) {
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.messages) { message in
                        ChatBubble(message: message)
                    }
                    
                    if viewModel.isLoading {
                        LoadingDotsView()
                            .transition(.opacity)
                    }
                }
                .padding(.vertical, 8)
            }
            .animation(.spring(), value: viewModel.messages)
            
            // Input Area
            HStack(spacing: 12) {
                TextField("Ask a question...", text: $viewModel.currentMessage)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(.body)
                
                Button {
                    let message = viewModel.currentMessage
                    Task {
                        await viewModel.sendMessage(message)
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(viewModel.currentMessage.isEmpty ? .gray : Color(hex: "3B82F6"))
                }
                .disabled(viewModel.currentMessage.isEmpty || viewModel.isLoading)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 12)
            .background(Color(hex: "1E293B"))
            .cornerRadius(16)
        }
    }
}

// MARK: - Chat Bubble
struct ChatBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer(minLength: 60)
            }
            
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.body)
                    .foregroundColor(message.isUser ? .white : .white.opacity(0.95))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        message.isUser ? Color(hex: "3B82F6") : Color(hex: "1E293B")
                    )
                    .clipShape(
                        RoundedCorner(
                            radius: 16,
                            corners: message.isUser ? 
                                [UIRectCorner.topLeft, .topRight, .bottomLeft] : 
                                [UIRectCorner.topLeft, .topRight, .bottomRight]
                        )
                    )
                
                Text(message.timestamp.formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 4)
            }
            
            if !message.isUser {
                Spacer(minLength: 60)
            }
        }
        .transition(.move(edge: message.isUser ? .trailing : .leading))
    }
}

// MARK: - Corner Radius Shape
struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
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