import SwiftUI
import Charts

// MARK: - Transactions View
struct TransactionsView: View {
    @StateObject private var viewModel = TransactionsViewModel()
    @State private var searchText = ""
    @State private var showDatePicker = false
    @State private var selectedLimit = 10
    
    private let limitOptions = [10, 20, 50, 100]
    
    var filteredTransactions: [Transaction] {
        viewModel.transactions
            .filter { transaction in
                if searchText.isEmpty { return true }
                return transaction.name.localizedCaseInsensitiveContains(searchText) ||
                       transaction.category.rawValue.localizedCaseInsensitiveContains(searchText)
            }
            .filter { transaction in
                if let startDate = viewModel.startDate, let endDate = viewModel.endDate {
                    return transaction.date >= startDate && transaction.date <= endDate
                }
                return true
            }
            .prefix(selectedLimit)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Summary Stats Section
                SummaryStatsSection(viewModel: viewModel)
                
                // Search and Filter Section
                SearchAndFilterSection(
                    searchText: $searchText,
                    showDatePicker: $showDatePicker,
                    selectedLimit: $selectedLimit,
                    limitOptions: limitOptions,
                    startDate: $viewModel.startDate,
                    endDate: $viewModel.endDate
                )
                
                // Transactions List
                TransactionsList(transactions: Array(filteredTransactions))
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationTitle("Transactions")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        TransactionsView()
    }
} 