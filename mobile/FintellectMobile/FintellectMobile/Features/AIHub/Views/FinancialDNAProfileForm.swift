import SwiftUI

struct FinancialDNAProfileForm: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Progress Bar
                ProgressView(value: Double(FormSection.allCases.firstIndex(of: viewModel.currentSection) ?? 0),
                           total: Double(FormSection.allCases.count - 1))
                    .tint(Color(hex: "3B82F6"))
                    .padding()
                
                // Form Content
                ScrollView {
                    VStack(spacing: 24) {
                        // Section Header
                        VStack(alignment: .leading, spacing: 8) {
                            Text(viewModel.currentSection.title)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            if viewModel.currentSection.isRequired {
                                Text("Required")
                                    .font(.subheadline)
                                    .foregroundColor(Color(hex: "3B82F6"))
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        
                        // Dynamic Form Content
                        Group {
                            switch viewModel.currentSection {
                            case .financialGoals:
                                FinancialGoalsSection(viewModel: viewModel)
                            case .incomeStructure:
                                IncomeStructureSection(viewModel: viewModel)
                            case .livingSituation:
                                LivingSituationSection(viewModel: viewModel)
                            case .career:
                                CareerSection(viewModel: viewModel)
                            case .preferences:
                                PreferencesSection(viewModel: viewModel)
                            case .lifeEvents:
                                LifeEventsSection(viewModel: viewModel)
                            case .stressPoints:
                                StressPointsSection(viewModel: viewModel)
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.vertical, 24)
                }
                .background(Color(hex: "0F172A"))
                
                // Navigation Buttons
                HStack(spacing: 16) {
                    if FormSection.allCases.firstIndex(of: viewModel.currentSection) != 0 {
                        Button(action: viewModel.moveToPreviousSection) {
                            HStack {
                                Image(systemName: "chevron.left")
                                Text("Back")
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(SecondaryButtonStyle())
                    }
                    
                    Button(action: {
                        if viewModel.validateCurrentSection() {
                            viewModel.moveToNextSection()
                        }
                    }) {
                        Text(isLastSection ? "Complete" : "Next")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    dismiss()
                }
                .foregroundColor(Color(hex: "94A3B8")),
                trailing: Button("Skip") {
                    viewModel.moveToNextSection()
                }
                .foregroundColor(viewModel.currentSection.isRequired ? Color(hex: "94A3B8").opacity(0.5) : Color(hex: "94A3B8"))
                .disabled(viewModel.currentSection.isRequired)
            )
        }
        .alert("Please Fix the Following", isPresented: $viewModel.showValidationAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(viewModel.formErrors.joined(separator: "\n"))
        }
    }
    
    private var isLastSection: Bool {
        guard let currentIndex = FormSection.allCases.firstIndex(of: viewModel.currentSection) else { return false }
        return currentIndex == FormSection.allCases.count - 1
    }
}

// MARK: - Form Sections
struct FinancialGoalsSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    @State private var showAddGoal = false
    @State private var newGoal = FinancialGoal(timeframe: .shortTerm, description: "", priority: 1)
    
    var body: some View {
        VStack(spacing: 16) {
            ForEach(viewModel.profile.requiredInfo.financialGoals) { goal in
                GoalCard(goal: goal)
            }
            .onDelete { indexSet in
                viewModel.removeFinancialGoal(at: indexSet)
            }
            
            Button(action: { showAddGoal = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Goal")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color(hex: "3B82F6"), style: StrokeStyle(lineWidth: 2, dash: [5]))
                )
            }
        }
        .sheet(isPresented: $showAddGoal) {
            AddGoalSheet(goal: $newGoal, isPresented: $showAddGoal) { goal in
                viewModel.addFinancialGoal(goal)
            }
        }
    }
}

#Preview {
    FinancialDNAProfileForm(viewModel: FinancialDNAProfileViewModel())
        .preferredColorScheme(.dark)
} 