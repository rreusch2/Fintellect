import SwiftUI

struct PrivacySheet: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Data Collection Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Data Collection")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Text("Information We Collect:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("Account information (username, encrypted password)")
                            BulletPoint("Financial data through Plaid integration")
                            BulletPoint("Transaction history and spending patterns")
                            BulletPoint("User preferences and financial goals")
                            BulletPoint("Usage data and interaction with our services")
                        }
                    }
                    
                    // Data Usage Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Data Usage")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Text("We use your data to:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("Provide personalized financial insights and recommendations")
                            BulletPoint("Improve our AI models and service accuracy")
                            BulletPoint("Maintain and enhance our services")
                            BulletPoint("Ensure security and prevent fraud")
                        }
                        
                        Text("Important Notice: We never sell your personal data to third parties. Your financial information is used solely for providing our services.")
                            .foregroundColor(Color(hex: "94A3B8"))
                            .padding()
                            .background(Color(hex: "1E293B"))
                            .cornerRadius(12)
                    }
                    
                    // Data Security Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Data Security")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Text("We implement industry-standard security measures:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("End-to-end encryption for all sensitive data")
                            BulletPoint("Regular security audits and penetration testing")
                            BulletPoint("Secure infrastructure and access controls")
                            BulletPoint("Employee security training and access limitations")
                        }
                    }
                    
                    // Plaid Integration Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Plaid Integration")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Text("We use Plaid to securely connect to your financial institutions. Your banking credentials are never stored on our servers and are handled directly by Plaid.")
                            .foregroundColor(Color(hex: "94A3B8"))
                    }
                    
                    // User Rights Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Your Rights and Choices")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Text("You have the right to:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("Access your personal data")
                            BulletPoint("Request data deletion")
                            BulletPoint("Opt-out of certain data processing")
                            BulletPoint("Update your information")
                            BulletPoint("Disconnect financial accounts")
                        }
                        
                        Text("Contact us at privacy@fintellect.com to exercise these rights.")
                            .foregroundColor(Color(hex: "94A3B8"))
                            .padding(.top, 8)
                    }
                }
                .padding(20)
            }
            .background(Color(hex: "0F172A"))
            .navigationTitle("Privacy Policy")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    PrivacySheet()
} 