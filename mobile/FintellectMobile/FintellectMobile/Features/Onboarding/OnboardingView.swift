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

@MainActor
class OnboardingViewModel: ObservableObject {
    @Published var currentStep: OnboardingStep = .terms
    @Published var hasAcceptedTerms = false
    @Published var hasAcceptedPrivacy = false
    @Published var showTermsSheet = false
    @Published var showPrivacySheet = false
    @Published var showBankConnectionSheet = false
    @Published var error: String?
    @Published var isLoading = false
    
    private let authViewModel: AuthViewModel
    
    init(authViewModel: AuthViewModel) {
        self.authViewModel = authViewModel
    }
    
    func acceptTerms() async {
        guard hasAcceptedTerms && hasAcceptedPrivacy else {
            error = "Please accept both Terms of Service and Privacy Policy"
            return
        }
        
        isLoading = true
        error = nil
        
        do {
            let body: [String: Any] = [
                "acceptedTerms": true,
                "acceptedPrivacy": true
            ]
            
            let response = try await APIClient.shared.post("/api/auth/mobile/accept-terms", body: body)
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let userData = json["user"] as? [String: Any] {
                // Update the user data
                let updatedUser = User(
                    id: userData["id"] as? Int ?? 0,
                    username: userData["username"] as? String ?? "",
                    hasPlaidSetup: userData["hasPlaidSetup"] as? Bool ?? false,
                    hasCompletedOnboarding: userData["hasCompletedOnboarding"] as? Bool ?? false,
                    monthlyIncome: userData["monthlyIncome"] as? Int,
                    onboardingStep: userData["onboardingStep"] as? Int
                )
                authViewModel.currentUser = updatedUser
                print("[Onboarding] Terms accepted successfully")
                nextStep()
            }
        } catch {
            self.error = error.localizedDescription
            print("[Onboarding] Error accepting terms: \(error)")
        }
        
        isLoading = false
    }
    
    func nextStep() {
        if let currentIndex = OnboardingStep.allCases.firstIndex(of: currentStep),
           currentIndex + 1 < OnboardingStep.allCases.count {
            withAnimation {
                let nextStep = OnboardingStep.allCases[currentIndex + 1]
                print("[Onboarding] Moving from step \(currentStep.title) to \(nextStep.title)")
                currentStep = nextStep
            }
        } else {
            // Complete onboarding
            Task { await completeOnboarding() }
        }
    }
    
    func completeOnboarding() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await APIClient.shared.post("/api/auth/mobile/complete-onboarding", body: [:])
            if let json = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
               let userData = json["user"] as? [String: Any] {
                // Update the user data
                let updatedUser = User(
                    id: userData["id"] as? Int ?? 0,
                    username: userData["username"] as? String ?? "",
                    hasPlaidSetup: userData["hasPlaidSetup"] as? Bool ?? false,
                    hasCompletedOnboarding: userData["hasCompletedOnboarding"] as? Bool ?? true,
                    monthlyIncome: userData["monthlyIncome"] as? Int,
                    onboardingStep: userData["onboardingStep"] as? Int
                )
                authViewModel.currentUser = updatedUser
                print("[Onboarding] Onboarding completed successfully")
                NotificationCenter.default.post(name: NSNotification.Name("OnboardingCompleted"), object: nil)
            }
        } catch {
            self.error = error.localizedDescription
            print("[Onboarding] Error completing onboarding: \(error)")
        }
        
        isLoading = false
    }
}

struct OnboardingView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @StateObject private var viewModel: OnboardingViewModel
    @Environment(\.dismiss) var dismiss
    
    init() {
        // Initialize viewModel with authViewModel from environment
        _viewModel = StateObject(wrappedValue: OnboardingViewModel(authViewModel: AuthViewModel()))
    }
    
    var body: some View {
        ZStack {
            // Background
            Color(hex: "0F172A").ignoresSafeArea()
            
            // Content
            Group {
                switch viewModel.currentStep {
                case .terms:
                    TermsStepView(viewModel: viewModel)
                        .sheet(isPresented: $viewModel.showTermsSheet) {
                            TermsSheet()
                        }
                        .sheet(isPresented: $viewModel.showPrivacySheet) {
                            PrivacySheet()
                        }
                case .bankConnection:
                    BankConnectionStepView(viewModel: viewModel)
                }
            }
        }
        .alert("Error", isPresented: .constant(viewModel.error != nil)) {
            Button("OK") {
                viewModel.error = nil
            }
        } message: {
            if let error = viewModel.error {
                Text(error)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("OnboardingCompleted"))) { _ in
            print("[Onboarding] Received completion notification, dismissing")
            dismiss()
        }
    }
}

#Preview {
    OnboardingView()
        .environmentObject(AuthViewModel())
} 