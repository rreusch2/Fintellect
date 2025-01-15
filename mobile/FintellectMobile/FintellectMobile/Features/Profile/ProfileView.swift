import SwiftUI

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showingPasswordChange = false
    @State private var showingNotificationSettings = false
    @State private var showingLogoutAlert = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Header
                ProfileHeader(username: authViewModel.currentUser?.username ?? "User")
                
                // Main Content
                VStack(spacing: 20) {
                    // Connected Accounts Section
                    ConnectedAccountsSection(hasPlaidConnected: authViewModel.currentUser?.hasPlaidSetup ?? false)
                    
                    // Settings Section
                    SettingsSection(
                        showingPasswordChange: $showingPasswordChange,
                        showingNotificationSettings: $showingNotificationSettings
                    )
                    
                    // Support Section
                    SupportSection()
                    
                    // Logout Button
                    LogoutButton(showingAlert: $showingLogoutAlert)
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Logout", isPresented: $showingLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Logout", role: .destructive) {
                authViewModel.logout()
            }
        } message: {
            Text("Are you sure you want to logout?")
        }
    }
}

// MARK: - Profile Header
struct ProfileHeader: View {
    let username: String
    
    var body: some View {
        VStack(spacing: 16) {
            // Profile Image
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        colors: [Color(hex: "3B82F6"), Color(hex: "2563EB")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 100, height: 100)
                    .shadow(color: Color(hex: "3B82F6").opacity(0.3), radius: 10)
                
                Text(username.prefix(1).uppercased())
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
            }
            
            // Username
            Text(username)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
        .padding(.vertical)
    }
}

// MARK: - Connected Accounts Section
struct ConnectedAccountsSection: View {
    let hasPlaidConnected: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(title: "Connected Accounts", icon: "link.circle.fill")
            
            VStack(spacing: 12) {
                // Plaid Account Status
                HStack {
                    HStack(spacing: 12) {
                        Image(systemName: "building.columns.fill")
                            .font(.system(size: 20))
                            .foregroundColor(hasPlaidConnected ? Color(hex: "22C55E") : Color(hex: "64748B"))
                            .frame(width: 32)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Bank Account")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            Text(hasPlaidConnected ? "Connected via Plaid" : "Not connected")
                                .font(.caption)
                                .foregroundColor(Color(hex: "94A3B8"))
                        }
                    }
                    
                    Spacer()
                    
                    if hasPlaidConnected {
                        Button(action: {
                            // Handle disconnect
                        }) {
                            Text("Disconnect")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(Color(hex: "EF4444"))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(hex: "EF4444").opacity(0.1))
                                .clipShape(Capsule())
                        }
                    } else {
                        Button(action: {
                            // Handle connect
                        }) {
                            Text("Connect")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(Color(hex: "22C55E"))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(hex: "22C55E").opacity(0.1))
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding()
                .background(Color(hex: "1E293B"))
                .cornerRadius(16)
            }
        }
        .padding()
        .background(Color(hex: "0F172A"))
        .cornerRadius(20)
    }
}

// MARK: - Settings Section
struct SettingsSection: View {
    @Binding var showingPasswordChange: Bool
    @Binding var showingNotificationSettings: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(title: "Settings", icon: "gearshape.fill")
            
            VStack(spacing: 4) {
                SettingsButton(
                    title: "Change Password",
                    icon: "lock.fill",
                    color: Color(hex: "3B82F6")
                ) {
                    showingPasswordChange.toggle()
                }
                
                SettingsButton(
                    title: "Notification Settings",
                    icon: "bell.fill",
                    color: Color(hex: "8B5CF6")
                ) {
                    showingNotificationSettings.toggle()
                }
            }
        }
        .padding()
        .background(Color(hex: "0F172A"))
        .cornerRadius(20)
    }
}

// MARK: - Support Section
struct SupportSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(title: "Support", icon: "questionmark.circle.fill")
            
            VStack(spacing: 4) {
                SettingsButton(
                    title: "Help Center",
                    icon: "book.fill",
                    color: Color(hex: "F59E0B")
                ) {
                    // Handle help center
                }
                
                SettingsButton(
                    title: "Contact Support",
                    icon: "envelope.fill",
                    color: Color(hex: "10B981")
                ) {
                    // Handle contact support
                }
            }
        }
        .padding()
        .background(Color(hex: "0F172A"))
        .cornerRadius(20)
    }
}

// MARK: - Shared Components
struct SectionHeader: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(Color(hex: "3B82F6"))
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
        }
    }
}

struct SettingsButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                HStack(spacing: 12) {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(color)
                        .frame(width: 32)
                    
                    Text(title)
                        .font(.subheadline)
                        .foregroundColor(.white)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(Color(hex: "64748B"))
            }
            .padding()
            .background(Color(hex: "1E293B"))
            .cornerRadius(16)
        }
    }
}

struct LogoutButton: View {
    @Binding var showingAlert: Bool
    
    var body: some View {
        Button(action: { showingAlert.toggle() }) {
            HStack {
                Spacer()
                Text("Logout")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(hex: "EF4444"))
                Spacer()
            }
            .padding()
            .background(Color(hex: "1E293B"))
            .cornerRadius(16)
        }
        .padding(.top, 12)
    }
}

#Preview {
    NavigationView {
        ProfileView()
            .environmentObject(AuthViewModel())
    }
} 