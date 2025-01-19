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
        print("[API] Making GET request to: \(path)")
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add auth header if token exists
        if let token = try? KeychainManager.getToken(forKey: "accessToken") {
            print("[API] Adding auth header with token: \(String(token.prefix(20)))...")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else {
            print("[API] No access token found for request")
        }
        
        return try await performRequest(request)
    }
    
    func post(_ path: String, body: [String: Any]) async throws -> Data {
        print("[API] Making POST request to: \(path)")
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add auth header if token exists
        if let token = try? KeychainManager.getToken(forKey: "accessToken") {
            print("[API] Adding auth header with token: \(String(token.prefix(20)))...")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else {
            print("[API] No access token found for request")
        }
        
        // Convert body to JSON data
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        return try await performRequest(request)
    }
    
    private func performRequest(_ request: URLRequest, retryCount: Int = 0) async throws -> Data {
        if retryCount >= 3 {
            print("[API] Max retry attempts reached (\(retryCount))")
            throw APIError.serverError("Max retry attempts reached")
        }
        
        // Log request headers for debugging
        print("[API] Request headers:")
        request.allHTTPHeaders?.forEach { key, value in
            print("[API] \(key): \(value)")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("[API] Invalid response type")
            throw APIError.invalidResponse
        }
        
        print("[API] Response status code: \(httpResponse.statusCode)")
        
        // Handle 401 Unauthorized
        if httpResponse.statusCode == 401 {
            print("[API] Unauthorized - attempting token refresh (attempt \(retryCount + 1))")
            
            do {
                guard let newToken = try await refreshToken() else {
                    print("[API] Token refresh failed - no new token received")
                    throw APIError.serverError("Token refresh failed")
                }
                
                print("[API] Successfully obtained new token: \(String(newToken.prefix(20)))...")
                
                // Update the request with new token
                var newRequest = request
                newRequest.setValue("Bearer \(newToken)", forHTTPHeaderField: "Authorization")
                
                // Log the new request headers
                print("[API] New request headers after token refresh:")
                newRequest.allHTTPHeaders?.forEach { key, value in
                    print("[API] \(key): \(value)")
                }
                
                // Retry the request with new token
                return try await performRequest(newRequest, retryCount: retryCount + 1)
            } catch {
                print("[API] Error during token refresh: \(error)")
                throw error
            }
        }
        
        // Handle error responses
        if httpResponse.statusCode >= 400 {
            print("[API] Error response with status code: \(httpResponse.statusCode)")
            if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                print("[API] Error response body: \(errorJson)")
                if let errorMessage = errorJson["error"] as? String {
                    throw APIError.serverError(errorMessage)
                }
            }
            throw APIError.serverError("Unknown server error")
        }
        
        return data
    }
    
    private func refreshToken() async throws -> String? {
        guard let refreshToken = try? KeychainManager.getToken(forKey: "refreshToken") else {
            print("[API] No refresh token found")
            return nil
        }
        
        print("[API] Attempting to refresh token using refresh token: \(String(refreshToken.prefix(20)))...")
        
        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/mobile/refresh")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["refreshToken": refreshToken]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("[API] Invalid response type during token refresh")
            return nil
        }
        
        print("[API] Token refresh response status: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode == 200,
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let newAccessToken = json["accessToken"] as? String {
            print("[API] Successfully received new access token")
            KeychainManager.saveToken(newAccessToken, forKey: "accessToken")
            return newAccessToken
        } else {
            print("[API] Token refresh failed - Invalid response format")
            if let responseString = String(data: data, encoding: .utf8) {
                print("[API] Response body: \(responseString)")
            }
            return nil
        }
    }
}

extension URLRequest {
    var allHTTPHeaders: [String: String]? {
        return self.allHTTPHeaderFields
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