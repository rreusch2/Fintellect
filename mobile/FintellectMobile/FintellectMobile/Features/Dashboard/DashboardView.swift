import SwiftUI
import Charts
import Foundation
import Models

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
                AIDashboardAssistant()
                    .padding(.horizontal)
                SpendingDistributionSection(
                    monthlySpending: viewModel.monthlySpending,
                    categories: viewModel.spendingCategories
                )
                AIInsightsSection(insights: viewModel.aiInsights)
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

// MARK: - Button Style
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