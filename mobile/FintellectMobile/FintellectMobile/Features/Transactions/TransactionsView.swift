import SwiftUI
import Charts

// MARK: - Transactions View
struct TransactionsView: View {
    @StateObject private var viewModel = TransactionsViewModel()
    @State private var searchText = ""
    @State private var showDatePicker = false
    @State private var selectedLimit = 10
    @State private var selectedCategory: TransactionCategory?
    
    private let limitOptions = [10, 20, 50, 100]
    
    var filteredTransactions: [Transaction] {
        Array(viewModel.transactions
            .filter { transaction in
                if searchText.isEmpty { return true }
                return transaction.name.localizedCaseInsensitiveContains(searchText) ||
                       transaction.category.displayName.localizedCaseInsensitiveContains(searchText)
            }
            .filter { transaction in
                if let startDate = viewModel.startDate, let endDate = viewModel.endDate {
                    return transaction.date >= startDate && transaction.date <= endDate
                }
                return true
            }
            .filter { transaction in
                if let selectedCategory = selectedCategory {
                    return transaction.category == selectedCategory
                }
                return true
            }
            .prefix(selectedLimit))
    }
    
    var categories: [TransactionCategory] {
        Array(Set(viewModel.transactions.map { $0.category })).sorted { a, b in
            a.displayName < b.displayName
        }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Stats Section
                VStack(spacing: 16) {
                    HStack(spacing: 16) {
                        StatCard(
                            title: "Total Spending",
                            value: viewModel.totalSpending.formatted(.currency(code: "USD")),
                            icon: "dollarsign.circle.fill",
                            color: .blue
                        )
                        
                        if let topCategory = viewModel.topCategory {
                            StatCard(
                                title: "Top Category",
                                value: topCategory.displayName,
                                icon: topCategory.icon,
                                color: topCategory.color
                            )
                        }
                    }
                    
                    HStack(spacing: 16) {
                        StatCard(
                            title: "Average Transaction",
                            value: viewModel.averageTransaction.formatted(.currency(code: "USD")),
                            icon: "chart.bar.fill",
                            color: .purple
                        )
                        
                        StatCard(
                            title: "Total Transactions",
                            value: "\(viewModel.transactions.count)",
                            icon: "list.bullet.rectangle.fill",
                            color: .orange
                        )
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                
                // Category Filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        CategoryFilterButton(
                            title: "All",
                            isSelected: selectedCategory == nil,
                            color: .gray
                        ) {
                            selectedCategory = nil
                        }
                        
                        ForEach(categories, id: \.self) { category in
                            CategoryFilterButton(
                                title: category.displayName,
                                isSelected: selectedCategory == category,
                                color: category.color
                            ) {
                                selectedCategory = category
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
                
                // Transactions List
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.error {
                    ErrorView(error: error) {
                        Task {
                            await viewModel.fetchTransactions()
                        }
                    }
                } else if viewModel.transactions.isEmpty {
                    EmptyStateView()
                } else {
                    List(filteredTransactions) { transaction in
                        TransactionRow(transaction: transaction)
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await viewModel.fetchTransactions()
                    }
                }
            }
            .navigationTitle("Transactions")
        }
    }
}

// MARK: - Summary Stats Section
struct SummaryStatsSection: View {
    @ObservedObject var viewModel: TransactionsViewModel
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                StatCard(
                    title: "Total Spending",
                    value: viewModel.totalSpending.formatted(.currency(code: "USD")),
                    icon: "dollarsign.circle.fill",
                    color: .red
                )
                
                StatCard(
                    title: "Top Category (\(viewModel.topCategory?.rawValue ?? "None"))",
                    value: viewModel.topCategoryAmount.formatted(.currency(code: "USD")),
                    icon: "chart.pie.fill",
                    color: viewModel.topCategory?.color ?? .gray
                )
                
                StatCard(
                    title: "Avg Transaction",
                    value: viewModel.averageTransaction.formatted(.currency(code: "USD")),
                    icon: "number.circle.fill",
                    color: Color(hex: "3B82F6")
                )
            }
            .padding(.horizontal, 16)
        }
    }
}

// MARK: - Search and Filter Section
struct SearchAndFilterSection: View {
    @Binding var searchText: String
    @Binding var showDatePicker: Bool
    @Binding var selectedLimit: Int
    let limitOptions: [Int]
    @Binding var startDate: Date?
    @Binding var endDate: Date?
    
