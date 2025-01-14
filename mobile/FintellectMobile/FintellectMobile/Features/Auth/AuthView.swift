import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var username = ""
    @State private var password = ""
    @State private var isRegistering = false
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            // Background Color
            Color(hex: "1E293B")
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                // Back Button in SafeArea
                HStack {
                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
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
                
                // Rest of the content
                ScrollView {
                    VStack(spacing: 20) {
                        // Logo and Title
                        Image(systemName: "dollarsign.circle.fill")
                            .resizable()
                            .frame(width: 80, height: 80)
                            .foregroundColor(Color(hex: "3B82F6"))
                        
                        Text("Fintellect")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)
                        
                        // Form Fields with improved styling
                        VStack(spacing: 16) {
                            TextField("Username", text: $username)
                                .textFieldStyle(CustomTextFieldStyle())
                                .autocapitalization(.none)
                            
                            SecureField("Password", text: $password)
                                .textFieldStyle(CustomTextFieldStyle())
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        
                        // Error Message
                        if let error = authViewModel.error {
                            Text(error)
                                .foregroundColor(.red)
                                .font(.caption)
                        }
                        
                        // Sign In Button
                        Button(action: {
                            Task {
                                await authViewModel.login(username: username, password: password)
                            }
                        }) {
                            if authViewModel.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Sign In")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(hex: "3B82F6"))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .padding(.horizontal, 20)
                        
                        // Demo Login Button
                        Button(action: {
                            authViewModel.loginAsDemoUser()
                        }) {
                            Text("Login as Demo User")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(hex: "22C55E"))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .padding(.horizontal, 20)
                        
                        // Register Link
                        Button(action: { isRegistering.toggle() }) {
                            Text(isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register")
                                .foregroundColor(Color(hex: "3B82F6"))
                        }
                        .padding(.top, 8)
                    }
                }
            }
        }
    }
}

// Custom TextField Style
struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 2)
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthViewModel())
} 