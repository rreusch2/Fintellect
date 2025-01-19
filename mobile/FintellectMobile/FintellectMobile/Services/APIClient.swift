import Foundation

class APIClient {
    static let shared = APIClient()
    private let baseURL: String
    private let session: URLSession
    private let retryQueue = DispatchQueue(label: "com.fintellect.apiretry")
    
    private init() {
        #if DEBUG
        self.baseURL = "http://216.39.74.173:5001"  // Remove /api since it's included in request paths
        #else
        self.baseURL = "https://api.fintellect.app" // Production URL
        #endif
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
        
        print("[API] Initialized with base URL: \(baseURL)")
    }
    
    func get(_ path: String) async throws -> Data {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add auth header if token exists
        if let token = try? KeychainManager.getToken(forKey: "accessToken") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        return try await performRequest(request)
    }
    
    func post(_ path: String, body: [String: Any]) async throws -> Data {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add auth header if token exists
        if let token = try? KeychainManager.getToken(forKey: "accessToken") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Convert body to JSON data
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        print("[API] POST request to: \(path)")
        return try await performRequest(request)
    }
    
    private func performRequest(_ request: URLRequest, retryCount: Int = 0) async throws -> Data {
        if retryCount >= 3 {
            throw APIError.serverError("Max retry attempts reached")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("[API] Invalid response type")
            throw APIError.invalidResponse
        }
        
        print("[API] Response status code: \(httpResponse.statusCode)")
        
        // Handle 401 Unauthorized
        if httpResponse.statusCode == 401 {
            print("[API] Unauthorized - attempting token refresh")
            if let newToken = try? await refreshToken() {
                // Update the request with new token
                var newRequest = request
                newRequest.setValue("Bearer \(newToken)", forHTTPHeaderField: "Authorization")
                
                // Retry the request with new token
                return try await performRequest(newRequest, retryCount: retryCount + 1)
            } else {
                throw APIError.serverError("Token refresh failed")
            }
        }
        
        // Handle error responses
        if httpResponse.statusCode >= 400 {
            if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorMessage = errorJson["error"] as? String {
                print("[API] Error response: \(errorMessage)")
                throw APIError.serverError(errorMessage)
            } else {
                throw APIError.serverError("Unknown server error")
            }
        }
        
        return data
    }
    
    private func refreshToken() async throws -> String? {
        guard let refreshToken = try? KeychainManager.getToken(forKey: "refreshToken") else {
            print("[API] No refresh token found")
            return nil
        }
        
        print("[API] Attempting to refresh token")
        
        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/mobile/refresh")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["refreshToken": refreshToken]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let newAccessToken = json["accessToken"] as? String else {
            print("[API] Token refresh failed")
            return nil
        }
        
        // Save new access token
        print("[API] Saving new access token")
        KeychainManager.saveToken(newAccessToken, forKey: "accessToken")
        print("[API] Token refreshed successfully")
        
        return newAccessToken
    }
}

enum APIError: Error {
    case invalidResponse
    case serverError(String)
    case decodingError(Error)
}

extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let message):
            return message
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        }
    }
} 