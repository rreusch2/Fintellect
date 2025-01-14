import SwiftUI

struct InsightsView: View {
    let insights: [AIInsight]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("AI Insights")
                .font(.headline)
            
            ForEach(insights) { insight in
                InsightCard(insight: insight)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct InsightCard: View {
    let insight: AIInsight
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(insight.title)
                .font(.subheadline)
                .fontWeight(.semibold)
            
            Text(insight.description)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(3)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
}

#Preview {
    InsightsView(insights: [
        AIInsight(type: "tip", title: "Sample Insight", description: "This is a sample AI insight about your finances.")
    ])
} 