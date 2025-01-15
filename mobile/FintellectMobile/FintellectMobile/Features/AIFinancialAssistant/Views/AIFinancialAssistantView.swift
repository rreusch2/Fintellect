import SwiftUI

struct AIFinancialAssistantView: View {
    @StateObject private var viewModel = AIFinancialAssistantViewModel()
    
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
                
                // Main AI Assistant Interface
                VStack(spacing: 20) {
                    // Title Section
                    VStack(spacing: 8) {
                        Text("AI Financial Assistant")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Your personal AI-powered financial advisor")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "94A3B8"))
                    }
                    .padding(.top, 8)
                    
                    // Smart AI Workflows Section
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "wand.and.stars")
                                .foregroundColor(Color(hex: "3B82F6"))
                            Text("Smart AI Workflows")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        
                        Text("Powerful automated workflows to analyze and optimize your finances")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            ForEach(viewModel.workflows) { workflow in
                                SmartWorkflowButton(workflow: workflow) {
                                    viewModel.startWorkflow(workflow)
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    Divider()
                        .background(Color(hex: "334155"))
                        .padding(.vertical, 8)
                    
                    // Chat Interface
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "message.and.waveform")
                                .foregroundColor(Color(hex: "3B82F6"))
                            Text("AI Chat Assistant")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        
                        if viewModel.chatMessages.isEmpty {
                            EmptyChatState()
                        } else {
                            ScrollView {
                                LazyVStack(spacing: 16) {
                                    ForEach(viewModel.chatMessages) { message in
                                        PremiumChatBubble(message: message)
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
                        }
                        .frame(height: 300)
                        .background(Color(hex: "0F172A"))
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    // Chat Input
                    HStack(spacing: 12) {
                        TextField("Ask anything about your finances...", text: $viewModel.currentMessage)
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
                .padding(.vertical)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "1E293B"))
                        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 6)
                )
                .padding(.horizontal)
                
                // Proactive Insights Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(Color(hex: "3B82F6"))
                        Text("Proactive Insights")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal)
                    
                    ForEach(viewModel.proactiveInsights) { insight in
                        PremiumInsightCard(insight: insight)
                    }
                }
                .padding(.horizontal)
                
                // Learning Hub
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "book.fill")
                            .foregroundColor(Color(hex: "3B82F6"))
                        Text("Learning Hub")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal)
                    
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

// MARK: - Empty Chat State
struct EmptyChatState: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "message.and.waveform.fill")
                .font(.system(size: 40))
                .foregroundColor(Color(hex: "3B82F6").opacity(0.3))
            
            Text("Start Your AI Journey")
                .font(.headline)
                .foregroundColor(.white)
            
            Text("Select a Smart AI Workflow above or ask any question about your finances")
                .font(.subheadline)
                .foregroundColor(Color(hex: "94A3B8"))
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Text("Examples:")
                .font(.caption)
                .foregroundColor(Color(hex: "64748B"))
                .padding(.top, 8)
            
            VStack(alignment: .leading, spacing: 8) {
                ForEach([
                    "How can I optimize my monthly budget?",
                    "Analyze my recent spending patterns",
                    "What's my projected savings this month?"
                ], id: \.self) { example in
                    Text("• \(example)")
                        .font(.caption)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
    }
}

// MARK: - Smart Workflow Button
struct SmartWorkflowButton: View {
    let workflow: AIWorkflow
    let action: () -> Void
    @State private var isPressed = false
    @State private var showFullDescription = false
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                // Icon
                Image(systemName: workflow.icon)
                    .font(.system(size: 20))
                    .foregroundColor(workflow.color)
                    .frame(width: 36, height: 36)
                    .background(workflow.color.opacity(0.2))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                
                // Title and Description
                VStack(alignment: .leading, spacing: 4) {
                    Text(workflow.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    Text(workflow.description)
                        .font(.caption)
                        .foregroundColor(Color(hex: "94A3B8"))
                        .lineLimit(showFullDescription ? nil : 2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(hex: "0F172A"))
                    .shadow(color: workflow.color.opacity(0.2), radius: 8, x: 0, y: 4)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(workflow.color.opacity(0.3), lineWidth: 1)
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    withAnimation(.easeInOut(duration: 0.1)) {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    withAnimation(.easeInOut(duration: 0.1)) {
                        isPressed = false
                    }
                }
        )
        .onTapGesture {
            withAnimation {
                showFullDescription.toggle()
            }
        }
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantView()
    }
} 