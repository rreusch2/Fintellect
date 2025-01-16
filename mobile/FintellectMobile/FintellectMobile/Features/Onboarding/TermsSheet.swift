import SwiftUI

struct TermsSheet: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Agreement Section
                    VStack(alignment: .leading, spacing: 16) {
                        SectionTitle(icon: "doc.text", title: "Agreement to Terms")
                        
                        Text("By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.")
                            .foregroundColor(Color(hex: "94A3B8"))
                    }
                    
                    // AI Services Section
                    VStack(alignment: .leading, spacing: 16) {
                        SectionTitle(icon: "brain", title: "AI Financial Services")
                        
                        Text("Our AI-powered insights and recommendations are for informational purposes only and do not constitute financial advice. Always consult with qualified financial professionals for important financial decisions.")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("AI analysis is based on available data and historical patterns")
                            BulletPoint("Predictions and insights may not be accurate")
                            BulletPoint("Past performance does not guarantee future results")
                            BulletPoint("Users should verify all information independently")
                        }
                    }
                    
                    // User Accounts Section
                    VStack(alignment: .leading, spacing: 16) {
                        SectionTitle(icon: "person.fill", title: "User Accounts")
                        
                        Text("You are responsible for:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("Maintaining the confidentiality of your account credentials")
                            BulletPoint("All activities that occur under your account")
                            BulletPoint("Notifying us immediately of any unauthorized access")
                            BulletPoint("Ensuring your account information is accurate and up-to-date")
                        }
                    }
                    
                    // Financial Data Section
                    VStack(alignment: .leading, spacing: 16) {
                        SectionTitle(icon: "lock.shield", title: "Financial Data & Privacy")
                        
                        Text("By using our service, you acknowledge that:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("Your financial data is processed according to our Privacy Policy")
                            BulletPoint("We use Plaid to securely access your financial institution data")
                            BulletPoint("You authorize us to retrieve your financial information through Plaid")
                            BulletPoint("You can revoke access to your financial data at any time")
                        }
                    }
                    
                    // Limitations Section
                    VStack(alignment: .leading, spacing: 16) {
                        SectionTitle(icon: "exclamationmark.triangle", title: "Limitations of Liability")
                        
                        Text("We are not liable for:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        
                        VStack(alignment: .leading, spacing: 8) {
                            BulletPoint("Financial losses resulting from using our services")
                            BulletPoint("Accuracy of third-party data or AI predictions")
                            BulletPoint("Service interruptions or data unavailability")
                            BulletPoint("Actions taken based on AI recommendations")
                        }
                    }
                }
                .padding(20)
            }
            .background(Color(hex: "0F172A"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Terms of Service")
                        .font(.headline)
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(Color(hex: "3B82F6"))
                }
            }
        }
    }
}

struct SectionTitle: View {
    let icon: String
    let title: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(Color(hex: "3B82F6"))
            
            Text(title)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }
}

struct BulletPoint: View {
    let text: String
    
    init(_ text: String) {
        self.text = text
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(Color(hex: "3B82F6"))
                .frame(width: 6, height: 6)
                .padding(.top, 6)
            
            Text(text)
                .foregroundColor(Color(hex: "94A3B8"))
        }
    }
}

// Preview
struct TermsSheet_Previews: PreviewProvider {
    static var previews: some View {
        TermsSheet()
            .preferredColorScheme(.dark)
    }
} 