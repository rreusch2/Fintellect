import SwiftUI

struct BankConnectionStepView: View {
    @StateObject private var plaidManager = PlaidManager.shared
    @ObservedObject var viewModel: OnboardingViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Connect Your Bank Account")
                .font(.title)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .padding(.top)
            
            Text("Connect your bank account to get personalized insights and track your spending.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            Button(action: {
                print("[Plaid] Connect Bank Button tapped")
                Task {
                    await plaidManager.createAndPresentLink()
                }
            }) {
                Text("Connect Bank Account")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding(.horizontal)
            
            if let error = plaidManager.error {
                Text(error)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
                    .padding()
            }
        }
        .padding()
        .onAppear {
            // Set up notification observer for Plaid account linked
            NotificationCenter.default.addObserver(
                forName: NSNotification.Name("PlaidAccountLinked"),
                object: nil,
                queue: .main
            ) { _ in
                print("[Onboarding] Plaid account linked, completing onboarding")
                Task {
                    await viewModel.completeOnboarding()
                }
            }
        }
        .fullScreenCover(isPresented: $plaidManager.isPresentingLink) {
            if let linkController = plaidManager.linkController {
                PlaidLinkView(linkController: linkController)
                    .ignoresSafeArea()
            }
        }
    }
}

struct PlaidLinkView: UIViewControllerRepresentable {
    let linkController: LinkController
    
    func makeUIViewController(context: Context) -> UIViewController {
        let viewController = UIViewController()
        let coordinator = context.coordinator
        coordinator.present(linkController.handler, in: viewController)
        return viewController
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
    
    func makeCoordinator() -> LinkController.Coordinator {
        linkController.makeCoordinator()
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