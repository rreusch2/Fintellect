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
                VStack(spacing: 16) {
                    // Financial Overview Cards
                    VStack(spacing: 12) {
                        // Balance Card
                        CardView {
                            VStack(alignment: .leading, spacing: 4) {
                                Label("Available Balance", systemImage: "creditcard.fill")
                                    .font(.footnote)
                                    .foregroundColor(.gray)
                                
                                Text(viewModel.totalBalance.formatted(.currency(code: "USD")))
                                    .font(.system(size: 28, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .frame(height: 80)
                        
                        // Monthly Overview
                        HStack(spacing: 12) {
                            // Spending Card
                            CardView {
                                VStack(alignment: .leading, spacing: 4) {
                                    Label("Spending", systemImage: "arrow.down.circle.fill")
                                        .font(.footnote)
                                        .foregroundColor(.red.opacity(0.8))
                                    
                                    Text(viewModel.monthlySpending.formatted(.currency(code: "USD")))
                                        .font(.system(size: 17, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .frame(height: 70)
                            
                            // Savings Card
                            CardView {
                                VStack(alignment: .leading, spacing: 4) {
                                    Label("Savings", systemImage: "arrow.up.circle.fill")
                                        .font(.footnote)
                                        .foregroundColor(.green.opacity(0.8))
                                    
                                    Text(viewModel.monthlySavings.formatted(.currency(code: "USD")))
                                        .font(.system(size: 17, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .frame(height: 70)
                        }
                    }
                    .padding(.horizontal)
                    
                    // AI Assistant Section
                    CardView {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("AI Assistant", systemImage: "sparkles")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            Text("Get personalized financial guidance through natural conversation")
                                .font(.caption)
                                .foregroundColor(.gray)
                            
                            // Insight Type Selector
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
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
                            
                            // Chat Section
                            VStack(spacing: 12) {
                                // Chat messages would go here
                                if !viewModel.aiInsights.isEmpty {
                                    ForEach(viewModel.aiInsights) { insight in
                                        InsightCard(insight: insight)
                                            .transition(.opacity)
                                    }
                                }
                                
                                // Chat input
                                HStack(spacing: 8) {
                                    TextField("Ask about your finances...", text: $chatMessage)
                                        .textFieldStyle(CustomTextFieldStyle())
                                        .font(.subheadline)
                                    
                                    Button(action: {
                                        // Send message action
                                    }) {
                                        Image(systemName: "arrow.up.circle.fill")
                                            .font(.title2)
                                            .foregroundColor(Color(hex: "3B82F6"))
                                    }
                                }
                            }
                            .padding(.top, 8)
                        }
                        .padding()
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
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

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
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