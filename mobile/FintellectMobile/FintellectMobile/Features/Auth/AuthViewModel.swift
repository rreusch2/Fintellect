import Foundation
import Security

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var error: String?
    
    init() {
        // Check for existing tokens on launch
        Task {
            await checkAuthentication()
        }
    }
    
    private func checkAuthentication() async {
        guard let accessToken = KeychainManager.getToken(forKey: "accessToken") else {
            print("[Auth] No access token found")
            return
        }
        
        do {
            // Verify token by making a test request
            let response: User = try await APIClient.shared.get("/api/auth/mobile/verify")
            print("[Auth] Token verified, user authenticated")
            currentUser = response
            isAuthenticated = true
        } catch {
            print("[Auth] Token verification failed:", error.localizedDescription)
            // Token might be expired, try refresh
            await refreshTokenIfNeeded()
        }
    }
    
    private func refreshTokenIfNeeded() async {
        guard let refreshToken = KeychainManager.getToken(forKey: "refreshToken") else {
            print("[Auth] No refresh token found")
            return
        }
        
        do {
            let response: RefreshResponse = try await APIClient.shared.post(
                "/api/auth/mobile/refresh",
                body: ["refreshToken": refreshToken]
            )
            
            print("[Auth] Token refresh successful")
            KeychainManager.saveToken(response.accessToken, forKey: "accessToken")
            
            // Retry authentication check
            await checkAuthentication()
        } catch {
            print("[Auth] Token refresh failed:", error.localizedDescription)
            // Clear tokens and require re-login
            await logout()
        }
    }
    
    func login(username: String, password: String) async {
        #if DEBUG
        if username.lowercased() == "demo" {
            print("[Auth] Demo user login")
            loginAsDemoUser()
            return
        }
        #endif
        
        isLoading = true
        error = nil
        
        do {
            let credentials = ["username": username.lowercased(), "password": password]
            let response: LoginResponse = try await APIClient.shared.post("/api/auth/mobile/login", body: credentials)
            
            print("[Auth] Login successful")
            
            // Save tokens
            KeychainManager.saveToken(response.tokens.accessToken, forKey: "accessToken")
            KeychainManager.saveToken(response.tokens.refreshToken, forKey: "refreshToken")
            
            currentUser = response.user
            isAuthenticated = true
        } catch {
            print("[Auth] Login failed:", error.localizedDescription)
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func logout() async {
        isLoading = true
        
        #if DEBUG
        if currentUser?.username == "DemoUser" {
            isAuthenticated = false
            currentUser = nil
            isLoading = false
            return
        }
        #endif
        
        do {
            // Attempt to notify server
            let _: EmptyResponse = try await APIClient.shared.post("/api/auth/mobile/logout", body: EmptyBody())
        } catch {
            print("[Auth] Logout request failed:", error.localizedDescription)
            // Continue with local logout regardless of server response
        }
        
        // Clear tokens and state
        KeychainManager.deleteToken(forKey: "accessToken")
        KeychainManager.deleteToken(forKey: "refreshToken")
        isAuthenticated = false
        currentUser = nil
        isLoading = false
    }
    
    // Demo mode helper - removed private modifier
    func loginAsDemoUser() {
        currentUser = User(
            id: 1,
            username: "DemoUser",
            hasPlaidSetup: true,
            hasCompletedOnboarding: true,
            monthlyIncome: 500000,
            onboardingStep: nil
        )
        isAuthenticated = true
    }
}

// Response types
struct LoginResponse: Codable {
    let message: String
    let user: User
    let tokens: Tokens
}

struct Tokens: Codable {
    let accessToken: String
    let refreshToken: String
}

struct RefreshResponse: Codable {
    let accessToken: String
}

struct EmptyResponse: Codable {}
struct EmptyBody: Codable {} 