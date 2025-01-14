import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedInsightType: InsightType? = nil
    @State private var chatMessage = ""
    @State private var chatMessages: [ChatMessage] = []
    
    enum InsightType: String, CaseIterable {
        case spending = "Analyze Spending"
        case budget = "Budget Help"
        case savings = "Savings Tips"
        case recurring = "Recurring Charges"
    }
    
    var body: some View {
        GeometryReader { geometry in
            let screenWidth = geometry.size.width
            
            ZStack {
                BackgroundView()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 12) {
                        // Balance Overview
                        VStack(spacing: 4) {
                            Text(viewModel.totalBalance.formatted(.currency(code: "USD")))
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text("Available Balance")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        
                        // Monthly Stats
                        HStack(spacing: 8) {
                            // Spending
                            VStack(alignment: .leading) {
                                Text("Spending")
                                    .font(.caption2)
                                    .foregroundColor(.red.opacity(0.8))
                                Text(viewModel.monthlySpending.formatted(.currency(code: "USD")))
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                            .background(Color.black.opacity(0.3))
                            .cornerRadius(12)
                            
                            // Savings
                            VStack(alignment: .leading) {
                                Text("Savings")
                                    .font(.caption2)
                                    .foregroundColor(.green.opacity(0.8))
                                Text(viewModel.monthlySavings.formatted(.currency(code: "USD")))
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                            .background(Color.black.opacity(0.3))
                            .cornerRadius(12)
                        }
                        .padding(.horizontal, 16)
                        
                        // AI Assistant Section
                        VStack(alignment: .leading, spacing: 8) {
                            Label("AI Assistant", systemImage: "sparkles")
                                .font(.footnote)
                                .foregroundColor(.white)
                            
                            Text("Get personalized financial guidance through natural conversation")
                                .font(.caption)
                                .foregroundColor(.gray)
                            
                            // Quick Actions
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(InsightType.allCases, id: \.self) { type in
                                        Button {
                                            handlePromptSelection(type)
                                        } label: {
                                            HStack(spacing: 4) {
                                                Image(systemName: iconFor(type))
                                                Text(type.rawValue)
                                                    .lineLimit(1)
                                            }
                                            .font(.caption)
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(Color(hex: "1E293B"))
                                            .cornerRadius(16)
                                        }
                                    }
                                }
                                .padding(.horizontal, 4)
                            }
                            
                            // Chat Area
                            VStack(spacing: 8) {
                                ScrollView {
                                    VStack(spacing: 8) {
                                        ForEach(chatMessages) { message in
                                            ChatBubble(message: message.content, isUser: message.isUser)
                                        }
                                    }
                                    .padding(.vertical, 4)
                                }
                                .frame(height: 150)
                                
                                HStack(spacing: 8) {
                                    TextField("Ask about your finances...", text: $chatMessage)
                                        .textFieldStyle(CustomTextFieldStyle())
                                    
                                    Button(action: sendMessage) {
                                        Image(systemName: "arrow.up.circle.fill")
                                            .font(.system(size: 24))
                                            .foregroundColor(Color(hex: "3B82F6"))
                                    }
                                }
                            }
                        }
                        .padding(12)
                        .background(Color(hex: "0F172A"))
                        .cornerRadius(16)
                        .padding(.horizontal, 16)
                        
                        // AI Insights
                        VStack(alignment: .leading, spacing: 8) {
                            Label("AI Financial Insights", systemImage: "chart.bar.fill")
                                .font(.footnote)
                                .foregroundColor(.white)
                            
                            if !viewModel.aiInsights.isEmpty {
                                ForEach(viewModel.aiInsights) { insight in
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack {
                                            Text(insight.title)
                                                .font(.caption)
                                                .fontWeight(.semibold)
                                                .foregroundColor(.white)
                                            Spacer()
                                            Text(insight.type)
                                                .font(.caption2)
                                                .foregroundColor(.white)
                                                .padding(.horizontal, 6)
                                                .padding(.vertical, 2)
                                                .background(Color(hex: "3B82F6"))
                                                .cornerRadius(8)
                                        }
                                        
                                        Text(insight.description)
                                            .font(.caption)
                                            .foregroundColor(.white.opacity(0.8))
                                            .lineLimit(3)
                                    }
                                    .padding(10)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color(hex: "1E293B"))
                                    .cornerRadius(12)
                                }
                            }
                        }
                        .padding(12)
                        .background(Color(hex: "0F172A"))
                        .cornerRadius(16)
                        .padding(.horizontal, 16)
                    }
                    .padding(.vertical, 16)
                }
            }
        }
        .navigationTitle("Dashboard")
        .task {
            await viewModel.fetchDashboardData()
        }
    }
    
    private func handlePromptSelection(_ type: InsightType) {
        let promptMessage = ChatMessage(content: type.rawValue, isUser: true)
        chatMessages.append(promptMessage)
        
        // Add AI response based on the prompt
        let response = getAIResponse(for: type)
        let aiMessage = ChatMessage(content: response, isUser: false)
        chatMessages.append(aiMessage)
    }
    
    private func sendMessage() {
        guard !chatMessage.isEmpty else { return }
        let userMessage = ChatMessage(content: chatMessage, isUser: true)
        chatMessages.append(userMessage)
        chatMessage = ""
        
        // Simulate AI response
        let aiMessage = ChatMessage(content: "I'll help you analyze that. Let me check your financial data...", isUser: false)
        chatMessages.append(aiMessage)
    }
    
    private func getAIResponse(for type: InsightType) -> String {
        switch type {
        case .spending:
            return "Let me analyze your spending patterns to find opportunities for optimization..."
        case .budget:
            return "I'll help you create a personalized budget based on your financial goals..."
        case .savings:
            return "Let's explore ways to optimize your savings based on your recent spending..."
        case .recurring:
            return "I'll check your recurring charges to identify potential savings opportunities..."
        }
    }
    
    private func iconFor(_ type: InsightType) -> String {
        switch type {
        case .spending: return "chart.bar.fill"
        case .budget: return "dollarsign.circle.fill"
        case .savings: return "leaf.fill"
        case .recurring: return "repeat.circle.fill"
        }
    }
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isUser: Bool
}

struct ChatBubble: View {
    let message: String
    let isUser: Bool
    
    var body: some View {
        HStack {
            if isUser { Spacer() }
            
            Text(message)
                .font(.caption)
                .foregroundColor(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isUser ? Color(hex: "3B82F6") : Color(hex: "334155"))
                .cornerRadius(16)
            
            if !isUser { Spacer() }
        }
        .padding(.horizontal, 4)
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(hex: "1E293B"))
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color(hex: "3B82F6").opacity(0.3), lineWidth: 1)
            )
    }
}

#Preview {
    NavigationView {
        DashboardView()
            .environmentObject(AuthViewModel())
    }
} 