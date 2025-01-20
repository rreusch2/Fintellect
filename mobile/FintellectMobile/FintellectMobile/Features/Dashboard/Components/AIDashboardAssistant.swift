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
        
        let userMessage = ChatMessage(
            content: message.trimmingCharacters(in: .whitespacesAndNewlines), 
            isUser: true, 
            timestamp: Date()
        )
        
        await MainActor.run {
            messages.append(userMessage)
            currentMessage = ""
            isLoading = true
            errorMessage = nil
        }
        
        do {
            var lastError: Error?
            for attempt in 0...maxRetries {
                do {
                    if attempt > 0 {
                        try await Task.sleep(nanoseconds: UInt64(attempt * 500_000_000))
                    }
                    
                    let response = try await aiService.chat(message: message)
                    
                    await MainActor.run {
                        let aiMessage = ChatMessage(
                            content: response.message,
                            isUser: false,
                            timestamp: Date()
                        )
                        self.messages.append(aiMessage)
                        self.isLoading = false
                    }
                    return
                } catch {
                    lastError = error
                    print("[AI Assistant] Attempt \(attempt + 1) failed: \(error.localizedDescription)")
                    continue
                }
            }
            
            throw lastError ?? APIError.serverError("Failed to get response after \(maxRetries) attempts")
            
        } catch let error as APIError {
            await MainActor.run {
                handleError(error)
                isLoading = false
            }
        } catch {
            await MainActor.run {
                handleError(APIError.serverError(error.localizedDescription))
                isLoading = false
            }
        }
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
                    .background(
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(hex: "3B82F6").opacity(0.2))
                    )
                
                Button {
                    withAnimation {
                        viewModel.isExpanded.toggle()
                    }
                } label: {
                    Image(systemName: viewModel.isExpanded ? "chevron.down" : "chevron.up")
                        .foregroundColor(Color(hex: "64748B"))
                        .frame(width: 24, height: 24)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            
            // Description
            Text("Get personalized financial guidance through natural conversation")
                .font(.subheadline)
                .foregroundColor(Color(hex: "94A3B8"))
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
            
            // Quick Actions Grid
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12)
            ], spacing: 12) {
                ForEach(QuickAction.actions) { action in
                    QuickActionButton(action: action) {
                        Task {
                            await viewModel.sendMessage(action.message)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            
            // Chat Area
            ChatArea(viewModel: viewModel)
                .padding(.horizontal, 16)
        }
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color(hex: "1E293B"))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
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
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Image(systemName: action.icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(action.color)
                        .frame(width: 24, height: 24)
                    
                    Text(action.label)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    Spacer(minLength: 0)
                }
                
                Text(action.description)
                    .font(.caption)
                    .foregroundColor(Color(hex: "94A3B8"))
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
        .frame(height: 72) // Fixed height for consistency
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
            .frame(maxHeight: viewModel.isExpanded ? .infinity : 300)
            
            HStack(spacing: 12) {
                TextField("Ask about your finances...", text: $viewModel.currentMessage)
                    .textFieldStyle(CustomTextFieldStyle())
                    .accentColor(Color(hex: "3B82F6"))
                    .tint(Color(hex: "3B82F6"))
                    .submitLabel(.send)
                    .onSubmit {
                        Task {
                            await viewModel.sendMessage(viewModel.currentMessage)
                        }
                    }
                
                Button {
                    Task {
                        await viewModel.sendMessage(viewModel.currentMessage)
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(viewModel.currentMessage.isEmpty ? 
                            Color(hex: "64748B") : Color(hex: "3B82F6"))
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
    
    private func shouldFormatAsStructured(_ content: String) -> Bool {
        let keywords = [
            "Analysis", "Overview", "Insights", "Budget",
            "Current", "Suggestions", "Quick Wins", "Spending",
            "Recommendations", "Next Steps", "Categories"
        ]
        
        return keywords.contains { keyword in
            content.contains(keyword)
        }
    }
    
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
                    let sections = formatSections(message.content)
                    ForEach(sections, id: \.self) { section in
                        VStack(alignment: .leading, spacing: 8) {
                            if let title = section.title?.replacingOccurrences(of: "**", with: "")
                                                          .replacingOccurrences(of: ":", with: "")
                                                          .trimmingCharacters(in: .whitespaces) {
                                Text(title)
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .padding(.bottom, 4)
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
                                        .foregroundColor(Color(hex: "CBD5E1"))
                                        .lineSpacing(4)
                                }
                            }
                        }
                        .padding(.vertical, 8)
                        
                        if section != sections.last {
                            Divider()
                                .background(Color(hex: "334155"))
                                .padding(.vertical, 8)
                        }
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "0F172A"))
                        .shadow(color: Color(hex: "3B82F6").opacity(0.1), radius: 8, x: 0, y: 4)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color(hex: "3B82F6").opacity(0.2), lineWidth: 1)
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
        let lines = content.components(separatedBy: .newlines)
        var sections: [Section] = []
        var currentTitle: String?
        var currentItems: [String] = []
        
        for line in lines {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            
            // Skip empty lines
            if trimmedLine.isEmpty {
                if !currentItems.isEmpty {
                    sections.append(Section(title: currentTitle, items: currentItems))
                    currentItems = []
                    currentTitle = nil
                }
                continue
            }
            
            // Check if line is a title (doesn't start with bullet points or spaces)
            if !trimmedLine.hasPrefix("•") && !trimmedLine.hasPrefix("-") && !trimmedLine.hasPrefix(" ") {
                if !currentItems.isEmpty {
                    sections.append(Section(title: currentTitle, items: currentItems))
                    currentItems = []
                }
                currentTitle = trimmedLine
            } else {
                // It's a content item
                if !trimmedLine.isEmpty {
                    currentItems.append(trimmedLine)
                }
            }
        }
        
        // Add the last section if there are remaining items
        if !currentItems.isEmpty {
            sections.append(Section(title: currentTitle, items: currentItems))
        }
        
        // If no sections were created but we have content, create a single section
        if sections.isEmpty && !content.isEmpty {
            sections.append(Section(title: nil, items: [content]))
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