import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Account Balance Card
                    BalanceCardView(balance: viewModel.totalBalance)
                    
                    // Monthly Overview
                    MonthlyOverviewView(
                        spending: viewModel.monthlySpending,
                        savings: viewModel.monthlySavings
                    )
                    
                    // Recent Transactions
                    RecentTransactionsView(transactions: viewModel.recentTransactions)
                    
                    // AI Insights
                    if !viewModel.aiInsights.isEmpty {
                        InsightsView(insights: viewModel.aiInsights)
                    }
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await viewModel.fetchDashboardData()
            }
            .task {
                await viewModel.fetchDashboardData()
            }
        }
    }
}

// Supporting Views
struct BalanceCardView: View {
    let balance: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Total Balance")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text(String(format: "$%.2f", balance))
                .font(.title)
                .fontWeight(.bold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct MonthlyOverviewView: View {
    let spending: Double
    let savings: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Monthly Overview")
                .font(.headline)
            
            HStack(spacing: 20) {
                StatView(title: "Spending", value: spending, color: .red)
                StatView(title: "Savings", value: savings, color: .green)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct StatView: View {
    let title: String
    let value: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text(String(format: "$%.2f", value))
                .font(.headline)
                .foregroundColor(color)
        }
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthViewModel())
} 