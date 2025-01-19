import SwiftUI
import Charts

enum InsightType: String, CaseIterable {
    case spending = "Analyze Spending"
    case budget = "Budget Review"
    case savings = "Savings Tips"
    case recurring = "Recurring Charges"
}

struct SpendingCategory: Identifiable, Equatable {
    let id = UUID()
    let name: String
    let amount: Double
    let percentage: Double
    var color: Color
    
    static func == (lhs: SpendingCategory, rhs: SpendingCategory) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Main DashboardView
struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 24) {
                BalanceOverviewSection(balance: viewModel.totalBalance)
                MonthlyStatsSection(spending: viewModel.monthlySpending)
                AIAssistantSection(viewModel: viewModel)
                SpendingDistributionSection(
                    monthlySpending: viewModel.monthlySpending,
                    categories: viewModel.spendingCategories
                )
                AIInsightsSection(insights: viewModel.aiInsights)
                AIFinancialInsightsSection(viewModel: viewModel)
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.fetchDashboardData()
        }
    }
}

// MARK: - Balance Overview Section
struct BalanceOverviewSection: View {
    let balance: Double
    
    var body: some View {
        VStack(spacing: 8) {
            Text(balance.formatted(.currency(code: "USD")))
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
    }
}

// MARK: - Monthly Stats Section
struct MonthlyStatsSection: View {
    let spending: Double
    
    var body: some View {
        StatCard(
            title: "Monthly Spending",
            value: spending.formatted(.currency(code: "USD")),
            icon: "dollarsign.circle.fill",
            color: Color(hex: "3B82F6")
        )
        .padding(.horizontal, 16)
    }
}

// MARK: - AI Assistant Section
struct AIAssistantSection: View {
    @ObservedObject var viewModel: DashboardViewModel
    @State private var chatMessage = ""
    @State private var selectedInsightType: InsightType? = nil
    
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
            }
            
            Text("Get personalized financial guidance through natural conversation")
                .font(.subheadline)
                .foregroundColor(.gray)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            // Quick Actions
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(QuickAction.allCases) { action in
                        Button {
                            Task {
                                await viewModel.sendChatMessage(action.message)
                            }
                        } label: {
                            Text(action.title)
                                .font(.subheadline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color(hex: "1E293B"))
                                .cornerRadius(20)
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            // Chat Area
            VStack(spacing: 16) {
                // Messages
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.chatMessages) { message in
                            ChatBubble(message: message)
                        }
                        if viewModel.isLoadingChat {
                            TypingIndicator()
                        }
                    }
                    .padding()
                }
                .frame(maxHeight: 200)
                
                // Input Area
                HStack(spacing: 12) {
                    TextField("Ask me anything...", text: $chatMessage)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .foregroundColor(.white)
                    
                    Button {
                        guard !chatMessage.isEmpty else { return }
                        let message = chatMessage
                        chatMessage = ""
                        Task {
                            await viewModel.sendChatMessage(message)
                        }
                    } label: {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                            .foregroundColor(Color(hex: "3B82F6"))
                    }
                    .disabled(chatMessage.isEmpty || viewModel.isLoadingChat)
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
                .background(message.isUser ? Color(hex: "3B82F6") : Color(hex: "1E293B"))
                .foregroundColor(.white)
                .cornerRadius(16)
                .cornerRadius(16, corners: message.isUser ? [.topLeft, .topRight, .bottomLeft] : [.topLeft, .topRight, .bottomRight])
            
            if !message.isUser {
                Spacer()
            }
        }
    }
}

// MARK: - Typing Indicator
struct TypingIndicator: View {
    @State private var phase = 0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color(hex: "3B82F6"))
                    .frame(width: 6, height: 6)
                    .scaleEffect(phase == index ? 1.2 : 0.8)
                    .animation(.easeInOut(duration: 0.5).repeatForever(), value: phase)
            }
        }
        .onAppear {
            Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
                phase = (phase + 1) % 3
            }
        }
    }
}

// MARK: - Quick Actions
enum QuickAction: String, CaseIterable, Identifiable {
    case spendingAnalysis = "Analyze my spending"
    case savingsTips = "Suggest savings tips"
    case investmentAdvice = "Investment advice"
    case budgetHelp = "Help with budgeting"
    
    var id: String { rawValue }
    
