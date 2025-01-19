import SwiftUI

struct BankConnectionStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    @StateObject private var plaidManager = PlaidManager.shared
    @State private var appear = [false, false, false]
    
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
                Button {
                    print("[Plaid] Connect Bank Button tapped")
                    Task {
                        await plaidManager.createAndPresentLink()
                    }
                } label: {
                    Text("Connect Bank Account")
                        .font(.headline)
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
                .disabled(plaidManager.isLoading)
                
                // Skip Button
                Button {
                    print("[Onboarding] Skip button tapped")
                    Task {
                        await viewModel.completeOnboarding()
                    }
                } label: {
                    Text("Skip for now")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
                .disabled(viewModel.isLoading)
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
        .alert("Error", isPresented: .constant(plaidManager.error != nil)) {
            Button("OK") {
                plaidManager.error = nil
            }
        } message: {
            if let error = plaidManager.error {
                Text(error)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("PlaidAccountLinked"))) { _ in
            Task {
                await viewModel.completeOnboarding()
            }
        }
        .fullScreenCover(
            isPresented: $plaidManager.isPresentingLink,
            content: {
                if let linkController = plaidManager.linkController {
                    linkController
                        .ignoresSafeArea(.all)
                } else {
                    Text("Error: LinkController not initialized")
                }
            }
        )
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

#Preview {
    ZStack {
        Color(hex: "0F172A").ignoresSafeArea()
        BankConnectionStepView(viewModel: OnboardingViewModel(authViewModel: AuthViewModel()))
    }
} 