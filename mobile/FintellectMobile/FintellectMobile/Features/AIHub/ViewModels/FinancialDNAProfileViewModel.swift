import SwiftUI

@MainActor
class FinancialDNAProfileViewModel: ObservableObject {
    @Published var profile = FinancialDNAProfile()
    @Published var currentSection: FormSection = .financialGoals
    @Published var showValidationAlert = false
    @Published var formErrors: [String] = []
    
    // MARK: - Navigation Methods
    func moveToNextSection() {
        guard let currentIndex = FormSection.allCases.firstIndex(of: currentSection),
              currentIndex < FormSection.allCases.count - 1 else { return }
        currentSection = FormSection.allCases[currentIndex + 1]
    }
    
    func moveToPreviousSection() {
        guard let currentIndex = FormSection.allCases.firstIndex(of: currentSection),
              currentIndex > 0 else { return }
        currentSection = FormSection.allCases[currentIndex - 1]
    }
    
    // MARK: - Validation Methods
    func validateCurrentSection() -> Bool {
        formErrors.removeAll()
        
        switch currentSection {
        case .financialGoals:
            if profile.requiredInfo.financialGoals.isEmpty {
                formErrors.append("Please add at least one financial goal")
            }
            
        case .incomeStructure:
            if profile.requiredInfo.incomeStructure.primaryIncome <= 0 {
                formErrors.append("Please enter a valid primary income")
            }
            
        case .livingSituation:
            if profile.requiredInfo.livingSituation.monthlyHousingCost <= 0 {
                formErrors.append("Please enter a valid monthly housing cost")
            }
            
        case .career:
            // Optional section, no validation required
            break
            
        case .preferences:
            // Optional section, no validation required
            break
            
        case .lifeEvents:
            // Optional section, no validation required
            break
            
        case .stressPoints:
            // Optional section, no validation required
            break
        }
        
        if !formErrors.isEmpty {
            showValidationAlert = true
            return false
        }
        
        return true
    }
    
    // MARK: - Financial Goals Methods
    func addFinancialGoal(_ goal: FinancialGoal) {
        profile.requiredInfo.financialGoals.append(goal)
    }
    
    func removeFinancialGoal(at indexSet: IndexSet) {
        profile.requiredInfo.financialGoals.remove(atOffsets: indexSet)
    }
    
    // MARK: - Income Source Methods
    func addIncomeSource(_ source: IncomeSource) {
        profile.requiredInfo.incomeStructure.additionalSources.append(source)
    }
    
    func removeIncomeSource(at indexSet: IndexSet) {
        profile.requiredInfo.incomeStructure.additionalSources.remove(atOffsets: indexSet)
    }
    
    // MARK: - Life Events Methods
    func addLifeEvent(_ event: LifeEvent) {
        profile.optionalInfo.lifeEvents.append(event)
    }
    
    func removeLifeEvent(at indexSet: IndexSet) {
        profile.optionalInfo.lifeEvents.remove(atOffsets: indexSet)
    }
    
    // MARK: - Stress Points Methods
    func addStressPoint(_ point: StressPoint) {
        profile.optionalInfo.stressPoints.append(point)
    }
    
    func removeStressPoint(at indexSet: IndexSet) {
        profile.optionalInfo.stressPoints.remove(atOffsets: indexSet)
    }
    
    // MARK: - Save Methods
    func saveProfile() async throws {
        // TODO: Implement API call to save profile
        // This will be implemented when we integrate with the backend
    }
} 