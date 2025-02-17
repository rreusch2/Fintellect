import Foundation
import Security

enum KeychainError: Error {
    case duplicateEntry
    case unknown(OSStatus)
    case itemNotFound
    case invalidItemFormat
}

class KeychainManager {
    private static let service = "com.fintellect.mobile"
    
    static func saveToken(_ token: String, forKey key: String) {
        print("[Keychain] Saving token for key: \(key)")
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: token.data(using: .utf8)!
        ]
        
        // First try to delete any existing item
        SecItemDelete(query as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            print("[Keychain] Error saving token: \(status)")
            return
        }
        
        print("[Keychain] Token saved successfully")
    }
    
    static func getToken(forKey key: String) -> String? {
        print("[Keychain] Retrieving token for key: \(key)")
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            if status != errSecItemNotFound {
                print("[Keychain] Error retrieving token: \(status)")
            }
            return nil
        }
        
        print("[Keychain] Token retrieved successfully")
        return token
    }
    
    static func deleteToken(forKey key: String) {
        print("[Keychain] Deleting token for key: \(key)")
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        if status == errSecSuccess {
            print("[Keychain] Token deleted successfully")
        } else if status != errSecItemNotFound {
            print("[Keychain] Error deleting token: \(status)")
        }
    }
    
    static func clearAllTokens() {
        print("[Keychain] Clearing all tokens")
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        if status == errSecSuccess {
            print("[Keychain] All tokens cleared successfully")
        } else if status != errSecItemNotFound {
            print("[Keychain] Error clearing tokens: \(status)")
        }
    }
} 