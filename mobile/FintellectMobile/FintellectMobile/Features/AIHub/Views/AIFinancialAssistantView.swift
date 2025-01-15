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
                            color: Color(hex: "3B82F6")
                        )
                        
                        WorkflowCard(
                            title: "Smart Savings Detective",
                            description: "Discover hidden savings opportunities.",
                            icon: "magnifyingglass.circle",
                            color: Color(hex: "8B5CF6")
                        )
                        
                        WorkflowCard(
                            title: "Financial Goal Accelerator",
                            description: "Create a personalized strategy to reach your goals faster.",
                            icon: "arrow.up.forward.circle",
                            color: Color(hex: "10B981")
                        )
                        
                        WorkflowCard(
                            title: "Lifestyle Financial Optimizer",
                            description: "Find opportunities to optimize your lifestyle spending.",
                            icon: "gearshape.circle",
                            color: Color(hex: "F59E0B")
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
                            progress: 0.0
                        )
                        
                        LearningModuleCard(
                            title: "Advanced Tax Strategies",
                            description: "Optimize your tax situation with advanced planning techniques.",
                            duration: "45 min",
                            level: "Advanced",
                            progress: 0.0
                        )
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 24)
        }
        .background(Color(hex: "0F172A"))
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

// MARK: - Supporting Views
struct WorkflowCard: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    
    var body: some View {
        Button(action: {}) {
            VStack(alignment: .leading, spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
                
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(hex: "1E293B"))
            )
        }
    }
}

struct InsightCard: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
                .frame(width: 48, height: 48)
                .background(color.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .lineLimit(2)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
        )
    }
}

struct LearningModuleCard: View {
    let title: String
    let description: String
    let duration: String
    let level: String
    let progress: Double
    
    var levelColor: Color {
        switch level.lowercased() {
        case "beginner": return Color(hex: "22C55E")
        case "intermediate": return Color(hex: "F59E0B")
        case "advanced": return Color(hex: "EF4444")
        default: return Color(hex: "94A3B8")
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .lineLimit(2)
            }
            
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.caption)
                    Text(duration)
                        .font(.caption)
                }
                .foregroundColor(Color(hex: "94A3B8"))
                
                Spacer()
                
                Text(level)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(levelColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(levelColor.opacity(0.2))
                    )
            }
            
            Button(action: {}) {
                Text("Start Learning")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(hex: "3B82F6"))
                    )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
        )
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantView()
    }
    .preferredColorScheme(.dark)
} 