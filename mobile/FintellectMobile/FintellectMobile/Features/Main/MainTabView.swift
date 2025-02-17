import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView()
            }
            .tabItem {
                Image(systemName: "chart.bar.fill")
                Text("Dashboard")
            }
            .tag(0)
            
            NavigationStack {
                TransactionsView()
            }
            .tabItem {
                Image(systemName: "list.bullet")
                Text("Transactions")
            }
            .tag(1)
            
            NavigationStack {
                AIHubView()
                    .navigationDestination(for: NavigationDestination.self) { destination in
                        switch destination {
                        case .aiFinancialAssistant:
                            AIFinancialAssistantView()
                        case .aiInvestment:
                            AIInvestmentView()
                        }
                    }
            }
            .tabItem {
                Image(systemName: "brain")
                Text("AI Hub")
            }
            .tag(2)
            
            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Image(systemName: "person.fill")
                Text("Profile")
            }
            .tag(3)
        }
        .tint(Color(hex: "3B82F6"))
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthViewModel())
} 