import SwiftUI

// MARK: - Form Card
struct FormCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding()
            .background(Color(hex: "1E293B"))
            .cornerRadius(12)
    }
}

// MARK: - Priority Badge
struct PriorityBadge: View {
    let priority: Int
    
    var color: Color {
        switch priority {
        case 1: return Color(hex: "10B981") // Green
        case 2: return Color(hex: "F59E0B") // Yellow
        case 3: return Color(hex: "EF4444") // Red
        default: return Color(hex: "94A3B8") // Gray
        }
    }
    
    var label: String {
        switch priority {
        case 1: return "Low"
        case 2: return "Medium"
        case 3: return "High"
        default: return "Unknown"
        }
    }
    
    var body: some View {
        Text(label)
            .font(.caption)
            .fontWeight(.medium)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.2))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(color, lineWidth: 1)
            )
    }
}

// MARK: - Goal Card
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
                
                if let target = goal.targetAmount {
                    HStack {
                        Text("Target:")
                            .foregroundColor(Color(hex: "94A3B8"))
                        Text("$\(target, specifier: "%.2f")")
                            .foregroundColor(.white)
                        
                        if let current = goal.currentAmount {
                            Spacer()
                            Text("Current:")
                                .foregroundColor(Color(hex: "94A3B8"))
                            Text("$\(current, specifier: "%.2f")")
                                .foregroundColor(.white)
                        }
                    }
                    .font(.subheadline)
                }
            }
        }
    }
}

// MARK: - Add Goal Sheet
struct AddGoalSheet: View {
    @Binding var goal: FinancialGoal
    @Binding var isPresented: Bool
    let onSave: (FinancialGoal) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Goal Details")) {
                    Picker("Timeframe", selection: $goal.timeframe) {
                        ForEach(FinancialGoal.GoalTimeframe.allCases, id: \.self) { timeframe in
                            Text(timeframe.rawValue).tag(timeframe)
                        }
                    }
                    
                    TextField("Description", text: $goal.description)
                    
                    Picker("Priority", selection: $goal.priority) {
                        Text("Low").tag(1)
                        Text("Medium").tag(2)
                        Text("High").tag(3)
                    }
                    
                    TextField("Target Amount (Optional)", value: $goal.targetAmount, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                    
                    TextField("Current Amount (Optional)", value: $goal.currentAmount, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
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