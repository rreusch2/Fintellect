import Foundation

class APIClient {
    static let shared = APIClient()
    private let baseURL: String
    private let session: URLSession
    
    private init() {
        #if DEBUG
        // For MacinCloud, we need to use the actual IP address
        if let serverURL = ProcessInfo.processInfo.environment["SERVER_URL"] {
            self.baseURL = serverURL
        } else {
            // Default to MacinCloud server
            self.baseURL = "https://216.39.74.172:5001"
        }
        print("[API] Using server URL: \(self.baseURL)")
        
        // Allow self-signed certificates in debug mode
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        
        let trustAllCerts = true // Set to false if you want to enforce certificate validation
        if trustAllCerts {
            let trustAllDelegate = TrustAllSessionDelegate()
            self.session = URLSession(configuration: config, delegate: trustAllDelegate, delegateQueue: nil)
            print("[API] Warning: Certificate validation disabled for development")
        } else {
            self.session = URLSession(configuration: config)
        }
        #else
        self.baseURL = "https://api.fintellect.app" // Production URL
        self.session = URLSession(configuration: .default)
        #endif
        
        print("[API] Initialized with base URL: \(baseURL)")
    }
    
    func get(_ path: String) async throws -> Data {
        var request = URLRequest(url: URL(string: "\(baseURL)\(path)")!)
        request.httpMethod = "GET"
        
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
        
        // Add auth header if token exists
        if let token = try? KeychainManager.getToken(forKey: "accessToken") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Convert body to JSON data
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        print("[API] POST request to: \(path)")
        if let bodyString = String(data: request.httpBody!, encoding: .utf8) {
            print("[API] Request body: \(bodyString)")
        }
        
        return try await performRequest(request)
    }
    
    private func performRequest(_ request: URLRequest) async throws -> Data {
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("[API] Invalid response type")
                throw APIError.invalidResponse
            }
            
            print("[API] Response status code: \(httpResponse.statusCode)")
            
            // Log response body for debugging
            if let responseString = String(data: data, encoding: .utf8) {
                print("[API] Response body: \(responseString)")
            }
            
            // Handle error responses
            if httpResponse.statusCode >= 400 {
                if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    let errorMessage = errorJson["error"] as? String ?? errorJson["message"] as? String ?? "Unknown server error"
                    print("[API] Error response: \(errorMessage)")
                    throw APIError.serverError(errorMessage)
                } else if let errorText = String(data: data, encoding: .utf8) {
                    print("[API] Error text: \(errorText)")
                    throw APIError.serverError(errorText)
                } else {
                    throw APIError.serverError("Unknown server error")
                }
            }
            
            return data
        } catch let error as APIError {
            throw error
        } catch {
            print("[API] Network error: \(error)")
            throw APIError.serverError("Network error: \(error.localizedDescription)")
        }
    }
}

// MARK: - SSL Certificate Handling for Development
class TrustAllSessionDelegate: NSObject, URLSessionDelegate {
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, 
                   completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        print("[API] Received SSL challenge")
        
        if challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust {
            if let serverTrust = challenge.protectionSpace.serverTrust {
                let credential = URLCredential(trust: serverTrust)
                print("[API] Accepting server certificate for development")
                completionHandler(.useCredential, credential)
                return
            }
        }
        
        // If we get here, use the default handling
        completionHandler(.performDefaultHandling, nil)
    }
}

enum APIError: Error {
    case invalidResponse
    case serverError(String)
    case decodingError(Error)
    case networkError(Error)
    case invalidURL
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
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidURL:
            return "Invalid server URL"
        }
    }
} 