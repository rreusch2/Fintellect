//
//  FintellectMobileApp.swift
//  FintllectMobile
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
            Group {
                if authViewModel.isAuthenticated {
                    if let user = authViewModel.currentUser {
                        if user.hasCompletedOnboarding {
                            MainTabView()
                                .environmentObject(authViewModel)
                                .transition(.opacity)
                        } else {
                            OnboardingView()
                                .environmentObject(authViewModel)
                                .transition(.opacity)
                        }
                    }
                } else {
                    if hasSeenWelcome {
                        AuthView(hasSeenWelcome: $hasSeenWelcome)
                            .environmentObject(authViewModel)
                            .transition(.opacity)
                    } else {
                        WelcomeView(hasSeenWelcome: $hasSeenWelcome)
                            .environmentObject(authViewModel)
                            .transition(.opacity)
                    }
                }
            }
            .animation(.easeInOut, value: authViewModel.isAuthenticated)
            .animation(.easeInOut, value: authViewModel.currentUser?.hasCompletedOnboarding)
            .onChange(of: authViewModel.isAuthenticated) { newValue in
                print("[App] Authentication state changed: \(newValue)")
            }
            .onChange(of: authViewModel.currentUser?.hasCompletedOnboarding) { completed in
                print("[App] Onboarding completion state changed: \(String(describing: completed))")
            }
        }
    }
}
