import SwiftUI

struct RecentTransactionsView: View {
    let transactions: [Transaction]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recent Transactions")
                .font(.headline)
                .foregroundColor(.white)
            
            if transactions.isEmpty {
                Text("No recent transactions")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            } else {
                ForEach(transactions.prefix(5)) { transaction in
                    TransactionRowView(transaction: transaction)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

struct TransactionRowView: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            // Category Icon
            Image(systemName: transaction.category.icon)
                .foregroundColor(transaction.category.color)
                .frame(width: 32, height: 32)
                .background(
                    Circle()
                        .fill(transaction.category.color.opacity(0.2))
                )
            
            // Transaction Details
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.name)
                    .font(.subheadline)
                    .foregroundColor(.white)
                
                Text(transaction.formattedDate)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Amount
            Text(transaction.formattedAmount)
                .font(.subheadline)
                .foregroundColor(transaction.isExpense ? .red : .green)
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    RecentTransactionsView(transactions: [])
} 