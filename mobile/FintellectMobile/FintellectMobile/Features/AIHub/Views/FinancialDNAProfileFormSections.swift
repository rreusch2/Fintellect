import SwiftUI

// MARK: - Supporting Views
struct FormCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: "1E293B"))
            )
    }
}

struct GoalCard: View {
    let goal: FinancialGoal
    
    var body: some View {
        FormCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(goal.timeframe.rawValue)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "3B82F6"))
                    Spacer()
                    PriorityBadge(priority: goal.priority)
                }
                
                Text(goal.description)
                    .font(.body)
                    .foregroundColor(.white)
                
                if let amount = goal.targetAmount {
                    Text("Target: $\(amount, specifier: "%.2f")")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
            }
        }
    }
}

struct PriorityBadge: View {
    let priority: Int
    
    var color: Color {
        switch priority {
        case 1: return Color(hex: "22C55E")
        case 2: return Color(hex: "F59E0B")
        case 3: return Color(hex: "EF4444")
        default: return Color(hex: "94A3B8")
        }
    }
    
    var text: String {
        switch priority {
        case 1: return "Low"
        case 2: return "Medium"
        case 3: return "High"
        default: return "Unknown"
        }
    }
    
    var body: some View {
        Text(text)
            .font(.caption)
            .fontWeight(.medium)
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(color.opacity(0.2))
            )
    }
}

// MARK: - Form Sheets
struct AddGoalSheet: View {
    @Binding var goal: FinancialGoal
    @Binding var isPresented: Bool
    let onSave: (FinancialGoal) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Goal Details")) {
                    Picker("Timeframe", selection: $goal.timeframe) {
                        ForEach(GoalTimeframe.allCases, id: \.self) { timeframe in
                            Text(timeframe.rawValue).tag(timeframe)
                        }
                    }
                    
                    TextField("Description", text: $goal.description)
                    
                    TextField("Target Amount (Optional)", value: $goal.targetAmount, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                    
                    Picker("Priority", selection: $goal.priority) {
                        Text("Low").tag(1)
                        Text("Medium").tag(2)
                        Text("High").tag(3)
                    }
                }
            }
            .navigationTitle("Add Goal")
            .navigationBarItems(
                leading: Button("Cancel") {
                    isPresented = false
                },
                trailing: Button("Save") {
                    onSave(goal)
                    isPresented = false
                }
                .disabled(goal.description.isEmpty)
            )
        }
    }
}

// MARK: - Form Sections
struct IncomeStructureSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    
    var body: some View {
        VStack(spacing: 16) {
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
                    
                    HStack {
                        Text("Income Stability")
                        Spacer()
                        StabilityRatingPicker(rating: $viewModel.profile.requiredInfo.incomeStructure.stabilityRating)
                    }
                }
            }
            
            // Additional Income Sources
            ForEach(viewModel.profile.requiredInfo.incomeStructure.additionalSources) { source in
                AdditionalIncomeCard(source: source)
            }
            .onDelete { indexSet in
                viewModel.removeIncomeSource(at: indexSet)
            }
            
            Button(action: {
                // Add income source
            }) {
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
}

struct StabilityRatingPicker: View {
    @Binding var rating: Int
    
    var body: some View {
        HStack {
            ForEach(1...5, id: \.self) { value in
                Image(systemName: value <= rating ? "star.fill" : "star")
                    .foregroundColor(value <= rating ? Color(hex: "F59E0B") : Color(hex: "94A3B8"))
                    .onTapGesture {
                        withAnimation {
                            rating = value
                        }
                    }
            }
        }
    }
}

struct AdditionalIncomeCard: View {
    let source: IncomeSource
    
    var body: some View {
        FormCard {
            VStack(alignment: .leading, spacing: 8) {
                Text(source.description)
                    .font(.headline)
                    .foregroundColor(.white)
                
                HStack {
                    Text("$\(source.amount, specifier: "%.2f")")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "3B82F6"))
                    
                    Text(source.frequency.rawValue)
                        .font(.caption)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
            }
        }
    }
}

// Note: We'll continue with other sections in subsequent edits
// This gives you an idea of the structure and styling we're implementing 