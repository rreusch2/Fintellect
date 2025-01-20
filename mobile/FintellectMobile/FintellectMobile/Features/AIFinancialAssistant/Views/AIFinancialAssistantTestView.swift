import SwiftUI

struct AIFinancialAssistantTestView: View {
    @StateObject private var viewModel = AIFinancialAssistantTestViewModel()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Test Controls
                HStack {
                    Picker("Analysis Type", selection: $viewModel.selectedType) {
                        Text("Spending").tag(PromptType.spendingAnalysis)
                        Text("Budget").tag(PromptType.budgetOptimization)
                        Text("Investment").tag(PromptType.investmentStrategy)
                    }
                    .pickerStyle(.segmented)
                    
                    Button(action: {
                        Task {
                            await viewModel.runAnalysis()
                        }
                    }) {
                        Text("Analyze")
                            .padding(.horizontal)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                .padding()
                
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .padding()
                }
                
                // Results Display
                if let result = viewModel.result {
                    Text(result)
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(radius: 2)
                }
                
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                }
            }
            .padding()
        }
        .navigationTitle("AI Assistant Test")
    }
}

class AIFinancialAssistantTestViewModel: ObservableObject {
    @Published var selectedType: PromptType = .spendingAnalysis
    @Published var result: String?
    @Published var error: String?
    @Published var isLoading = false
    
    private let aiService: AIService = MockAIService()
    
    // Sample test data
    private let testData = UserFinancialData(
        totalSpending: 3592.46,
        categories: [
            ("Groceries", 595.11),
            ("Entertainment", 250.30),
            ("Transportation", 180.45)
        ],
        monthlyIncome: 5000.00,
        fixedExpenses: 2000.00,
        variableExpenses: 1500.00,
        savingsGoal: 10000.00,
        riskTolerance: "Moderate",
        investmentHorizon: 10,
        currentPortfolio: 25000.00,
        monthlyInvestmentCapacity: 500.00
    )
    
    @MainActor
    func runAnalysis() async {
        isLoading = true
        error = nil
        result = nil
        
        do {
            let response = try await aiService.analyzeFinances(
                type: selectedType,
                userData: testData
            )
            result = response.message
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
}

#Preview {
    NavigationView {
        AIFinancialAssistantTestView()
    }
} 