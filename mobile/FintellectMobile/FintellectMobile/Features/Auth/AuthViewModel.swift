import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: String?
    @Published var currentUser: User?
    
    private let apiClient = APIClient.shared
    
    init() {
        Task {
            await checkAuthentication()
        }
    }
    
    func login(username: String, password: String) async {
        isLoading = true
        error = nil
        
        do {
            // Check for demo user
            if username.lowercased() == "demo" {
                try await loginAsDemoUser()
                return
            }
            
            let credentials = [
                "username": username.lowercased(),
                "password": password
            ]
            
            let data = try await apiClient.post("/api/auth/mobile/login", body: credentials)
            let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
            
            // Save tokens
            try KeychainManager.saveToken(loginResponse.tokens.accessToken, forKey: "accessToken")
            try KeychainManager.saveToken(loginResponse.tokens.refreshToken, forKey: "refreshToken")
            
            self.currentUser = loginResponse.user
            self.isAuthenticated = true
            
        } catch {
            self.error = error.localizedDescription
            print("[Auth] Login error: \(error)")
        }
        
        isLoading = false
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
            
            let data = try await apiClient.post("/api/auth/mobile/register", body: credentials)
            let registerResponse = try JSONDecoder().decode(RegisterResponse.self, from: data)
            
            // After successful registration, attempt to login
            await login(username: username, password: password)
            
        } catch {
            self.error = error.localizedDescription
            print("[Auth] Registration error: \(error)")
        }
        
        isLoading = false
    }
    
    private func loginAsDemoUser() async throws {
        let data = try await apiClient.post("/api/auth/mobile/login", body: ["username": "demo", "password": "demo"])
        let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
        
        try KeychainManager.saveToken(loginResponse.tokens.accessToken, forKey: "accessToken")
        try KeychainManager.saveToken(loginResponse.tokens.refreshToken, forKey: "refreshToken")
        
        self.currentUser = loginResponse.user
        self.isAuthenticated = true
    }
    
    private func checkAuthentication() async {
        guard let accessToken = try? KeychainManager.getToken(forKey: "accessToken") else {
            self.isAuthenticated = false
            return
        }
        
        // Verify token and refresh if needed
        do {
            let data = try await apiClient.get("/api/auth/mobile/verify")
            let user = try JSONDecoder().decode(User.self, from: data)
            self.currentUser = user
            self.isAuthenticated = true
        } catch {
            print("[Auth] Token verification failed: \(error)")
            self.isAuthenticated = false
            // Clear invalid tokens
            try? KeychainManager.deleteToken(forKey: "accessToken")
            try? KeychainManager.deleteToken(forKey: "refreshToken")
        }
    }
    
    func logout() {
        try? KeychainManager.deleteToken(forKey: "accessToken")
        try? KeychainManager.deleteToken(forKey: "refreshToken")
        self.currentUser = nil
        self.isAuthenticated = false
    }
} 