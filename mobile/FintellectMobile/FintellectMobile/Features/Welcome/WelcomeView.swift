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
            // Base gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "3B82F6"),  // Bright blue
                    Color(hex: "1E40AF"),  // Royal blue
                    Color(hex: "1E3A8A")   // Deep blue
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Animated background elements
            ZStack {
                // Large primary orb
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                Color(hex: "60A5FA").opacity(0.3),
                                Color(hex: "3B82F6").opacity(0)
                            ]),
                            center: .center,
                            startRadius: 100,
                            endRadius: 300
                        )
                    )
                    .frame(width: 600, height: 600)
                    .blur(radius: 60)
                    .offset(x: animateBackground ? 100 : -100, y: animateBackground ? -50 : 50)
                    .animation(.easeInOut(duration: 8).repeatForever(autoreverses: true), value: animateBackground)
                
                // Secondary floating orb
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                Color(hex: "93C5FD").opacity(0.2),
                                Color(hex: "60A5FA").opacity(0)
                            ]),
                            center: .center,
                            startRadius: 50,
                            endRadius: 200
                        )
                    )
                    .frame(width: 400, height: 400)
                    .blur(radius: 45)
                    .offset(x: animateBackground ? -130 : 130, y: animateBackground ? 100 : -100)
                    .animation(.easeInOut(duration: 10).repeatForever(autoreverses: true), value: animateBackground)
                
                // Accent orbs
                ForEach(0..<3) { index in
                    Circle()
                        .fill(Color(hex: "60A5FA").opacity(0.1))
                        .frame(width: 200, height: 200)
                        .blur(radius: 30)
                        .offset(
                            x: animateBackground ? 
                                CGFloat(sin(Double(index) * .pi * 2/3) * 150) : 
                                CGFloat(cos(Double(index) * .pi * 2/3) * 150),
                            y: animateBackground ? 
                                CGFloat(cos(Double(index) * .pi * 2/3) * 150) : 
                                CGFloat(sin(Double(index) * .pi * 2/3) * 150)
                        )
                        .animation(
                            .easeInOut(duration: Double(7 + index))
                                .repeatForever(autoreverses: true),
                            value: animateBackground
                        )
                }
            }
            
            // Content overlay
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
                VStack(spacing: 20) {
                    Button(action: {
                        withAnimation(.spring()) {
                            hasSeenWelcome = true
                        }
                    }) {
                        HStack(spacing: 12) {
                            Text("Get Started")
                                .font(.headline)
                                .fontWeight(.semibold)
                            Image(systemName: "arrow.right")
                        }
                        .foregroundColor(Color(hex: "1E40AF"))
                        .frame(width: 220)
                        .padding(.vertical, 16)
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .shadow(
                            color: Color.black.opacity(0.15),
                            radius: 12,
                            x: 0,
                            y: 5
                        )
                    }
                    
                    if currentPage < pages.count - 1 {
                        Button(action: {
                            withAnimation {
                                currentPage += 1
                            }
                        }) {
                            Text("Next")
                                .font(.headline)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                                .frame(width: 120)
                                .padding(.vertical, 12)
                                .background(
                                    Color(hex: "1E40AF").opacity(0.3)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.3), lineWidth: 1)
                                )
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
                        .font(.system(size: 64, weight: .bold))
                        .foregroundColor(.white)
                        .shadow(color: Color(hex: "3B82F6").opacity(0.5), radius: 20, x: 0, y: 0)
                    
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
                    .font(.system(size: 16))
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 8)
                    .opacity(appear ? 1 : 0)
                    .offset(y: appear ? 0 : 20)
                    .animation(.spring(duration: 0.7).delay(0.5), value: appear)
            }
            
            Spacer()
            Spacer()
                .frame(height: 30)
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

@main
struct FintellectMobileApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    @AppStorage("hasSeenWelcome") private var hasSeenWelcome = false
    
    var body: some Scene {
        WindowGroup {
            if hasSeenWelcome {
                AuthView(hasSeenWelcome: $hasSeenWelcome)
                    .environmentObject(authViewModel)
            } else {
                WelcomeView(hasSeenWelcome: $hasSeenWelcome)
            }
        }
    }
}

#Preview {
    WelcomeView(hasSeenWelcome: .constant(false))
} 