    var title: String { rawValue }
    
    var message: String {
        switch self {
        case .spendingAnalysis:
            return "Can you analyze my recent spending patterns?"
        case .savingsTips:
            return "What are some personalized saving tips for me?"
        case .investmentAdvice:
            return "Give me investment recommendations based on my profile"
        case .budgetHelp:
            return "Help me create a budget based on my spending patterns"
        }
    }
}

// MARK: - Spending Distribution Section
struct SpendingDistributionSection: View {
    let monthlySpending: Double
    let categories: [SpendingCategory]
    @State private var selectedCategory: SpendingCategory? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Label("Spending Distribution", systemImage: "chart.pie.fill")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }
            
            ChartView(
                categories: categories,
                selectedCategory: $selectedCategory,
                monthlySpending: monthlySpending
            )
            
            SpendingLegend(
                categories: categories,
                selectedCategory: $selectedCategory
            )
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(hex: "0F172A"))
                .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
        )
        .padding(.horizontal, 16)
    }
}

// MARK: - Chart View
struct ChartView: View {
    let categories: [SpendingCategory]
    @Binding var selectedCategory: SpendingCategory?
    let monthlySpending: Double
    
    var body: some View {
        Chart {
            ForEach(categories) { category in
                SectorMark(
                    angle: .value("Spending", category.percentage / 100.0),
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
                        Text(monthlySpending.formatted(.currency(code: "USD")))
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
        .animation(.easeInOut(duration: 0.5), value: selectedCategory)
    }
}

// MARK: - Spending Legend
struct SpendingLegend: View {
    let categories: [SpendingCategory]
    @Binding var selectedCategory: SpendingCategory?
    
    var body: some View {
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
                        
                        Text("\(category.percentage, specifier: "%.1f")%")
                            .font(.footnote)
                            .foregroundColor(.gray)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding(.top, 8)
    }
}

// MARK: - AI Insights Section
struct AIInsightsSection: View {
    let insights: [AIInsight]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Label("AI Financial Insights", systemImage: "chart.bar.fill")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }
            
            if !insights.isEmpty {
                ForEach(insights) { insight in
                    InsightCard(insight: insight)
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
    }
}

// MARK: - AI Financial Insights Section
struct AIFinancialInsightsSection: View {
    @ObservedObject var viewModel: DashboardViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 8) {
                Label("AI Financial Insights", systemImage: "brain")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
                
                if viewModel.isLoadingInsights {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Color(hex: "3B82F6")))
                        .scaleEffect(0.8)
                } else {
                    Button {
                        Task {
                            await viewModel.fetchInsights()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(Color(hex: "3B82F6"))
                    }
                }
            }
            
            if viewModel.insights.isEmpty && !viewModel.isLoadingInsights {
                EmptyInsightsView()
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(viewModel.insights) { insight in
                            InsightCard(insight: insight)
                        }
                    }
                    .padding(.horizontal)
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
    }
}

// MARK: - Insight Card
struct InsightCard: View {
    let insight: AIInsight
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with Priority Badge
            HStack {
                Text(insight.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .lineLimit(2)
                
                Spacer()
                
                PriorityBadge(type: insight.type)
            }
            
            // Description
            Text(insight.description)
                .font(.caption)
                .foregroundColor(Color(hex: "94A3B8"))
                .lineLimit(4)
        }
        .padding()
        .frame(width: 300)
        .background(Color(hex: "1E293B"))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(hex: "334155"), lineWidth: 1)
        )
    }
}

// MARK: - Priority Badge
struct PriorityBadge: View {
    let type: String
    
    var color: Color {
        switch type {
        case "HIGH":
            return Color(hex: "EF4444")
        case "MEDIUM":
            return Color(hex: "F59E0B")
        default:
            return Color(hex: "10B981")
        }
    }
    
    var body: some View {
        Text(type)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.1))
            .cornerRadius(8)
    }
}

// MARK: - Empty Insights View
struct EmptyInsightsView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 30))
                .foregroundColor(Color(hex: "3B82F6").opacity(0.5))
            
            Text("No insights yet")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
            
            Text("Connect your bank account to get personalized AI insights")
                .font(.caption)
                .foregroundColor(Color(hex: "94A3B8"))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
    }
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isUser: Bool
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