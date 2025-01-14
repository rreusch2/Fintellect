import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    if let user = authViewModel.currentUser {
                        Text("Username: \(user.username)")
                        if let income = user.monthlyIncome {
                            Text("Monthly Income: \(income.formatted(.currency(code: "USD")))")
                        }
                    }
                }
                
                Section {
                    Button(role: .destructive, action: {
                        Task {
                            await authViewModel.logout()
                        }
                    }) {
                        Text("Sign Out")
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthViewModel())
} 