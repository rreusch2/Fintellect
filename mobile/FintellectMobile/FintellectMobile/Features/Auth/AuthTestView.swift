import SwiftUI

struct AuthTestView: View {
    @StateObject private var authViewModel = AuthViewModel()
    @State private var username = ""
    @State private var password = ""
    @State private var testResult = ""
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Auth Integration Test")
                    .font(.title)
                    .padding(.top)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Username")
                        .foregroundColor(.gray)
                    TextField("Enter username", text: $username)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .foregroundColor(.gray)
                    SecureField("Enter password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                Button(action: {
                    Task {
                        isLoading = true
                        do {
                            await authViewModel.login(username: username, password: password)
                            if authViewModel.isAuthenticated {
                                testResult = "✅ Login successful\nUser: \(authViewModel.currentUser?.username ?? "")"
                            } else {
                                testResult = "❌ Login failed"
                            }
                        }
                        isLoading = false
                    }
                }) {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                    } else {
                        Text("Test Login")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(username.isEmpty || password.isEmpty || isLoading)
                
                if !testResult.isEmpty {
                    Text(testResult)
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.systemBackground))
                                .shadow(radius: 2)
                        )
                }
                
                if let error = authViewModel.error {
                    Text("Error: \(error)")
                        .foregroundColor(.red)
                        .padding()
                }
                
                Spacer()
                
                // Debug info
                VStack(alignment: .leading, spacing: 8) {
                    Text("Debug Info:")
                        .font(.headline)
                    if let token = KeychainManager.getToken(forKey: "accessToken") {
                        Text("Access Token exists")
                            .foregroundColor(.green)
                    } else {
                        Text("No Access Token")
                            .foregroundColor(.red)
                    }
                    
                    if let refreshToken = KeychainManager.getToken(forKey: "refreshToken") {
                        Text("Refresh Token exists")
                            .foregroundColor(.green)
                    } else {
                        Text("No Refresh Token")
                            .foregroundColor(.red)
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.2))
                )
            }
            .padding()
            .navigationTitle("Auth Test")
        }
    }
}

#Preview {
    AuthTestView()
} 