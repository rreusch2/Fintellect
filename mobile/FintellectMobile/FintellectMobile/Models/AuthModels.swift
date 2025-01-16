import Foundation

// MARK: - Authentication Response Models
struct LoginResponse: Codable {
    let message: String
    let user: User
    let tokens: Tokens
}

struct RegisterResponse: Codable {
    let message: String
    let user: User
}

struct RefreshResponse: Codable {
    let message: String
    let accessToken: String
}

struct Tokens: Codable {
    let accessToken: String
    let refreshToken: String
} 