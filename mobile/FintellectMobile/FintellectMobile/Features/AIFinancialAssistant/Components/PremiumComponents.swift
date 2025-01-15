import SwiftUI

// MARK: - Premium Card
struct PremiumCard<Content: View>: View {
    let content: Content
    var gradient: [Color] = [
        Color(hex: "1E293B"),
        Color(hex: "0F172A")
    ]
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(LinearGradient(
                        colors: gradient,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .shadow(color: Color.black.opacity(0.15), radius: 10, x: 0, y: 4)
            )
    }
}

// MARK: - Workflow Card
struct WorkflowCard: View {
    let workflow: AIWorkflow
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            PremiumCard {
                VStack(alignment: .leading, spacing: 12) {
                    // Icon and Title
                    HStack(spacing: 12) {
                        Image(systemName: workflow.icon)
                            .font(.system(size: 24))
                            .foregroundColor(workflow.color)
                            .frame(width: 48, height: 48)
                            .background(workflow.color.opacity(0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        
                        Text(workflow.title)
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    
                    // Description
                    Text(workflow.description)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }
            }
        }
    }
}

// MARK: - Premium Insight Card
struct PremiumInsightCard: View {
    let insight: ProactiveInsight
    
    private var iconName: String {
        switch insight.type {
        case .spending: return "creditcard.fill"
        case .saving: return "arrow.down.circle.fill"
        case .investment: return "chart.xyaxis.line"
        case .bill: return "doc.text.fill"
        }
    }
    
    private var iconColor: Color {
        switch insight.severity {
        case .info: return Color(hex: "3B82F6")
        case .warning: return Color(hex: "F59E0B")
        case .alert: return Color(hex: "EF4444")
        }
    }
    
    var body: some View {
        PremiumCard {
            HStack(spacing: 16) {
                Image(systemName: iconName)
                    .font(.system(size: 24))
                    .foregroundColor(iconColor)
                    .frame(width: 40, height: 40)
                    .background(iconColor.opacity(0.2))
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(insight.title)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text(insight.description)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                        .lineLimit(2)
                }
            }
        }
    }
}

// MARK: - Premium Chat Bubble
struct PremiumChatBubble: View {
    let message: PremiumChatMessage
    
    private var isUser: Bool {
        message.type == .user
    }
    
    var body: some View {
        HStack {
            if isUser { Spacer() }
            
            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.body)
                    .foregroundColor(isUser ? .white : Color(hex: "94A3B8"))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(isUser ? Color(hex: "3B82F6") : Color(hex: "1E293B"))
                    )
                
                if let attachments = message.attachments {
                    ForEach(attachments) { attachment in
                        // Placeholder for attachment views
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(hex: "1E293B"))
                            .frame(height: 100)
                            .overlay(
                                Text("Attachment: \(String(describing: attachment.type))")
                                    .foregroundColor(Color(hex: "94A3B8"))
                            )
                    }
                }
                
                Text(message.timestamp.formatted(.dateTime.hour().minute()))
                    .font(.caption2)
                    .foregroundColor(Color(hex: "64748B"))
            }
            
            if !isUser { Spacer() }
        }
        .padding(.horizontal)
    }
}

// MARK: - Learning Module Card
struct LearningModuleCard: View {
    let module: LearningModule
    
    private var difficultyColor: Color {
        switch module.difficulty {
        case .beginner: return Color(hex: "10B981")
        case .intermediate: return Color(hex: "F59E0B")
        case .advanced: return Color(hex: "EF4444")
        }
    }
    
    private var difficultyText: String {
        switch module.difficulty {
        case .beginner: return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced: return "Advanced"
        }
    }
    
    var body: some View {
        PremiumCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(module.title)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text(difficultyText)
                        .font(.caption)
                        .foregroundColor(difficultyColor)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(difficultyColor.opacity(0.2))
                        .clipShape(Capsule())
                }
                
                Text(module.description)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .lineLimit(2)
                
                HStack {
                    Image(systemName: "clock.fill")
                        .foregroundColor(Color(hex: "64748B"))
                    
                    Text("\(Int(module.duration / 60)) min")
                        .font(.caption)
                        .foregroundColor(Color(hex: "64748B"))
                    
                    Spacer()
                    
                    Button(action: {}) {
                        Text("Start Learning")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(hex: "3B82F6").opacity(0.2))
                            .clipShape(Capsule())
                    }
                }
            }
        }
    }
} 