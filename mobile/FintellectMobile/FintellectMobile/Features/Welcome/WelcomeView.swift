import SwiftUI

struct WelcomeView: View {
    @Binding var hasSeenWelcome: Bool
    @State private var currentPage = 0
    @State private var animateBackground = false
    
    let pages = [
        WelcomePage(
            title: "Fintellect",
            subtitle: "Transform Your Finances",
            description: "Experience intelligent financial management powered by advanced AI. Get personalized insights, smart budgeting, and secure bank integration through Plaid.",
            imageName: "chart.line.uptrend.xyaxis"
        ),
        WelcomePage(
            title: "AI-Powered Analysis",
            subtitle: "Real-Time Insights",
            description: "Get personalized financial guidance and AI-driven recommendations tailored to your spending patterns.",
            imageName: "brain.head.profile"
        ),
        WelcomePage(
            title: "Bank-Grade Security",
            subtitle: "Your Data is Protected",
            description: "Connect your accounts securely through Plaid with enterprise-level encryption and strict data protection.",
            imageName: "lock.shield"
        )
    ]
    
    var body: some View {
        ZStack {
            // Enhanced gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "4169E1"),
                    Color(hex: "1E40AF")
                ]),
                startPoint: animateBackground ? .topLeading : .bottomTrailing,
                endPoint: animateBackground ? .bottomTrailing : .topLeading
            )
            .ignoresSafeArea()
            
            // Grid overlay
            Image(systemName: "grid")
                .resizable(resizingMode: .tile)
                .foregroundColor(.white.opacity(0.05))
                .ignoresSafeArea()
            
            // Animated orbs
            Circle()
                .fill(Color.white.opacity(0.1))
                .frame(width: 300, height: 300)
                .blur(radius: 50)
                .offset(x: animateBackground ? 50 : -50, y: animateBackground ? -100 : 100)
                .animation(.easeInOut(duration: 7).repeatForever(autoreverses: true), value: animateBackground)
            
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 200, height: 200)
                .blur(radius: 40)
                .offset(x: animateBackground ? -100 : 100, y: animateBackground ? 50 : -50)
                .animation(.easeInOut(duration: 5).repeatForever(autoreverses: true), value: animateBackground)
            
            VStack(spacing: 0) {
                // Page content
                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        WelcomePageView(page: pages[index], isFirstPage: index == 0)
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))
                .indexViewStyle(.page(backgroundDisplayMode: .interactive))
                
                // Bottom buttons
                VStack(spacing: 16) {
                    Button(action: {
                        withAnimation(.spring()) {
                            hasSeenWelcome = true
                        }
                    }) {
                        HStack {
                            Text("Get Started")
                                .fontWeight(.semibold)
                            Image(systemName: "arrow.right")
                        }
                        .foregroundColor(Color(hex: "4169E1"))
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .shadow(color: Color.black.opacity(0.1), radius: 5)
                    }
                    .padding(.horizontal, 40)
                    
                    if currentPage < pages.count - 1 {
                        Button(action: {
                            withAnimation {
                                currentPage += 1
                            }
                        }) {
                            Text("Next")
                                .fontWeight(.medium)
                                .foregroundColor(.white.opacity(0.9))
                        }
                    }
                }
                .padding(.bottom, 50)
            }
        }
        .onAppear {
            animateBackground = true
        }
    }
}

struct WelcomePage {
    let title: String
    let subtitle: String
    let description: String
    let imageName: String
}

struct WelcomePageView: View {
    let page: WelcomePage
    let isFirstPage: Bool
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: 25) {
            Spacer()
            
            if isFirstPage {
                // Special styling for first page (Fintellect logo)
                VStack(spacing: 8) {
                    Text(page.title)
                        .font(.system(size: 56, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color(hex: "60A5FA"),
                                    Color(hex: "3B82F6")
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .shadow(color: Color(hex: "60A5FA").opacity(0.3), radius: 15, x: 0, y: 0)
                    
                    VStack(spacing: 4) {
                        HStack(spacing: 8) {
                            Image(systemName: "sparkles")
                                .foregroundColor(.white.opacity(0.9))
                            Text("Powered by Advanced AI")
                                .foregroundColor(.white.opacity(0.9))
                                .font(.system(size: 14))
                        }
                        
                        Text("BETA")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                    }
                }
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 20)
                .animation(.spring(duration: 0.7).delay(0.2), value: appear)
            } else {
                // Regular page icon
                Image(systemName: page.imageName)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 80, height: 80)
                    .foregroundColor(.white)
                    .opacity(appear ? 1 : 0)
                    .scaleEffect(appear ? 1 : 0.5)
                    .animation(.spring(duration: 0.7).delay(0.2), value: appear)
            }
            
            VStack(spacing: 12) {
                if !isFirstPage {
                    Text(page.title)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                
                Text(page.subtitle)
                    .font(.title2)
                    .fontWeight(.medium)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .opacity(appear ? 1 : 0)
                    .offset(y: appear ? 0 : 20)
                    .animation(.spring(duration: 0.7).delay(0.4), value: appear)
                
                Text(page.description)
                    .font(.body)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                    .opacity(appear ? 1 : 0)
                    .offset(y: appear ? 0 : 20)
                    .animation(.spring(duration: 0.7).delay(0.5), value: appear)
            }
            
            Spacer()
            Spacer()
        }
        .onAppear {
            appear = true
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
    WelcomeView(hasSeenWelcome: .constant(false))
} 