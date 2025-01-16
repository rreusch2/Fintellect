import Foundation

struct User: Codable {
    let id: Int
    let username: String
    let hasCompletedOnboarding: Bool
    let hasPlaidSetup: Bool
}

struct LoginResponse: Codable {
    let user: User
    let tokens: Tokens?
    let message: String?
}

struct RegisterResponse: Codable {
    let user: User
}

struct RefreshResponse: Codable {
    let accessToken: String
}

struct Tokens: Codable {
    let accessToken: String
    let refreshToken: String
} 