    var body: some View {
        VStack(spacing: 16) {
            // Search Field
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                TextField("Search transactions...", text: $searchText)
                    .textFieldStyle(CustomTextFieldStyle())
            }
            .padding(.horizontal, 16)
            
            // Filters
            HStack {
                // Date Range Button
                Button {
                    withAnimation {
                        showDatePicker.toggle()
                    }
                } label: {
                    Label(
                        startDate == nil ? "Date Range" : "\(startDate?.formatted(date: .abbreviated, time: .omitted) ?? "") - \(endDate?.formatted(date: .abbreviated, time: .omitted) ?? "")",
                        systemImage: "calendar"
                    )
                    .font(.footnote)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(hex: "1E293B"))
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                
                Spacer()
                
                // Limit Picker
                Menu {
                    ForEach(limitOptions, id: \.self) { limit in
                        Button("Show \(limit)") {
                            selectedLimit = limit
                        }
                    }
                } label: {
                    Label("Show \(selectedLimit)", systemImage: "line.3.horizontal.decrease.circle")
                        .font(.footnote)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color(hex: "1E293B"))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
            }
            .padding(.horizontal, 16)
            
            // Date Picker Sheet
            if showDatePicker {
                DateRangePickerView(
                    startDate: $startDate,
                    endDate: $endDate,
                    isPresented: $showDatePicker
                )
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }
}

// MARK: - Transactions List
struct TransactionsList: View {
    let transactions: [Transaction]
    
    var body: some View {
        VStack(spacing: 16) {
            if transactions.isEmpty {
                EmptyStateView()
            } else {
                ForEach(transactions) { transaction in
                    TransactionRow(transaction: transaction)
                        .transition(.opacity)
                }
            }
        }
        .padding(.horizontal, 16)
    }
}

// MARK: - Transaction Row
struct TransactionRow: View {
    let transaction: Transaction
    
    var body: some View {
        HStack(spacing: 16) {
            // Category Icon
            Image(systemName: transaction.category.icon)
                .font(.system(size: 24))
                .foregroundColor(transaction.category.color)
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(transaction.category.color.opacity(0.2))
                )
            
            // Transaction Details
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                HStack {
                    Text(transaction.category.rawValue)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(transaction.category.color.opacity(0.2))
                        .foregroundColor(transaction.category.color)
                        .cornerRadius(8)
                    
                    Text(transaction.formattedDate)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            // Amount
            Text(transaction.formattedAmount)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(transaction.isExpense ? .red : .green)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48))
                .foregroundColor(Color(hex: "3B82F6"))
            
            Text("No Transactions Found")
                .font(.headline)
                .foregroundColor(.white)
            
            Text("Try adjusting your filters or search terms")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

// MARK: - Date Range Picker View
struct DateRangePickerView: View {
    @Binding var startDate: Date?
    @Binding var endDate: Date?
    @Binding var isPresented: Bool
    
    var body: some View {
        VStack {
            HStack {
                Text("Select Date Range")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Button("Done") {
                    withAnimation {
                        isPresented = false
                    }
                }
                .foregroundColor(Color(hex: "3B82F6"))
            }
            .padding()
            
            HStack(spacing: 16) {
                DatePicker(
                    "Start Date",
                    selection: Binding(
                        get: { startDate ?? Date() },
                        set: { startDate = $0 }
                    ),
                    displayedComponents: .date
                )
                .labelsHidden()
                
                DatePicker(
                    "End Date",
                    selection: Binding(
                        get: { endDate ?? Date() },
                        set: { endDate = $0 }
                    ),
                    displayedComponents: .date
                )
                .labelsHidden()
            }
            .padding()
            
            Button("Clear Dates") {
                startDate = nil
                endDate = nil
                withAnimation {
                    isPresented = false
                }
            }
            .foregroundColor(Color(hex: "EF4444"))
            .padding(.bottom)
        }
        .background(Color(hex: "1E293B"))
        .cornerRadius(16)
        .padding()
    }
}

// MARK: - Error View
struct ErrorView: View {
    let error: String
    let retryAction: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(Color(hex: "EF4444"))
            
            Text("Error Loading Transactions")
                .font(.headline)
                .foregroundColor(.white)
            
            Text(error)
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            Button(action: retryAction) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.clockwise")
                    Text("Retry")
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Color(hex: "3B82F6"))
                .foregroundColor(.white)
                .cornerRadius(8)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
        .padding(.horizontal, 16)
    }
}

// MARK: - Category Filter Button
struct CategoryFilterButton: View {
    let title: String
    let isSelected: Bool
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(isSelected ? color : Color(.systemGray6))
                )
        }
    }
}

#Preview {
    NavigationView {
        TransactionsView()
    }
} 