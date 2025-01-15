import Foundation
import SwiftUI

final class AuthViewModel: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    
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
    
    func logout() {
        isLoading = true
        // Add actual logout logic here when integrating with backend
        currentUser = nil
        isAuthenticated = false
        isLoading = false
    }
} 