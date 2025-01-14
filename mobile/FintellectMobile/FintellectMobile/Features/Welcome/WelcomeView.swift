import SwiftUI

struct WelcomeView: View {
    @Binding var hasSeenWelcome: Bool
    @State private var currentPage = 0
    @State private var animateBackground = false
    
    let pages = [
        WelcomePage(
            title: "Welcome to Fintellect",
            subtitle: "AI-Powered Financial Intelligence",
            description: "Transform your finances with advanced AI insights and personalized recommendations.",
            imageName: "chart.xyaxis.line"
        ),
        WelcomePage(
            title: "Smart Budgeting",
            subtitle: "Take Control of Your Money",
            description: "Track expenses, set budgets, and receive AI-driven suggestions to optimize your spending.",
            imageName: "dollarsign.circle"
        ),
        WelcomePage(
            title: "Secure Integration",
            subtitle: "Bank-Grade Security",
            description: "Connect your accounts securely through Plaid with enterprise-level encryption.",
            imageName: "lock.shield"
        )
    ]
    
    var body: some View {
        ZStack {
            // Animated gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "4169E1").opacity(0.8),
                    Color(hex: "1E40AF").opacity(0.9)
                ]),
                startPoint: animateBackground ? .topLeading : .bottomTrailing,
                endPoint: animateBackground ? .bottomTrailing : .topLeading
            )
            .ignoresSafeArea()
            .animation(.easeInOut(duration: 3.0).repeatForever(autoreverses: true), value: animateBackground)
            
            // Floating particles effect
            ForEach(0..<15) { index in
                Circle()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: CGFloat.random(in: 4...12))
                    .offset(x: CGFloat.random(in: -200...200),
                            y: CGFloat.random(in: -400...400))
                    .animation(
                        Animation.linear(duration: Double.random(in: 5...10))
                            .repeatForever()
                            .delay(Double.random(in: 0...3)),
                        value: animateBackground
                    )
            }
            
            VStack(spacing: 0) {
                // Page content
                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        WelcomePageView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))
                .indexViewStyle(.page(backgroundDisplayMode: .interactive))
                
                // Bottom buttons
                VStack(spacing: 16) {
                    Button(action: {
                        withAnimation {
                            hasSeenWelcome = true
                        }
                    }) {
                        Text("Get Started")
                            .fontWeight(.semibold)
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
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: 25) {
            Spacer()
            
            Image(systemName: page.imageName)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 100, height: 100)
                .foregroundColor(.white)
                .opacity(appear ? 1 : 0)
                .scaleEffect(appear ? 1 : 0.5)
                .animation(.spring(duration: 0.7).delay(0.2), value: appear)
            
            VStack(spacing: 12) {
                Text(page.title)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .opacity(appear ? 1 : 0)
                    .offset(y: appear ? 0 : 20)
                    .animation(.spring(duration: 0.7).delay(0.3), value: appear)
                
                Text(page.subtitle)
                    .font(.title3)
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