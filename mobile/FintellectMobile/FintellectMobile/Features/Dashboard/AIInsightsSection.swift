import SwiftUI
@_exported import FintellectMobile.AIInsightModels

struct AIInsight: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let type: InsightType
    let timestamp: Date
    
    enum InsightType {
        case spending
        case saving
        case budget
        case subscription
    }
}

struct AIInsightsSection: View {
    @StateObject private var viewModel = AIInsightsViewModel()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Label("AI Financial Insights", systemImage: "chart.bar.fill")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }
            
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else if !viewModel.insights.isEmpty {
                ForEach(viewModel.insights) { insight in
                    InsightCard(insight: insight)
                }
            } else {
                Text("No insights available")
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity)
                    .padding()
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(hex: "0F172A"))
                .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
        )
        .padding(.horizontal, 16)
        .task {
            await viewModel.fetchInsights()
        }
    }
}

struct InsightCard: View {
    let insight: AIInsight
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: insight.type.iconName)
                    .foregroundColor(Color(hex: insight.type.color))
                Text(insight.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            
            Text(insight.description)
                .font(.caption)
                .foregroundColor(.gray)
                .lineLimit(3)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "1E293B"))
        .cornerRadius(12)
    }
}

@MainActor
class AIInsightsViewModel: ObservableObject {
    @Published var insights: [AIInsight] = []
    @Published var isLoading = false
    
    private let aiService: AIServiceClient
    
    init(aiService: AIServiceClient = AIServiceClient()) {
        self.aiService = aiService
    }
    
    func fetchInsights() async {
        isLoading = true
        
        do {
            let dashboardInsights = try await aiService.getDashboardInsights()
            insights = dashboardInsights.map { insight in
                AIInsight(
                    title: insight.title,
                    description: insight.description,
                    type: mapInsightType(from: insight.type),
                    timestamp: Date()
                )
            }
        } catch {
            print("Error fetching insights:", error)
            insights = []
        }
        
        isLoading = false
    }
    
    private func mapInsightType(from type: String) -> AIInsight.InsightType {
        switch type.lowercased() {
        case "spending": return .spending
        case "saving": return .saving
        case "budget": return .budget
        case "subscription": return .subscription
        default: return .spending
        }
    }
}

#Preview {
    AIInsightsSection()
} 