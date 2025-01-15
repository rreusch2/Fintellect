import Foundation

struct User: Codable, Identifiable {
    let id: String
    var username: String
    var email: String
    var hasPlaidSetup: Bool
    
    // Additional user properties can be added here
} 