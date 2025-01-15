import SwiftUI

struct AIFinancialAssistantView: View {
    @StateObject private var viewModel = AIFinancialAssistantViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Premium Badge
                HStack {
                    Image(systemName: "crown.fill")
                        .foregroundColor(Color(hex: "F59E0B"))
                    Text("Premium AI Assistant")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(Color(hex: "F59E0B"))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(hex: "F59E0B").opacity(0.2))
                .clipShape(Capsule())
                
                // AI Workflows Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Smart AI Workflows")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(viewModel.workflows) { workflow in
                            WorkflowCard(workflow: workflow) {
                                viewModel.startWorkflow(workflow)
                            }
                        }
                    }
                }
                .padding(.horizontal)
                
                // Proactive Insights
                VStack(alignment: .leading, spacing: 16) {
                    Text("Proactive Insights")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    ForEach(viewModel.proactiveInsights) { insight in
                        InsightCard(insight: insight)
                    }
                }
                .padding(.horizontal)
                
                // Enhanced Chat Interface
                VStack(spacing: 16) {
                    Text("AI Chat Assistant")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.chatMessages) { message in
                                ChatBubble(message: message)
                            }
                            
                            if viewModel.isTyping {
                                HStack {
                                    Text("AI is typing...")
                                        .font(.caption)
                                        .foregroundColor(Color(hex: "64748B"))
                                    Spacer()
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                    .frame(maxHeight: 300)
                    
                    // Chat Input
                    HStack(spacing: 12) {
                        TextField("Ask anything...", text: $viewModel.currentMessage)
                            .textFieldStyle(CustomTextFieldStyle())
                        
                        Button(action: {
                            guard !viewModel.currentMessage.isEmpty else { return }
                            viewModel.sendMessage(viewModel.currentMessage)
                        }) {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.title2)
                                .foregroundColor(Color(hex: "3B82F6"))
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Learning Hub
                VStack(alignment: .leading, spacing: 16) {
                    Text("Learning Hub")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    ForEach(viewModel.learningModules) { module in
                        LearningModuleCard(module: module)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationTitle("AI Assistant")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantView()
    }
} 