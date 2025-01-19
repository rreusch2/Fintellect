import SwiftUI

struct WorkflowButton: View {
    let workflow: AIWorkflow
    let action: () -> Void
    @State private var isPressed = false
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: workflow.icon)
                        .foregroundColor(workflow.color)
                    Text(workflow.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                }
                
                Text(workflow.description)
                    .font(.caption)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
            }
            .frame(width: 220)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: "1E293B"))
                    .opacity(isPressed ? 0.8 : 1)
            )
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
    }
} 