import SwiftUI

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