import SwiftUI
import Charts

struct SpendingCategory: Identifiable {
    let id = UUID()
    let name: String
    let amount: Double
    let percentage: Double
    var color: Color
}

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedInsightType: InsightType? = nil
    @State private var chatMessage = ""
    @State private var chatMessages: [ChatMessage] = []
    @State private var selectedCategory: SpendingCategory? = nil
    
    // Sample spending categories (replace with your actual data)
    let categories = [
        SpendingCategory(name: "Utilities", amount: 594.96, percentage: 0.373, color: Color(hex: "3B82F6")),
        SpendingCategory(name: "Food & Drink", amount: 366.18, percentage: 0.229, color: Color(hex: "10B981")),
        SpendingCategory(name: "Shopping", amount: 314.92, percentage: 0.198, color: Color(hex: "8B5CF6")),
        SpendingCategory(name: "Entertainment", amount: 200.00, percentage: 0.125, color: Color(hex: "F59E0B")),
        SpendingCategory(name: "Other", amount: 120.00, percentage: 0.075, color: Color(hex: "EC4899"))
    ]
    
    enum InsightType: String, CaseIterable {
        case spending = "Analyze Spending"
        case budget = "Budget Help"
        case savings = "Savings Tips"
        case recurring = "Recurring Charges"
    }
    
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 24) {
                // Balance Overview
                VStack(spacing: 8) {
                    Text(viewModel.totalBalance.formatted(.currency(code: "USD")))
                        .font(.system(size: 40, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.white, Color(hex: "E2E8F0")],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                    
                    Text("Available Balance")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .textCase(.uppercase)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                
                // Monthly Stats
                VStack(spacing: 12) {
                    // Spending
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Image(systemName: "arrow.down.circle.fill")
                                .foregroundColor(.red.opacity(0.8))
                            Text("Monthly Spending")
                                .font(.footnote)
                                .foregroundColor(.gray)
                                .textCase(.uppercase)
                        }
                        Text(viewModel.monthlySpending.formatted(.currency(code: "USD")))
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(hex: "1E293B"))
                            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                    )
                    
                    // Savings
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Image(systemName: "arrow.up.circle.fill")
                                .foregroundColor(.green.opacity(0.8))
                            Text("Monthly Savings")
                                .font(.footnote)
                                .foregroundColor(.gray)
                                .textCase(.uppercase)
                        }
                        Text(viewModel.monthlySavings.formatted(.currency(code: "USD")))
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(hex: "1E293B"))
                            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                    )
                }
                .padding(.horizontal, 16)
                
                // AI Assistant Section
                VStack(alignment: .leading, spacing: 16) {
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
                    }
                    
                    Text("Get personalized financial guidance through natural conversation")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    // Enhanced Quick Actions
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(InsightType.allCases, id: \.self) { type in
                                Button {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                                        handlePromptSelection(type)
                                    }
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: iconFor(type))
                                        Text(type.rawValue)
                                            .lineLimit(2)
                                            .multilineTextAlignment(.leading)
                                    }
                                    .font(.footnote)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 10)
                                    .frame(width: 130, height: 50)
                                    .background(
                                        RoundedRectangle(cornerRadius: 16)
                                            .fill(Color(hex: "1E293B"))
                                            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                                    )
                                }
                                .buttonStyle(PressableButtonStyle())
                            }
                        }
                        .padding(.horizontal, 4)
                    }
                    
                    // Chat Area
                    VStack(spacing: 12) {
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(chatMessages) { message in
                                    ChatBubble(message: message.content, isUser: message.isUser)
                                }
                            }
                            .padding(.vertical, 8)
                        }
                        .frame(height: 180)
                        
                        HStack(spacing: 12) {
                            TextField("Ask about your finances...", text: $chatMessage)
                                .textFieldStyle(CustomTextFieldStyle())
                            
                            Button(action: sendMessage) {
                                Image(systemName: "arrow.up.circle.fill")
                                    .font(.system(size: 28))
                                    .foregroundColor(Color(hex: "3B82F6"))
                            }
                        }
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "0F172A"))
                        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
                )
                .padding(.horizontal, 16)
                
                // AI Insights
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 8) {
                        Label("AI Financial Insights", systemImage: "chart.bar.fill")
                            .font(.headline)
                            .foregroundColor(.white)
                        Spacer()
                    }
                    
                    if !viewModel.aiInsights.isEmpty {
                        ForEach(viewModel.aiInsights) { insight in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text(insight.title)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.white)
                                    Spacer()
                                    Text(insight.type)
                                        .font(.caption)
                                        .fontWeight(.medium)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color(hex: "3B82F6"))
                                        .cornerRadius(8)
                                }
                                
                                Text(insight.description)
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.8))
                                    .lineLimit(4)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color(hex: "1E293B"))
                                    .shadow(color: .black.opacity(0.1), radius: 6, x: 0, y: 3)
                            )
                        }
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "0F172A"))
                        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
                )
                .padding(.horizontal, 16)
                
                // New Spending Distribution Chart Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Label("Spending Distribution", systemImage: "chart.pie.fill")
                            .font(.headline)
                            .foregroundColor(.white)
                        Spacer()
                    }
                    
                    // Donut Chart
                    Chart {
                        ForEach(categories) { category in
                            SectorMark(
                                angle: .value("Spending", category.percentage),
                                innerRadius: .ratio(0.6),
                                angularInset: 1.5
                            )
                            .cornerRadius(4)
                            .foregroundStyle(category.color)
                            .opacity(selectedCategory?.id == category.id ? 1 : 0.8)
                        }
                    }
                    .frame(height: 200)
                    .chartBackground { proxy in
                        GeometryReader { geometry in
                            VStack {
                                if let selected = selectedCategory {
                                    Text(selected.amount.formatted(.currency(code: "USD")))
                                        .font(.headline)
                                        .foregroundColor(.white)
                                    Text(selected.name)
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                } else {
                                    Text(viewModel.monthlySpending.formatted(.currency(code: "USD")))
                                        .font(.headline)
                                        .foregroundColor(.white)
                                    Text("Total Spending")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                }
                            }
                            .position(
                                x: geometry.size.width / 2,
                                y: geometry.size.height / 2
                            )
                        }
                    }
                    .chartAnimate(.easeInOut(duration: 0.5))
                    
                    // Legend
                    VStack(spacing: 12) {
                        ForEach(categories) { category in
                            Button {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    selectedCategory = selectedCategory?.id == category.id ? nil : category
                                }
                            } label: {
                                HStack(spacing: 8) {
                                    Circle()
                                        .fill(category.color)
                                        .frame(width: 8, height: 8)
                                    
                                    Text(category.name)
                                        .font(.footnote)
                                        .foregroundColor(.white)
                                    
                                    Spacer()
                                    
                                    Text(category.percentage.formatted(.percent.precision(.fractionLength(1))))
                                        .font(.footnote)
                                        .foregroundColor(.gray)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                    .padding(.top, 8)
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "0F172A"))
                        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
                )
                .padding(.horizontal, 16)
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
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
                .font(.subheadline)
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(isUser ? Color(hex: "3B82F6") : Color(hex: "334155"))
                        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                )
            
            if !isUser { Spacer() }
        }
        .padding(.horizontal, 8)
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(.subheadline)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(hex: "1E293B"))
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color(hex: "3B82F6").opacity(0.3), lineWidth: 1)
            )
    }
}

// Add this new button style for the press animation
struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

#Preview {
    NavigationView {
        DashboardView()
            .environmentObject(AuthViewModel())
    }
} 