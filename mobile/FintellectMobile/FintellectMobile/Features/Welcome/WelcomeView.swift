import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showAuth = false
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "4169E1"), // Royal Blue like your web app
                    Color(hex: "1E40AF")  // Darker blue for depth
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Accent lines (similar to your web design)
            GeometryReader { geometry in
                Path { path in
                    path.move(to: CGPoint(x: 0, y: geometry.size.height * 0.3))
                    path.addLine(to: CGPoint(x: geometry.size.width * 0.2, y: geometry.size.height * 0.25))
                }
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                
                Path { path in
                    path.move(to: CGPoint(x: geometry.size.width, y: geometry.size.height * 0.7))
                    path.addLine(to: CGPoint(x: geometry.size.width * 0.8, y: geometry.size.height * 0.75))
                }
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
            }
            
            VStack(spacing: 30) {
                // Logo and title
                VStack(spacing: 15) {
                    Text("Fintellect")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.white)
                    
                    HStack(spacing: 8) {
                        Text("Powered by Advanced AI")
                            .foregroundColor(.white.opacity(0.9))
                        Text("BETA")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                    }
                }
                
                // Main text
                VStack(spacing: 20) {
                    Text("Transform Your Finances")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text("with AI-Powered Intelligence")
                        .font(.title2)
                        .foregroundColor(.white.opacity(0.9))
                    
                    Text("Experience intelligent financial management powered by advanced AI. Get personalized insights, smart budgeting, and secure bank integration through Plaid.")
                        .multilineTextAlignment(.center)
                        .foregroundColor(.white.opacity(0.8))
                        .padding(.horizontal)
                }
                
                // Get Started Button
                Button(action: { showAuth = true }) {
                    HStack {
                        Text("Get Started")
                            .fontWeight(.semibold)
                        Image(systemName: "arrow.right")
                    }
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.1), radius: 5)
                }
                .padding(.horizontal, 40)
                .padding(.top, 20)
            }
            .padding()
        }
        .fullScreenCover(isPresented: $showAuth) {
            AuthView()
        }
    }
}

// Helper for hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    WelcomeView()
        .environmentObject(AuthViewModel())
} 