import SwiftUI

struct BackgroundView: View {
    @State private var animateBackground = false
    
    var body: some View {
        ZStack {
            // Base gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "0F172A"),  // Dark blue base
                    Color(hex: "1E293B"),  // Mid blue
                    Color(hex: "0F172A")   // Dark blue again
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Animated orbs
            ZStack {
                // Primary orb
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                Color(hex: "3B82F6").opacity(0.15),
                                Color(hex: "1E40AF").opacity(0)
                            ]),
                            center: .center,
                            startRadius: 50,
                            endRadius: 250
                        )
                    )
                    .frame(width: 500, height: 500)
                    .blur(radius: 50)
                    .offset(x: animateBackground ? 100 : -100, y: animateBackground ? -50 : 50)
                    .animation(.easeInOut(duration: 7).repeatForever(autoreverses: true), value: animateBackground)
                
                // Secondary orb
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                Color(hex: "60A5FA").opacity(0.1),
                                Color(hex: "3B82F6").opacity(0)
                            ]),
                            center: .center,
                            startRadius: 50,
                            endRadius: 200
                        )
                    )
                    .frame(width: 400, height: 400)
                    .blur(radius: 45)
                    .offset(x: animateBackground ? -120 : 120, y: animateBackground ? 50 : -50)
                    .animation(.easeInOut(duration: 9).repeatForever(autoreverses: true), value: animateBackground)
                
                // Accent orb
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                Color(hex: "22C55E").opacity(0.1), // Success green
                                Color(hex: "22C55E").opacity(0)
                            ]),
                            center: .center,
                            startRadius: 50,
                            endRadius: 150
                        )
                    )
                    .frame(width: 300, height: 300)
                    .blur(radius: 40)
                    .offset(x: animateBackground ? 150 : -150, y: animateBackground ? -100 : 100)
                    .animation(.easeInOut(duration: 8).repeatForever(autoreverses: true), value: animateBackground)
            }
        }
        .onAppear {
            animateBackground = true
        }
    }
}

#Preview {
    BackgroundView()
} 