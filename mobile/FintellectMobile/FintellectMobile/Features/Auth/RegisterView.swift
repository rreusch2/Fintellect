import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authViewModel: AuthViewModel
    
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var appear = [false, false, false]
    @State private var animateBackground = false
    
    private var isFormValid: Bool {
        !firstName.isEmpty &&
        !lastName.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        !confirmPassword.isEmpty &&
        password == confirmPassword &&
        email.contains("@") &&
        password.count >= 8
    }
    
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
                            dismiss()
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 20, weight: .medium))
                                Text("Back to Login")
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
                    
                    // Title
                    VStack(spacing: 8) {
                        Text("Create Account")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Join Fintellect and take control of your finances")
                            .font(.subheadline)
                            .foregroundColor(Color(hex: "94A3B8"))
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)
                    .opacity(appear[1] ? 1 : 0)
                    .offset(y: appear[1] ? 0 : 20)
                    
                    // Form Fields
                    VStack(spacing: 16) {
                        CustomTextField(text: $firstName, placeholder: "First Name", systemImage: "person")
                        CustomTextField(text: $lastName, placeholder: "Last Name", systemImage: "person")
                        CustomTextField(text: $email, placeholder: "Email", systemImage: "envelope")
                        CustomTextField(text: $password, placeholder: "Password", systemImage: "lock", isSecure: true)
                        CustomTextField(text: $confirmPassword, placeholder: "Confirm Password", systemImage: "lock.shield", isSecure: true)
                    }
                    .frame(maxWidth: min(UIScreen.main.bounds.width - 60, 360))
                    .padding(.horizontal, 20)
                    .padding(.top, 32)
                    .opacity(appear[2] ? 1 : 0)
                    .offset(y: appear[2] ? 0 : 20)
                    
                    // Error Message
                    if let error = authViewModel.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .opacity(appear[2] ? 1 : 0)
                    }
                    
                    // Create Account Button
                    Button(action: {
                        Task {
                            // Will implement registration later
                            // await authViewModel.register(firstName: firstName, lastName: lastName, email: email, password: password)
                        }
                    }) {
                        HStack {
                            if authViewModel.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Create Account")
                                    .font(.headline)
                            }
                        }
                        .frame(maxWidth: min(UIScreen.main.bounds.width - 60, 360))
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: isFormValid ? 
                                    [Color(hex: "3B82F6"), Color(hex: "2563EB")] :
                                    [Color(hex: "64748B"), Color(hex: "475569")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(14)
                        .shadow(color: (isFormValid ? Color(hex: "3B82F6") : Color(hex: "64748B")).opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .disabled(!isFormValid || authViewModel.isLoading)
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 20)
                    .opacity(appear[2] ? 1 : 0)
                    .offset(y: appear[2] ? 0 : 20)
                    
                    // Form Requirements
                    VStack(alignment: .leading, spacing: 8) {
                        RequirementRow(text: "Password must be at least 8 characters", isMet: password.count >= 8)
                        RequirementRow(text: "Passwords must match", isMet: !confirmPassword.isEmpty && password == confirmPassword)
                        RequirementRow(text: "Valid email address required", isMet: email.contains("@"))
                    }
                    .padding(.horizontal, 20)
                    .opacity(appear[2] ? 1 : 0)
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

struct RequirementRow: View {
    let text: String
    let isMet: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: isMet ? "checkmark.circle.fill" : "circle")
                .foregroundColor(isMet ? Color(hex: "22C55E") : Color(hex: "64748B"))
            
            Text(text)
                .font(.caption)
                .foregroundColor(isMet ? Color(hex: "22C55E") : Color(hex: "64748B"))
        }
    }
}

#Preview {
    RegisterView()
        .environmentObject(AuthViewModel())
} 