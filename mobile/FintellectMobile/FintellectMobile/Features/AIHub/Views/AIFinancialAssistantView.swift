import SwiftUI

struct AIFinancialAssistantView: View {
    @StateObject private var viewModel = FinancialDNAProfileViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Premium Badge
                HStack {
                    Image(systemName: "crown.fill")
                        .foregroundColor(Color(hex: "F59E0B"))
                    Text("Premium AI Assistant")
                        .font(.headline)
                        .foregroundColor(Color(hex: "F59E0B"))
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "F59E0B").opacity(0.2))
                )
                
                // Smart AI Workflows Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Smart AI Workflows")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 16),
                        GridItem(.flexible(), spacing: 16)
                    ], spacing: 16) {
                        WorkflowCard(
                            title: "Financial Health Scan",
                            description: "Get a comprehensive analysis of your financial health.",
                            icon: "chart.bar.doc.horizontal",
                            color: Color(hex: "3B82F6"),
                            action: { /* TODO: Implement workflow */ }
                        )
                        
                        WorkflowCard(
                            title: "Smart Savings Detective",
                            description: "Discover hidden savings opportunities.",
                            icon: "magnifyingglass.circle",
                            color: Color(hex: "8B5CF6"),
                            action: { /* TODO: Implement workflow */ }
                        )
                        
                        WorkflowCard(
                            title: "Financial Goal Accelerator",
                            description: "Create a personalized strategy to reach your goals faster.",
                            icon: "arrow.up.forward.circle",
                            color: Color(hex: "10B981"),
                            action: { /* TODO: Implement workflow */ }
                        )
                        
                        WorkflowCard(
                            title: "Lifestyle Financial Optimizer",
                            description: "Find opportunities to optimize your lifestyle spending.",
                            icon: "gearshape.circle",
                            color: Color(hex: "F59E0B"),
                            action: { /* TODO: Implement workflow */ }
                        )
                    }
                }
                .padding(.horizontal)
                
                // Proactive Insights Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Proactive Insights")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    VStack(spacing: 16) {
                        InsightCard(
                            title: "Unusual Spending Detected",
                            description: "Your entertainment spending is 45% higher than your monthly average.",
                            icon: "exclamationmark.triangle",
                            color: Color(hex: "F59E0B")
                        )
                        
                        InsightCard(
                            title: "Savings Opportunity",
                            description: "You could save $25/month by switching to a different streaming service.",
                            icon: "leaf",
                            color: Color(hex: "10B981")
                        )
                    }
                }
                .padding(.horizontal)
                
                // Learning Hub Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Learning Hub")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    VStack(spacing: 16) {
                        LearningModuleCard(
                            title: "Investment Basics",
                            description: "Learn the fundamentals of investing and portfolio management.",
                            duration: "30 min",
                            level: "Beginner",
                            progress: 0.0,
                            action: { /* TODO: Implement learning module */ }
                        )
                        
                        LearningModuleCard(
                            title: "Advanced Tax Strategies",
                            description: "Optimize your tax situation with advanced planning techniques.",
                            duration: "45 min",
                            level: "Advanced",
                            progress: 0.0,
                            action: { /* TODO: Implement learning module */ }
                        )
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationTitle("AI Assistant")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { viewModel.showForm = true }) {
                    Image(systemName: "person.text.rectangle")
                        .foregroundColor(Color(hex: "3B82F6"))
                }
            }
        }
        .sheet(isPresented: $viewModel.showForm) {
            FinancialDNAProfileForm(viewModel: viewModel)
        }
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantView()
    }
    .preferredColorScheme(.dark)
} 