import SwiftUI

// MARK: - Income Structure Section
struct IncomeStructureSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    @State private var showAddIncomeSource = false
    @State private var newIncomeSource = IncomeSource(
        type: .salary,
        amount: 0,
        frequency: .monthly,
        description: ""
    )
    
    var body: some View {
        VStack(spacing: 16) {
            // Primary Income
            FormCard {
                VStack(spacing: 16) {
                    TextField("Primary Income", value: $viewModel.profile.requiredInfo.incomeStructure.primaryIncome, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Picker("Frequency", selection: $viewModel.profile.requiredInfo.incomeStructure.frequency) {
                        ForEach(IncomeFrequency.allCases, id: \.self) { frequency in
                            Text(frequency.rawValue).tag(frequency)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    Stepper("Income Stability: \(viewModel.profile.requiredInfo.incomeStructure.stabilityRating)", 
                           value: $viewModel.profile.requiredInfo.incomeStructure.stabilityRating, 
                           in: 1...5)
                }
            }
            
            // Additional Income Sources
            VStack(alignment: .leading, spacing: 8) {
                Text("Additional Income Sources")
                    .font(.headline)
                    .foregroundColor(.white)
                
                ForEach(viewModel.profile.requiredInfo.incomeStructure.additionalSources) { source in
                    IncomeSourceCard(source: source)
                }
                .onDelete { indexSet in
                    viewModel.removeIncomeSource(at: indexSet)
                }
                
                Button(action: { showAddIncomeSource = true }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Income Source")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(hex: "3B82F6"), style: StrokeStyle(lineWidth: 2, dash: [5]))
                    )
                }
            }
        }
        .sheet(isPresented: $showAddIncomeSource) {
            AddIncomeSourceSheet(source: $newIncomeSource, isPresented: $showAddIncomeSource) { source in
                viewModel.addIncomeSource(source)
            }
        }
    }
}

// MARK: - Income Source Card
struct IncomeSourceCard: View {
    let source: IncomeSource
    
    var body: some View {
        FormCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(source.type.rawValue)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "3B82F6"))
                    Spacer()
                    Text(source.frequency.rawValue)
                        .font(.caption)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
                
                if !source.description.isEmpty {
                    Text(source.description)
                        .font(.body)
                        .foregroundColor(.white)
                }
                
                Text("$\(source.amount, specifier: "%.2f")")
                    .font(.subheadline)
                    .foregroundColor(.white)
            }
        }
    }
}

// MARK: - Add Income Source Sheet
struct AddIncomeSourceSheet: View {
    @Binding var source: IncomeSource
    @Binding var isPresented: Bool
    let onSave: (IncomeSource) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Income Source Details")) {
                    Picker("Type", selection: $source.type) {
                        ForEach(IncomeSourceType.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                    
                    TextField("Amount", value: $source.amount, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                    
                    Picker("Frequency", selection: $source.frequency) {
                        ForEach(IncomeFrequency.allCases, id: \.self) { frequency in
                            Text(frequency.rawValue).tag(frequency)
                        }
                    }
                    
                    TextField("Description (Optional)", text: $source.description)
                }
            }
            .navigationTitle("Add Income Source")
            .navigationBarItems(
                leading: Button("Cancel") {
                    isPresented = false
                },
                trailing: Button("Save") {
                    onSave(source)
                    isPresented = false
                }
                .disabled(source.amount <= 0)
            )
        }
    }
} 