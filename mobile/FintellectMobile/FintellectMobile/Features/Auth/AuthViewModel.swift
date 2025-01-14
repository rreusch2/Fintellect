import Foundation

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var error: String?
    
    func login(username: String, password: String) async {
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