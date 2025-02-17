import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showingPasswordSheet = false
    @State private var showingNotificationSettings = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Header
                ProfileHeader(user: authViewModel.currentUser)
                
                // Connected Accounts Section
                VStack(alignment: .leading, spacing: 16) {
                    SectionTitle(title: "Connected Accounts", icon: "link.circle.fill")
                    
                    if let user = authViewModel.currentUser {
                        if user.hasPlaidSetup {
                            ConnectedAccountRow(
                                title: "Bank Account",
                                subtitle: "Connected via Plaid",
                                iconName: "building.columns.fill",
                                showDisconnect: true,
                                onDisconnect: {
                                    // Will implement Plaid disconnect later
                                }
                            )
                        } else {
                            ConnectPlaidButton()
                        }
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "1E293B"))
                )
                .padding(.horizontal)
                
                // Settings Section
                VStack(alignment: .leading, spacing: 16) {
                    SectionTitle(title: "Settings", icon: "gear")
                    
                    VStack(spacing: 4) {
                        SettingsButton(
                            title: "Change Password",
                            icon: "lock.fill",
                            action: { showingPasswordSheet = true }
                        )
                        
                        SettingsButton(
                            title: "Notification Settings",
                            icon: "bell.fill",
                            action: { showingNotificationSettings = true }
                        )
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "1E293B"))
                )
                .padding(.horizontal)
                
                // Sign Out Button
                Button(action: {
                    Task {
                        await authViewModel.logout()
                    }
                }) {
                    HStack {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        }
                        Text("Sign Out")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color(hex: "EF4444"))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .padding(.horizontal)
                .disabled(authViewModel.isLoading)
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.large)
    }
}

// MARK: - Profile Header
struct ProfileHeader: View {
    let user: User?
    
    var body: some View {
        VStack(spacing: 16) {
            // Profile Image
            ZStack {
                Circle()
                    .fill(Color(hex: "3B82F6"))
                    .frame(width: 100, height: 100)
                
                Text(user?.username.prefix(1).uppercased() ?? "?")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.white)
            }
            
            // User Info
            VStack(spacing: 8) {
                Text(user?.username ?? "User")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                if let income = user?.monthlyIncome {
                    Text("Monthly Income: \((Double(income) / 100).formatted(.currency(code: "USD")))")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(hex: "1E293B"))
        )
        .padding(.horizontal)
    }
}

// MARK: - Section Title
struct SectionTitle: View {
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

// MARK: - Connected Account Row
struct ConnectedAccountRow: View {
    let title: String
    let subtitle: String
    let iconName: String
    let showDisconnect: Bool
    let onDisconnect: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: iconName)
                .font(.system(size: 24))
                .foregroundColor(Color(hex: "3B82F6"))
                .frame(width: 40, height: 40)
                .background(Color(hex: "3B82F6").opacity(0.2))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(Color(hex: "94A3B8"))
            }
            
            Spacer()
            
            if showDisconnect {
                Button(action: onDisconnect) {
                    Text("Disconnect")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(Color(hex: "EF4444"))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color(hex: "EF4444").opacity(0.2))
                        .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(hex: "0F172A"))
        .cornerRadius(12)
    }
}

// MARK: - Connect Plaid Button
struct ConnectPlaidButton: View {
    var body: some View {
        Button(action: {
            // Will implement Plaid connection later
        }) {
            HStack {
                Image(systemName: "plus.circle.fill")
                Text("Connect Bank Account")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(hex: "3B82F6"))
            .foregroundColor(.white)
            .cornerRadius(12)
        }
    }
}

// MARK: - Settings Button
struct SettingsButton: View {
    let title: String
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(Color(hex: "3B82F6"))
                    .frame(width: 32, height: 32)
                    .background(Color(hex: "3B82F6").opacity(0.2))
                    .clipShape(Circle())
                
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.white)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(Color(hex: "64748B"))
            }
            .padding()
            .background(Color(hex: "0F172A"))
            .cornerRadius(12)
        }
    }
}

#Preview {
    NavigationView {
        ProfileView()
            .environmentObject(AuthViewModel())
    }
} 