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
    
    func sendMessage(_ message: String) async {
        guard !message.isEmpty else { return }
        
        // Create and immediately append the user message
        let userMessage = ChatMessage(
            content: message.trimmingCharacters(in: .whitespacesAndNewlines), 
            isUser: true, 
            timestamp: Date()
        )
        messages.append(userMessage)
        currentMessage = ""
        isLoading = true
        errorMessage = nil
        
        do {
            // Try up to maxRetries times
            var lastError: Error?
            for attempt in 0...maxRetries {
                do {
                    if attempt > 0 {
                        // Add a small delay between retries
                        try await Task.sleep(nanoseconds: UInt64(attempt * 500_000_000))
                    }
                    
                    let response = try await aiService.chat(message: message)
                    let aiMessage = ChatMessage(content: response.message, isUser: false, timestamp: Date())
                    messages.append(aiMessage)
                    isLoading = false
                    return
                } catch {
                    lastError = error
                    print("[AI Assistant] Attempt \(attempt + 1) failed: \(error.localizedDescription)")
                    continue
                }
            }
            
            // If we get here, all retries failed
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
            
            // For user messages, use simple text display
            if message.isUser {
                Text(message.content)
                    .padding(12)
                    .foregroundColor(.white)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(hex: "3B82F6"))
                    )
                    .frame(maxWidth: 280, alignment: .trailing)
            } else {
                // For AI responses, use the formatted sections
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(formatSections(message.content), id: \.self) { section in
                        VStack(alignment: .leading, spacing: 8) {
                            if let title = section.title?.replacingOccurrences(of: "**", with: "") {
                                Text(title)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(Color(hex: "94A3B8"))
                            }
                            
                            ForEach(section.items, id: \.self) { item in
                                HStack(alignment: .top, spacing: 8) {
                                    if item.hasPrefix("•") || item.hasPrefix("-") {
                                        Circle()
                                            .fill(Color(hex: "3B82F6"))
                                            .frame(width: 6, height: 6)
                                            .padding(.top, 6)
                                    }
                                    
                                    Text(formatMessageItem(item))
                                        .font(.body)
                                        .foregroundColor(Color(hex: "94A3B8"))
                                }
                            }
                        }
                        
                        if section != formatSections(message.content).last {
                            Divider()
                                .background(Color(hex: "334155"))
                                .padding(.vertical, 8)
                        }
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "1E293B"))
                        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
                .frame(maxWidth: 300, alignment: .leading)
            }
            
            if !message.isUser {
                Spacer()
            }
        }
        .padding(.horizontal, 8)
    }
    
    // Helper struct for organizing message content
    private struct Section: Hashable {
        let title: String?
        let items: [String]
    }
    
    private func formatSections(_ content: String) -> [Section] {
        let lines = content.components(separatedBy: "\n")
        var sections: [Section] = []
        var currentTitle: String?
        var currentItems: [String] = []
        
        for line in lines {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            
            if trimmedLine.isEmpty {
                if !currentItems.isEmpty {
                    sections.append(Section(title: currentTitle, items: currentItems))
                    currentItems = []
                    currentTitle = nil
                }
            } else if !trimmedLine.hasPrefix("•") && !trimmedLine.hasPrefix("-") {
                if !currentItems.isEmpty {
                    sections.append(Section(title: currentTitle, items: currentItems))
                    currentItems = []
                }
                currentTitle = trimmedLine
            } else {
                currentItems.append(trimmedLine)
            }
        }
        
        if !currentItems.isEmpty {
            sections.append(Section(title: currentTitle, items: currentItems))
        }
        
        return sections
    }
    
    private func formatMessageItem(_ item: String) -> AttributedString {
        var attributedString = AttributedString(item.replacingOccurrences(of: "- ", with: "")
                                                  .replacingOccurrences(of: "• ", with: ""))
        
        // Format currency
        if let regex = try? NSRegularExpression(pattern: "\\$\\d+(?:,\\d{3})*\\.\\d{2}", options: []) {
            let nsRange = NSRange(item.startIndex..<item.endIndex, in: item)
            let matches = regex.matches(in: item, options: [], range: nsRange)
            
            for match in matches.reversed() {
                if let range = Range(match.range, in: item) {
                    let substring = item[range]
                    if let matchRange = attributedString.range(of: String(substring)) {
                        attributedString[matchRange].foregroundColor = Color(hex: "34D399")
                        attributedString[matchRange].font = .system(.body, design: .rounded, weight: .bold)
                    }
                }
            }
        }
        
        // Format percentages
        if let regex = try? NSRegularExpression(pattern: "\\d+\\.?\\d*%", options: []) {
            let nsRange = NSRange(item.startIndex..<item.endIndex, in: item)
            let matches = regex.matches(in: item, options: [], range: nsRange)
            
            for match in matches.reversed() {
                if let range = Range(match.range, in: item) {
                    let substring = item[range]
                    if let matchRange = attributedString.range(of: String(substring)) {
                        attributedString[matchRange].foregroundColor = Color(hex: "3B82F6")
                        attributedString[matchRange].font = .system(.body, design: .rounded, weight: .bold)
                    }
                }
            }
        }
        
        return attributedString
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