import SwiftUI

enum OnboardingStep: Int, CaseIterable {
    case terms
    case bankConnection
    
    var title: String {
        switch self {
        case .terms:
            return "Terms & Privacy"
        case .bankConnection:
            return "Connect Bank"
        }
    }
}

class OnboardingCoordinator: ObservableObject {
    @Published var currentStep: OnboardingStep = .terms
    @Published var hasAcceptedTerms = false
    @Published var hasAcceptedPrivacy = false
    @Published var hasBankConnected = false
    @Published var showTermsSheet = false
    @Published var showPrivacySheet = false
    @Published var activeSheet: ActiveSheet?
    
    enum ActiveSheet: Identifiable {
        case terms, privacy
        
        var id: Int {
            switch self {
            case .terms: return 1
            case .privacy: return 2
            }
        }
    }
    
    var canProceedToNextStep: Bool {
        switch currentStep {
        case .terms:
            // For testing, allow proceeding even if not accepted
            return true
        case .bankConnection:
            // For testing, allow proceeding even if not connected
            return true
        }
    }
    
    func nextStep() {
        if let nextIndex = OnboardingStep.allCases.firstIndex(where: { $0 == currentStep }).map({ $0 + 1 }),
           nextIndex < OnboardingStep.allCases.count {
            withAnimation {
                currentStep = OnboardingStep.allCases[nextIndex]
            }
        } else {
            // Completed all steps
            completeOnboarding()
        }
    }
    
    func completeOnboarding() {
        // TODO: Save onboarding completion status to backend
        // For now, we'll just print a message
        print("Onboarding completed!")
    }
}

struct OnboardingContainerView: View {
    @StateObject private var coordinator = OnboardingCoordinator()
    @State private var showDashboard = false
    
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
                
                // Animated orbs
                ZStack {
                    // Primary orb
                    Circle()
                        .fill(
                            RadialGradient(
                                gradient: Gradient(colors: [
                                    Color(hex: "3B82F6").opacity(0.2),
                                    Color(hex: "1E40AF").opacity(0)
                                ]),
                                center: .center,
                                startRadius: 50,
                                endRadius: 250
                            )
                        )
                        .frame(width: 500, height: 500)
                        .blur(radius: 50)
                        .offset(x: -100, y: -50)
                    
                    // Secondary orb
                    Circle()
                        .fill(
                            RadialGradient(
                                gradient: Gradient(colors: [
                                    Color(hex: "60A5FA").opacity(0.15),
                                    Color(hex: "3B82F6").opacity(0)
                                ]),
                                center: .center,
                                startRadius: 50,
                                endRadius: 200
                            )
                        )
                        .frame(width: 400, height: 400)
                        .blur(radius: 45)
                        .offset(x: 120, y: 50)
                }
                
                VStack(spacing: 0) {
                    // Progress indicator
                    HStack(spacing: 8) {
                        ForEach(OnboardingStep.allCases, id: \.self) { step in
                            Capsule()
                                .fill(step == coordinator.currentStep ? Color(hex: "3B82F6") : Color(hex: "64748B"))
                                .frame(height: 4)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    
                    // Current step view
                    switch coordinator.currentStep {
                    case .terms:
                        OnboardingTermsView()
                            .environmentObject(coordinator)
                    case .bankConnection:
                        OnboardingBankView()
                            .environmentObject(coordinator)
                    }
                }
                .sheet(item: $coordinator.activeSheet) { sheet in
                    switch sheet {
                    case .terms:
                        TermsSheet()
                    case .privacy:
                        PrivacySheet()
                    }
                }
            }
            .navigationDestination(isPresented: $showDashboard) {
                // TODO: Replace with actual dashboard
                Text("Dashboard")
                    .navigationBarBackButtonHidden()
            }
        }
    }
}

// Preview
struct OnboardingContainerView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingContainerView()
    }
} 