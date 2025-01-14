import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedInsightType: InsightType = .spending
    
    enum InsightType: String, CaseIterable {
        case spending = "Analyze Spending"
        case budget = "Budget Help"
        case savings = "Savings Tips"
        case recurring = "Recurring Charges"
    }
    
    var body: some View {
        ZStack {
            // Background
            BackgroundView()
            
            ScrollView {
                VStack(spacing: 20) {
                    // Financial Overview Cards
                    VStack(spacing: 16) {
                        // Balance Card
                        CardView {
                            VStack(alignment: .leading, spacing: 8) {
                                Label("Available Balance", systemImage: "creditcard.fill")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                
                                Text(viewModel.totalBalance.formatted(.currency(code: "USD")))
                                    .font(.system(size: 34, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        
                        // Monthly Overview
                        HStack(spacing: 16) {
                            // Spending Card
                            CardView {
                                VStack(alignment: .leading, spacing: 8) {
                                    Label("Spending", systemImage: "arrow.down.circle.fill")
                                        .font(.subheadline)
                                        .foregroundColor(.red.opacity(0.8))
                                    
                                    Text(viewModel.monthlySpending.formatted(.currency(code: "USD")))
                                        .font(.headline)
                                        .foregroundColor(.white)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            
                            // Savings Card
                            CardView {
                                VStack(alignment: .leading, spacing: 8) {
                                    Label("Savings", systemImage: "arrow.up.circle.fill")
                                        .font(.subheadline)
                                        .foregroundColor(.green.opacity(0.8))
                                    
                                    Text(viewModel.monthlySavings.formatted(.currency(code: "USD")))
                                        .font(.headline)
                                        .foregroundColor(.white)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // AI Assistant Section
                    CardView {
                        VStack(alignment: .leading, spacing: 16) {
                            Label("AI Assistant", systemImage: "sparkles")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            Text("Get personalized financial guidance through natural conversation")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            // Insight Type Selector
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
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
                            
                            // AI Insights
                            if !viewModel.aiInsights.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    ForEach(viewModel.aiInsights) { insight in
                                        InsightCard(insight: insight)
                                    }
                                }
                            }
                        }
                        .padding()
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .refreshable {
                await viewModel.fetchDashboardData()
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

#Preview {
    NavigationView {
        DashboardView()
            .environmentObject(AuthViewModel())
    }
} 