import SwiftUI

struct InsightsView: View {
    let insights: [AIInsight]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("AI Insights")
                .font(.headline)
                .foregroundColor(.white)
            
            ForEach(insights) { insight in
                InsightCard(insight: insight)
            }
        }
        .padding()
        .background(Color(hex: "1E293B"))
        .cornerRadius(12)
    }
}

#Preview {
    InsightsView(insights: AIInsight.demoInsights)
} 