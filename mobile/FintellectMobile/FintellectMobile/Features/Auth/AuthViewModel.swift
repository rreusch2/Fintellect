import Foundation

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var error: String?
    
    // Add development bypass
    func loginAsDemoUser() {
        currentUser = User(
            id: 1,
            username: "DemoUser",
            hasPlaidSetup: true,
            hasCompletedOnboarding: true,
            monthlyIncome: 500000, // Stored in cents
            onboardingStep: nil
        )
        isAuthenticated = true
    }
    
    // Keep existing login method for later
    func login(username: String, password: String) async {
        #if DEBUG
        // In debug builds, use demo login
        loginAsDemoUser()
        return
        #endif
        
        // Original login code
        isLoading = true
        error = nil
        
        do {
            let credentials = ["username": username, "password": password]
            let response: LoginResponse = try await APIClient.shared.post("/api/login", body: credentials)
            currentUser = response.user
            isAuthenticated = true
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func logout() async {
        isLoading = true
        
        do {
            let _: EmptyResponse = try await APIClient.shared.post("/api/logout", body: EmptyBody())
            isAuthenticated = false
            currentUser = nil
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

// Response types
struct LoginResponse: Codable {
    let message: String
    let user: User
}

struct EmptyResponse: Codable {}
struct EmptyBody: Codable {} 