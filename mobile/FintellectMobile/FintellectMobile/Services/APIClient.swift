import Foundation

enum APIError: Error {
    case invalidURL
    case networkError(Error)
    case invalidResponse
    case decodingError(Error)
    case unauthorized
    case serverError(String)
    case tokenExpired
}

class APIClient {
    static let shared = APIClient()
    private let baseURL = URL(string: "http://192.168.1.98:5001")!
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: configuration)
        
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }
    
    private func addAuthHeader(_ request: inout URLRequest) {
        if let token = KeychainManager.getToken(forKey: "accessToken") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }
    
    private func handleResponse<T: Decodable>(_ data: Data, _ response: URLResponse) throws -> T {
        guard let httpResponse = response as? HTTPURLResponse else {
            print("[API] Invalid response type")
            throw APIError.invalidResponse
        }
        
        print("[API] Response status code: \(httpResponse.statusCode)")
        
        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                print("[API] Decoding error:", error)
                throw APIError.decodingError(error)
            }
        case 401:
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = json["error"] as? String,
               error == "Token expired" {
                print("[API] Token expired")
                throw APIError.tokenExpired
            }
            print("[API] Unauthorized")
            throw APIError.unauthorized
        default:
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = json["error"] as? String {
                print("[API] Server error:", error)
                throw APIError.serverError(error)
            }
            print("[API] Unknown server error")
            throw APIError.serverError("Unknown error occurred")
        }
    }
    
    func get<T: Decodable>(_ endpoint: String) async throws -> T {
        print("[API] GET request to:", endpoint)
        
        let url = baseURL.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(&request)
        
        do {
            let (data, response) = try await session.data(for: request)
            return try handleResponse(data, response)
        } catch let error as APIError {
            throw error
        } catch {
            print("[API] Network error:", error)
            throw APIError.networkError(error)
        }
    }
    
    func post<T: Decodable, E: Encodable>(_ endpoint: String, body: E) async throws -> T {
        print("[API] POST request to:", endpoint)
        
        let url = baseURL.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(&request)
        
        do {
            request.httpBody = try encoder.encode(body)
            
            let (data, response) = try await session.data(for: request)
            return try handleResponse(data, response)
        } catch let error as APIError {
            throw error
        } catch {
            print("[API] Network error:", error)
            throw APIError.networkError(error)
        }
    }
    
    func put<T: Decodable, E: Encodable>(_ endpoint: String, body: E) async throws -> T {
        print("[API] PUT request to:", endpoint)
        
        let url = baseURL.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(&request)
        
        do {
            request.httpBody = try encoder.encode(body)
            
            let (data, response) = try await session.data(for: request)
            return try handleResponse(data, response)
        } catch let error as APIError {
            throw error
        } catch {
            print("[API] Network error:", error)
            throw APIError.networkError(error)
        }
    }
    
    func delete<T: Decodable>(_ endpoint: String) async throws -> T {
        print("[API] DELETE request to:", endpoint)
        
        let url = baseURL.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(&request)
        
        do {
            let (data, response) = try await session.data(for: request)
            return try handleResponse(data, response)
        } catch let error as APIError {
            throw error
        } catch {
            print("[API] Network error:", error)
            throw APIError.networkError(error)
        }
    }
} 