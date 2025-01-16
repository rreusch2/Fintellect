import SwiftUI

struct OnboardingBankView: View {
    @EnvironmentObject var coordinator: OnboardingCoordinator
    @State private var showConnectOptions = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Title
            VStack(spacing: 8) {
                Text("Connect Your Bank")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Link your bank account to enable automatic transaction tracking")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 40)
            
            // Bank Connection Card
            VStack(spacing: 20) {
                // Icon
                ZStack {
                    Circle()
                        .fill(Color(hex: "3B82F6").opacity(0.1))
                        .frame(width: 80, height: 80)
                    
                    Image(systemName: "building.columns.fill")
                        .font(.system(size: 32))
                        .foregroundColor(Color(hex: "3B82F6"))
                }
                
                VStack(spacing: 12) {
                    Text("Secure Bank Connection")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("We use Plaid to securely connect to your bank. Your credentials are never stored on our servers.")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 32)
            .background(Color(hex: "1E293B"))
            .cornerRadius(16)
            .padding(.horizontal, 20)
            
            // Security Features
            VStack(spacing: 16) {
                SecurityFeatureRow(icon: "lock.shield", title: "Bank-level Security", description: "256-bit encryption for all data")
                SecurityFeatureRow(icon: "key.fill", title: "Credentials Protected", description: "Never stored on our servers")
                SecurityFeatureRow(icon: "checkmark.shield", title: "Verified & Trusted", description: "Used by millions of users")
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            
            Spacer()
            
            // Action Buttons
            VStack(spacing: 16) {
                // Connect Bank Button (Primary)
                Button {
                    showConnectOptions.toggle()
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                        Text("Connect Bank Account")
                            .font(.headline)
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
                }
                .actionSheet(isPresented: $showConnectOptions) {
                    ActionSheet(
                        title: Text("Connect Bank"),
                        message: Text("Choose how to proceed"),
                        buttons: [
                            .default(Text("Connect with Plaid (Coming Soon)")) { },
                            .default(Text("Skip for Testing")) {
                                coordinator.nextStep()
                            },
                            .cancel()
                        ]
                    )
                }
                
                // Skip button for testing
                Button {
                    coordinator.nextStep()
                } label: {
                    Text("Skip for Testing")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "64748B"))
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
    }
}

struct SecurityFeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(Color(hex: "3B82F6"))
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(Color(hex: "94A3B8"))
            }
            
            Spacer()
        }
    }
}

// Preview
struct OnboardingBankView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingBankView()
            .environmentObject(OnboardingCoordinator())
            .preferredColorScheme(.dark)
            .background(Color(hex: "0F172A"))
    }
} 