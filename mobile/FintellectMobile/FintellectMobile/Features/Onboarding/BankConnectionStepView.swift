import SwiftUI

struct BankConnectionStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    @State private var appear = [false, false, false]
    @State private var isConnecting = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Title
            VStack(spacing: 8) {
                Text("Connect Your Bank")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Link your accounts to get started")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 32)
            .opacity(appear[0] ? 1 : 0)
            .offset(y: appear[0] ? 0 : 20)
            
            // Bank Connection Card
            VStack(spacing: 20) {
                Image(systemName: "building.columns.fill")
                    .font(.system(size: 48))
                    .foregroundColor(Color(hex: "3B82F6"))
                
                Text("Securely connect your bank account")
                    .font(.headline)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                
                Text("We use bank-level security to protect your information")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .multilineTextAlignment(.center)
                
                // Security Features
                VStack(spacing: 12) {
                    SecurityFeatureRow(icon: "lock.shield.fill", text: "Bank-level 256-bit encryption")
                    SecurityFeatureRow(icon: "checkmark.shield.fill", text: "Read-only access")
                    SecurityFeatureRow(icon: "key.fill", text: "Your credentials are never stored")
                }
                .padding(.top, 8)
            }
            .padding(24)
            .background(Color(hex: "1E293B"))
            .cornerRadius(16)
            .padding(.horizontal, 20)
            .opacity(appear[1] ? 1 : 0)
            .offset(y: appear[1] ? 0 : 20)
            
            Spacer()
            
            // Action Buttons
            VStack(spacing: 16) {
                // Connect Bank Button
                Button(action: {
                    Task {
                        await connectBank()
                    }
                }) {
                    HStack {
                        if isConnecting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Connect Bank Account")
                                .font(.headline)
                        }
                    }
                    .frame(maxWidth: .infinity)
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
                .disabled(isConnecting || viewModel.isLoading)
                
                // Skip Button
                Button(action: {
                    Task {
                        await viewModel.completeOnboarding()
                    }
                }) {
                    HStack {
                        if viewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .gray))
                        } else {
                            Text("Skip for now")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "94A3B8"))
                        }
                    }
                }
                .disabled(isConnecting || viewModel.isLoading)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
            .opacity(appear[2] ? 1 : 0)
            .offset(y: appear[2] ? 0 : 20)
        }
        .onAppear {
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
    
    private func connectBank() async {
        isConnecting = true
        
        do {
            // Get Plaid link token
            let response: Data = try await APIClient.shared.post("/api/plaid/create-link-token", body: [:])
            if let linkResponse = try? JSONDecoder().decode(PlaidLinkResponse.self, from: response) {
                print("[Plaid] Link token created: \(linkResponse.linkToken)")
                // TODO: Open Plaid Link using the token
                // For now, we'll just complete onboarding
                await viewModel.completeOnboarding()
            }
        } catch {
            print("[Plaid] Error creating link token: \(error)")
            viewModel.error = "Failed to connect bank account. Please try again."
        }
        
        isConnecting = false
    }
}

struct SecurityFeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(Color(hex: "3B82F6"))
                .font(.system(size: 16))
            
            Text(text)
                .font(.subheadline)
                .foregroundColor(Color(hex: "94A3B8"))
            
            Spacer()
        }
    }
}

struct PlaidLinkResponse: Codable {
    let linkToken: String
    
    enum CodingKeys: String, CodingKey {
        case linkToken = "link_token"
    }
}

#Preview {
    ZStack {
        Color(hex: "0F172A").ignoresSafeArea()
        BankConnectionStepView(viewModel: OnboardingViewModel())
    }
} 