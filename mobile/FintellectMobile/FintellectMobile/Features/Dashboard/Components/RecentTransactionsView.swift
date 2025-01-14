import SwiftUI

struct RecentTransactionsView: View {
    let transactions: [Transaction]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Recent Transactions")
                .font(.headline)
            
            if transactions.isEmpty {
                Text("No recent transactions")
                    .foregroundColor(.secondary)
            } else {
                ForEach(transactions.prefix(5)) { transaction in
                    TransactionRow(transaction: transaction)
                }
                
                Button(action: {
                    // TODO: Navigate to full transactions list
                }) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct TransactionRow: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(transaction.description)
                    .font(.subheadline)
                    .lineLimit(1)
                
                Text(transaction.category)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(transaction.formattedAmount)
                .font(.subheadline)
                .foregroundColor(transaction.amount > 0 ? .red : .green)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    RecentTransactionsView(transactions: [])
} 