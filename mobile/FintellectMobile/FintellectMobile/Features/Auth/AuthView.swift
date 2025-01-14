import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var username = ""
    @State private var password = ""
    @State private var isRegistering = false
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 20) {
            // Custom Back Button
            HStack {
                Button(action: {
                    dismiss()
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
            .padding(.horizontal, 16)
            .padding(.top, 8)
            
            // Logo and Title
            Image(systemName: "dollarsign.circle.fill")
                .resizable()
                .frame(width: 80, height: 80)
                .foregroundColor(Color(hex: "3B82F6"))
            
            Text("Fintellect")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            // Form Fields
            VStack(spacing: 15) {
                TextField("Username", text: $username)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            .padding(.horizontal)
            
            // Error Message
            if let error = authViewModel.error {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            // Login/Register Button
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
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.horizontal)
            
            // Add Demo Login Button
            #if DEBUG
            Button(action: {
                authViewModel.loginAsDemoUser()
            }) {
                Text("Login as Demo User")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.green)
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.horizontal)
            #endif
            
            // Toggle Register/Login
            Button(action: { isRegistering.toggle() }) {
                Text(isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register")
                    .foregroundColor(.blue)
            }
        }
        .padding()
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthViewModel())
} 