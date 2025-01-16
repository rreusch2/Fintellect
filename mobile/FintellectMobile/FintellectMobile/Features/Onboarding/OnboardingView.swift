import SwiftUI

enum OnboardingStep: Int, CaseIterable {
    case terms = 0
    case bankConnection = 1
    
    var title: String {
        switch self {
        case .terms:
            return "Terms & Privacy"
        case .bankConnection:
            return "Connect Bank"
        }
    }
}

struct OnboardingView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient with animated orbs
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(hex: "1E293B"),  // Dark blue
                        Color(hex: "0F172A"),  // Darker blue
                        Color(hex: "020617")   // Almost black
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Progress Indicator
                    HStack(spacing: 8) {
                        ForEach(OnboardingStep.allCases, id: \.self) { step in
                            Capsule()
                                .fill(step.rawValue <= viewModel.currentStep.rawValue ? 
                                      Color(hex: "3B82F6") : Color(hex: "475569"))
                                .frame(height: 4)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    
                    // Current Step View
                    Group {
                        switch viewModel.currentStep {
                        case .terms:
                            TermsStepView(viewModel: viewModel)
                        case .bankConnection:
                            BankConnectionStepView(viewModel: viewModel)
                        }
                    }
                    .transition(.opacity.combined(with: .move(edge: .trailing)))
                }
            }
            .sheet(isPresented: $viewModel.showTermsSheet) {
                TermsSheet()
            }
            .sheet(isPresented: $viewModel.showPrivacySheet) {
                PrivacySheet()
            }
        }
    }
}

#Preview {
    OnboardingView()
} 