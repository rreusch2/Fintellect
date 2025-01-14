import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedInsightType: InsightType = .spending
    @State private var chatMessage = ""
    
    enum InsightType: String, CaseIterable {
        case spending = "Analyze Spending"
        case budget = "Budget Help"
        case savings = "Savings Tips"
        case recurring = "Recurring Charges"
    }
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 12) {
                    // Financial Overview Cards
                    VStack(spacing: 8) {
                        // Balance Card
                        CardView {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Available Balance")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                
                                Text(viewModel.totalBalance.formatted(.currency(code: "USD")))
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .frame(height: 65)
                        
                        // Monthly Overview
                        HStack(spacing: 8) {
                            // Spending Card
                            CardView {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Spending")
                                        .font(.caption)
                                        .foregroundColor(.red.opacity(0.8))
                                    
                                    Text(viewModel.monthlySpending.formatted(.currency(code: "USD")))
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .frame(height: 55)
                            
                            // Savings Card
                            CardView {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Savings")
                                        .font(.caption)
                                        .foregroundColor(.green.opacity(0.8))
                                    
                                    Text(viewModel.monthlySavings.formatted(.currency(code: "USD")))
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .frame(height: 55)
                        }
                    }
                    .padding(.horizontal, 12)
                    
                    // AI Assistant Section
                    CardView {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("AI Assistant", systemImage: "sparkles")
                                .font(.subheadline)
                                .foregroundColor(.white)
                            
                            // Quick Actions
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(InsightType.allCases, id: \.self) { type in
                                        InsightButton(
                                            title: type.rawValue,
                                            systemImage: iconFor(type),
                                            isSelected: selectedInsightType == type
                                        ) {
                                            selectedInsightType = type
                                        }
                                    }
                                }
                            }
                            
                            // Chat Display Area
                            ScrollView {
                                VStack(spacing: 8) {
                                    // Example chat messages
                                    ChatBubble(message: "How can I help you with your finances today?", isUser: false)
                                }
                            }
                            .frame(maxHeight: 150)
                            
                            // Chat input
                            HStack(spacing: 8) {
                                TextField("Ask about your finances...", text: $chatMessage)
                                    .textFieldStyle(CustomTextFieldStyle())
                                    .font(.footnote)
                                
                                Button(action: {
                                    // Send message action
                                }) {
                                    Image(systemName: "arrow.up.circle.fill")
                                        .font(.title3)
                                        .foregroundColor(Color(hex: "3B82F6"))
                                }
                            }
                        }
                        .padding(10)
                    }
                    .padding(.horizontal, 12)
                    
                    // AI Financial Insights Section
                    CardView {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("AI Financial Insights", systemImage: "chart.bar.fill")
                                .font(.subheadline)
                                .foregroundColor(.white)
                            
                            if !viewModel.aiInsights.isEmpty {
                                ForEach(viewModel.aiInsights) { insight in
                                    InsightCard(insight: insight)
                                        .transition(.opacity)
                                }
                            }
                        }
                        .padding(10)
                    }
                    .padding(.horizontal, 12)
                }
                .padding(.vertical, 12)
            }
        }
        .navigationTitle("Dashboard")
        .task {
            await viewModel.fetchDashboardData()
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

struct ChatBubble: View {
    let message: String
    let isUser: Bool
    
    var body: some View {
        HStack {
            if isUser { Spacer() }
            
            Text(message)
                .font(.footnote)
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
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
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