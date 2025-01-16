import SwiftUI

struct OnboardingTermsView: View {
    @EnvironmentObject var coordinator: OnboardingCoordinator
    
    var body: some View {
        VStack(spacing: 24) {
            // Title
            VStack(spacing: 8) {
                Text("Terms & Privacy")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Please review and accept our terms and privacy policy")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 40)
            
            // Terms & Privacy Cards
            VStack(spacing: 16) {
                // Terms Card
                Button {
                    coordinator.activeSheet = .terms
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Image(systemName: "doc.text")
                                    .font(.system(size: 18, weight: .medium))
                                Text("Terms of Service")
                                    .font(.headline)
                            }
                            .foregroundColor(.white)
                            
                            Text("Review our terms of service")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "94A3B8"))
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(Color(hex: "64748B"))
                    }
                    .padding()
                    .background(Color(hex: "1E293B"))
                    .cornerRadius(12)
                }
                
                // Privacy Card
                Button {
                    coordinator.activeSheet = .privacy
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Image(systemName: "lock.shield")
                                    .font(.system(size: 18, weight: .medium))
                                Text("Privacy Policy")
                                    .font(.headline)
                            }
                            .foregroundColor(.white)
                            
                            Text("Review our privacy policy")
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "94A3B8"))
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(Color(hex: "64748B"))
                    }
                    .padding()
                    .background(Color(hex: "1E293B"))
                    .cornerRadius(12)
                }
            }
            .padding(.horizontal, 20)
            
            // Acceptance Toggles
            VStack(spacing: 12) {
                Toggle(isOn: $coordinator.hasAcceptedTerms) {
                    Text("I accept the Terms of Service")
                        .font(.subheadline)
                        .foregroundColor(.white)
                }
                .tint(Color(hex: "3B82F6"))
                
                Toggle(isOn: $coordinator.hasAcceptedPrivacy) {
                    Text("I accept the Privacy Policy")
                        .font(.subheadline)
                        .foregroundColor(.white)
                }
                .tint(Color(hex: "3B82F6"))
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            
            Spacer()
            
            // Continue Button
            VStack(spacing: 16) {
                Button {
                    coordinator.nextStep()
                } label: {
                    Text("Continue")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: coordinator.hasAcceptedTerms && coordinator.hasAcceptedPrivacy ?
                                    [Color(hex: "3B82F6"), Color(hex: "2563EB")] :
                                    [Color(hex: "64748B"), Color(hex: "475569")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(14)
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

// Preview
struct OnboardingTermsView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingTermsView()
            .environmentObject(OnboardingCoordinator())
            .preferredColorScheme(.dark)
            .background(Color(hex: "0F172A"))
    }
} 