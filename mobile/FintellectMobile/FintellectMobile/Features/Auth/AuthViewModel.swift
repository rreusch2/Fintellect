import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: String?
    @Published var currentUser: User?
    
    init() {
        Task {
            await checkAuthentication()
        }
    }
    
    func register(username: String, email: String, password: String) async {
        isLoading = true
        error = nil
        
        do {
            let credentials = [
                "username": username.lowercased(),
                "email": email.lowercased(),
                "password": password
            ]
            
            let response: Data = try await APIClient.shared.post("/api/auth/mobile/register", body: credentials)
            
            if let registerResponse = try? JSONDecoder().decode(RegisterResponse.self, from: response) {
                // Store tokens
                try KeychainManager.saveToken(registerResponse.tokens.accessToken, forKey: "accessToken")
                try KeychainManager.saveToken(registerResponse.tokens.refreshToken, forKey: "refreshToken")
                
                // Update user state
                self.currentUser = registerResponse.user
                self.isAuthenticated = true
                print("[Auth] Registration successful for user: \(registerResponse.user.username)")
            }
        } catch {
            self.error = error.localizedDescription
            print("[Auth] Registration error: \(error)")
        }
        
        isLoading = false
    }
    
    func login(username: String, password: String) async {
        isLoading = true
        error = nil
        
        do {
            let credentials = ["username": username.lowercased(), "password": password]
            let response: Data = try await APIClient.shared.post("/api/auth/mobile/login", body: credentials)
            
            // Print response for debugging
            if let jsonString = String(data: response, encoding: .utf8) {
                print("[Auth] Raw response: \(jsonString)")
            }
            
            if let loginResponse = try? JSONDecoder().decode(LoginResponse.self, from: response) {
                // Store tokens
                try KeychainManager.saveToken(loginResponse.tokens.accessToken, forKey: "accessToken")
                try KeychainManager.saveToken(loginResponse.tokens.refreshToken, forKey: "refreshToken")
                
                // Update user state
                DispatchQueue.main.async {
                    self.currentUser = loginResponse.user
                    self.isAuthenticated = true
                }
                print("[Auth] Login successful for user: \(loginResponse.user.username)")
            } else {
                // Try to decode error response
                if let errorResponse = try? JSONDecoder().decode([String: String].self, from: response) {
                    throw APIError.serverError(errorResponse["message"] ?? "Unknown error")
                }
                throw APIError.decodingError(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode login response"]))
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error.localizedDescription
            }
            print("[Auth] Login error: \(error)")
        }
        
        DispatchQueue.main.async {
            self.isLoading = false
        }
    }
    
    func loginAsDemoUser() {
        print("[Auth] Demo user login")
        Task {
            await login(username: "demo", password: "demo")
        }
    }
    
    func logout() {
        // Clear tokens
        try? KeychainManager.deleteToken(forKey: "accessToken")
        try? KeychainManager.deleteToken(forKey: "refreshToken")
        
        // Reset state
        isAuthenticated = false
        currentUser = nil
        print("[Auth] User logged out")
    }
    
    func checkAuthentication() async {
        guard let accessToken = try? KeychainManager.getToken(forKey: "accessToken") else {
            print("[Auth] No access token found")
            return
        }
        
        do {
            let response: Data = try await APIClient.shared.get("/api/auth/mobile/verify")
            if let user = try? JSONDecoder().decode(User.self, from: response) {
                self.currentUser = user
                self.isAuthenticated = true
                print("[Auth] Authentication verified for user: \(user.username)")
            }
        } catch {
            print("[Auth] Token verification failed: \(error)")
            // If verification fails, try refreshing the token
            await refreshTokenIfNeeded()
        }
    }
    
    private func refreshTokenIfNeeded() async {
        guard let refreshToken = try? KeychainManager.getToken(forKey: "refreshToken") else {
            print("[Auth] No refresh token found")
            return
        }
        
        do {
            let response: Data = try await APIClient.shared.post("/api/auth/mobile/refresh", body: ["refreshToken": refreshToken])
            if let refreshResponse = try? JSONDecoder().decode(RefreshResponse.self, from: response) {
                try KeychainManager.saveToken(refreshResponse.accessToken, forKey: "accessToken")
                print("[Auth] Access token refreshed successfully")
                await checkAuthentication()
            }
        } catch {
            print("[Auth] Token refresh failed: \(error)")
            logout()
        }
    }
}

// Response Models
struct LoginResponse: Codable {
    let message: String
    let user: User
    let tokens: AuthTokens
}

struct AuthTokens: Codable {
    let accessToken: String
    let refreshToken: String
}

struct RegisterResponse: Codable {
    let success: Bool
    let user: User
    let tokens: AuthTokens
}

struct RefreshResponse: Codable {
    let accessToken: String
} 