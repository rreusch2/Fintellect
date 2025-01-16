//
//  FintellectMobileApp.swift
//  FintellectMobile
//
//  Created by user273382 on 1/13/25.
//

import SwiftUI

@main
struct FintellectMobileApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    @AppStorage("hasSeenWelcome") private var hasSeenWelcome = false
    
    var body: some Scene {
        WindowGroup {

            if authViewModel.isAuthenticated {
                MainTabView()
                    .environmentObject(authViewModel)
            } else if hasSeenWelcome {
                AuthView(hasSeenWelcome: $hasSeenWelcome)
                    .environmentObject(authViewModel)
            } else {
                WelcomeView(hasSeenWelcome: $hasSeenWelcome)
                    .environmentObject(authViewModel)
            }
        
        }
    }
}
