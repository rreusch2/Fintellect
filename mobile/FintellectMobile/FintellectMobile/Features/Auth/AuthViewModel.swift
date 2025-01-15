import Foundation
import SwiftUI

final class AuthViewModel: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: String?
    
    init() {
        // Initialize with demo data for now
        self.currentUser = User(
            id: "1",
            username: "Demo User",
            email: "demo@example.com",
            hasPlaidSetup: false
        )
        self.isAuthenticated = true
    }
    
    func login(username: String, password: String) {
        isLoading = true
        error = nil
        
        // Simulate network delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            // TODO: Replace with actual API call when integrating backend
            self.currentUser = User(
                id: "1",
                username: username,
                email: "\(username)@example.com",
                hasPlaidSetup: false
            )
            self.isAuthenticated = true
            self.isLoading = false
        }
    }
    
    func logout() {
        isLoading = true
        // TODO: Add actual logout logic here when integrating with backend
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.currentUser = nil
            self.isAuthenticated = false
            self.isLoading = false
        }
    }
    
    func updateUser(_ user: User) {
        self.currentUser = user
    }
} 