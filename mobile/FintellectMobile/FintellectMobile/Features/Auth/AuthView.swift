import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Binding var hasSeenWelcome: Bool
    @State private var username = ""
    @State private var password = ""
    @State private var isRegistering = false
    @State private var appear = [false, false, false]
    @State private var animateBackground = false
    
    var body: some View {
        ZStack {
            // Background gradient with animated orbs
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "1E293B"),  // Dark blue
                    Color(hex: "0F172A"),  // Darker blue
                    Color(hex: "020617")   // Almost black
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
                                Color(hex: "3B82F6").opacity(0.2),
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
                                Color(hex: "60A5FA").opacity(0.15),
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
            }
            
            ScrollView {
                VStack(spacing: 24) {
                    // Back Button
                    HStack {
                        Button(action: {
                            withAnimation(.spring()) {
                                hasSeenWelcome = false
                            }
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 20, weight: .medium))
                                Text("Back")
                                    .font(.system(size: 17, weight: .regular))
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color(hex: "3B82F6").opacity(0.2))
                            .clipShape(Capsule())
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .opacity(appear[0] ? 1 : 0)
                    .offset(y: appear[0] ? 0 : 20)
                    
                    // Logo and Title
                    VStack(spacing: 20) {
                        // Modern abstract logo
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            Color(hex: "3B82F6"),
                                            Color(hex: "60A5FA")
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 80, height: 80)
                                .shadow(color: Color(hex: "3B82F6").opacity(0.3), radius: 15)
                            
                            Image(systemName: "sparkles")
                                .font(.system(size: 32))
                                .foregroundColor(.white)
                        }
                        .scaleEffect(appear[1] ? 1 : 0.5)
                        
                        Text("Fintellect")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(.white)
                            .opacity(appear[1] ? 1 : 0)
                            .offset(y: appear[1] ? 0 : 20)
                    }
                    .padding(.top, 20)
                    
                    // Form Fields
                    VStack(spacing: 16) {
                        CustomTextField(text: $username, placeholder: "Username", systemImage: "person")
                            .frame(maxWidth: min(UIScreen.main.bounds.width - 60, 360))
                            .opacity(appear[2] ? 1 : 0)
                            .offset(y: appear[2] ? 0 : 20)
                        
                        CustomTextField(text: $password, placeholder: "Password", systemImage: "lock", isSecure: true)
                            .frame(maxWidth: min(UIScreen.main.bounds.width - 60, 360))
                            .opacity(appear[2] ? 1 : 0)
                            .offset(y: appear[2] ? 0 : 20)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 32)
                    
                    // Error Message
                    if let error = authViewModel.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .opacity(appear[2] ? 1 : 0)
                    }
                    
                    // Buttons
                    VStack(spacing: 16) {
                        Button(action: {
                            Task {
                                await authViewModel.login(username: username, password: password)
                            }
                        }) {
                            HStack {
                                if authViewModel.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text("Sign In")
                                        .font(.headline)
                                }
                            }
                            .frame(maxWidth: min(UIScreen.main.bounds.width - 60, 360))
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [Color(hex: "3B82F6"), Color(hex: "2563EB")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(14)
                            .shadow(color: Color(hex: "3B82F6").opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                        .frame(maxWidth: .infinity)
                        
                        Button(action: {
                            authViewModel.loginAsDemoUser()
                        }) {
                            Text("Login as Demo User")
                                .font(.headline)
                                .frame(maxWidth: min(UIScreen.main.bounds.width - 60, 360))
                                .padding(.vertical, 16)
                                .background(Color(hex: "22C55E"))
                                .foregroundColor(.white)
                                .cornerRadius(14)
                                .shadow(color: Color(hex: "22C55E").opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                        .frame(maxWidth: .infinity)
                        
                        Button(action: { isRegistering.toggle() }) {
                            Text(isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "60A5FA"))
                        }
                        .padding(.top, 8)
                    }
                    .padding(.horizontal, 20)
                    .opacity(appear[2] ? 1 : 0)
                    .offset(y: appear[2] ? 0 : 20)
                }
                .padding(.vertical, 20)
            }
        }
        .onAppear {
            animateBackground = true
            withAnimation(.easeOut(duration: 0.3)) {
                appear[0] = true
            }
            withAnimation(.easeOut(duration: 0.3).delay(0.1)) {
                appear[1] = true
            }
            withAnimation(.easeOut(duration: 0.3).delay(0.2)) {
                appear[2] = true
            }
        }
    }
}

struct CustomTextField: View {
    @Binding var text: String
    let placeholder: String
    let systemImage: String
    var isSecure: Bool = false
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .foregroundColor(Color(hex: "64748B"))
                .frame(width: 24)
            
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .padding()
        .background(Color(hex: "1E293B"))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: "3B82F6").opacity(0.2), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 2)
    }
}

#Preview {
    AuthView(hasSeenWelcome: .constant(true))
        .environmentObject(AuthViewModel())
} 