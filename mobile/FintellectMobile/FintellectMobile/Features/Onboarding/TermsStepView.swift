import SwiftUI

struct TermsStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    @State private var appear = [false, false, false]
    
    var body: some View {
        VStack(spacing: 24) {
            // Title
            VStack(spacing: 8) {
                Text("Terms & Privacy")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Please review and accept our terms")
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "94A3B8"))
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 32)
            .opacity(appear[0] ? 1 : 0)
            .offset(y: appear[0] ? 0 : 20)
            
            // Terms and Privacy Buttons
            VStack(spacing: 16) {
                // Terms Button
                Button(action: {
                    viewModel.showTermsSheet = true
                }) {
                    HStack {
                        Image(systemName: "doc.text")
                            .font(.system(size: 20))
                        Text("Terms of Service")
                            .font(.headline)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color(hex: "1E293B"))
                    .cornerRadius(12)
                }
                
                // Privacy Button
                Button(action: {
                    viewModel.showPrivacySheet = true
                }) {
                    HStack {
                        Image(systemName: "lock.shield")
                            .font(.system(size: 20))
                        Text("Privacy Policy")
                            .font(.headline)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color(hex: "1E293B"))
                    .cornerRadius(12)
                }
            }
            .padding(.horizontal, 20)
            .opacity(appear[1] ? 1 : 0)
            .offset(y: appear[1] ? 0 : 20)
            
            // Checkboxes
            VStack(spacing: 16) {
                Toggle(isOn: $viewModel.hasAcceptedTerms) {
                    Text("I accept the Terms of Service")
                        .foregroundColor(.white)
                        .font(.subheadline)
                }
                .toggleStyle(CheckboxStyle())
                
                Toggle(isOn: $viewModel.hasAcceptedPrivacy) {
                    Text("I accept the Privacy Policy")
                        .foregroundColor(.white)
                        .font(.subheadline)
                }
                .toggleStyle(CheckboxStyle())
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .opacity(appear[2] ? 1 : 0)
            .offset(y: appear[2] ? 0 : 20)
            
            Spacer()
            
            // Continue Button
            Button(action: {
                Task {
                    await viewModel.acceptTerms()
                }
            }) {
                HStack {
                    if viewModel.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Continue")
                            .font(.headline)
                    }
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(
                        colors: viewModel.hasAcceptedTerms && viewModel.hasAcceptedPrivacy ?
                            [Color(hex: "3B82F6"), Color(hex: "2563EB")] :
                            [Color(hex: "64748B"), Color(hex: "475569")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(14)
                .shadow(color: (viewModel.hasAcceptedTerms && viewModel.hasAcceptedPrivacy ? Color(hex: "3B82F6") : Color(hex: "64748B")).opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .disabled(!viewModel.hasAcceptedTerms || !viewModel.hasAcceptedPrivacy || viewModel.isLoading)
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
}

struct CheckboxStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack {
            Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                .foregroundColor(configuration.isOn ? Color(hex: "3B82F6") : Color(hex: "64748B"))
                .font(.system(size: 20, weight: .medium))
                .onTapGesture {
                    configuration.isOn.toggle()
                }
            
            configuration.label
        }
    }
}

#Preview {
    ZStack {
        Color(hex: "0F172A").ignoresSafeArea()
        TermsStepView(viewModel: OnboardingViewModel())
    }
} 