import SwiftUI

@MainActor
class FinancialDNAProfileViewModel: ObservableObject {
    @Published var profile: FinancialDNAProfile
    @Published var currentSection: FormSection = .financialGoals
    @Published var showForm = false
    @Published var isEditing = false
    
    // Form validation states
    @Published var formErrors: [String] = []
    @Published var showValidationAlert = false
    
    init() {
        // Initialize with empty profile
        self.profile = FinancialDNAProfile(
            requiredInfo: RequiredInformation(
                financialGoals: [],
                incomeStructure: IncomeStructure(
                    primaryIncome: 0,
                    frequency: .monthly,
                    additionalSources: [],
                    stabilityRating: 3
                ),
                livingSituation: LivingSituation(
                    housingStatus: .rent,
                    monthlyHousingCost: 0,
                    householdSize: 1
                )
            ),
            optionalInfo: OptionalInformation(
                career: CareerInfo(
                    profession: nil,
                    careerGoals: [],
                    educationLevel: nil,
                    certifications: []
                ),
                preferences: FinancialPreferences(
                    riskTolerance: nil,
                    preferredSavingMethods: [],
                    investmentInterests: [],
                    debtComfortLevel: nil
                ),
                lifeEvents: [],
                stressPoints: []
            )
        )
    }
    
    // MARK: - Form Navigation
    enum FormSection: Int, CaseIterable {
        case financialGoals
        case incomeStructure
        case livingSituation
        case career
        case preferences
        case lifeEvents
        case stressPoints
        
        var title: String {
            switch self {
            case .financialGoals: return "Financial Goals"
            case .incomeStructure: return "Income Structure"
            case .livingSituation: return "Living Situation"
            case .career: return "Career & Education"
            case .preferences: return "Financial Preferences"
            case .lifeEvents: return "Life Events"
            case .stressPoints: return "Financial Stress Points"
            }
        }
        
        var isRequired: Bool {
            switch self {
            case .financialGoals, .incomeStructure, .livingSituation:
                return true
            default:
                return false
            }
        }
    }
    
    func moveToNextSection() {
        guard let currentIndex = FormSection.allCases.firstIndex(of: currentSection),
              currentIndex + 1 < FormSection.allCases.count else {
            saveProfile()
            return
        }
        
        withAnimation {
            currentSection = FormSection.allCases[currentIndex + 1]
        }
    }
    
    func moveToPreviousSection() {
        guard let currentIndex = FormSection.allCases.firstIndex(of: currentSection),
              currentIndex > 0 else { return }
        
        withAnimation {
            currentSection = FormSection.allCases[currentIndex - 1]
        }
    }
    
    // MARK: - Validation
    func validateCurrentSection() -> Bool {
        formErrors.removeAll()
        
        switch currentSection {
        case .financialGoals:
            if profile.requiredInfo.financialGoals.isEmpty {
                formErrors.append("Please add at least one financial goal")
            }
            
        case .incomeStructure:
            if profile.requiredInfo.incomeStructure.primaryIncome <= 0 {
                formErrors.append("Please enter your primary income")
            }
            
        case .livingSituation:
            if profile.requiredInfo.livingSituation.monthlyHousingCost <= 0 {
                formErrors.append("Please enter your monthly housing cost")
            }
            
        default:
            return true
        }
        
        showValidationAlert = !formErrors.isEmpty
        return formErrors.isEmpty
    }
    
    // MARK: - Data Management
    func saveProfile() {
        // TODO: Implement API call to save profile
        showForm = false
        isEditing = false
    }
    
    // MARK: - Form Actions
    func addFinancialGoal(_ goal: FinancialGoal) {
        profile.requiredInfo.financialGoals.append(goal)
    }
    
    func removeFinancialGoal(at offsets: IndexSet) {
        profile.requiredInfo.financialGoals.remove(atOffsets: offsets)
    }
    
    func addIncomeSource(_ source: IncomeSource) {
        profile.requiredInfo.incomeStructure.additionalSources.append(source)
    }
    
    func removeIncomeSource(at offsets: IndexSet) {
        profile.requiredInfo.incomeStructure.additionalSources.remove(atOffsets: offsets)
    }
    
    func addLifeEvent(_ event: LifeEvent) {
        profile.optionalInfo.lifeEvents.append(event)
    }
    
    func removeLifeEvent(at offsets: IndexSet) {
        profile.optionalInfo.lifeEvents.remove(atOffsets: offsets)
    }
    
    func addStressPoint(_ point: StressPoint) {
        profile.optionalInfo.stressPoints.append(point)
    }
    
    func removeStressPoint(at offsets: IndexSet) {
        profile.optionalInfo.stressPoints.remove(atOffsets: offsets)
    }
} 