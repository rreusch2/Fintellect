//
//  ContentView.swift
//  FintellectMobile
//
//  Created by user273382 on 1/13/25.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var authViewModel = AuthViewModel()
    @AppStorage("hasSeenWelcome") private var hasSeenWelcome = false
    
    var body: some View {
        Group {
            if !hasSeenWelcome {
                WelcomeView(hasSeenWelcome: $hasSeenWelcome)
                    .environmentObject(authViewModel)
            } else if authViewModel.isAuthenticated {
                MainTabView()
                    .environmentObject(authViewModel)
            } else {
                AuthView()
                    .environmentObject(authViewModel)
            }
        }
    }
}

#Preview {
    ContentView()
}