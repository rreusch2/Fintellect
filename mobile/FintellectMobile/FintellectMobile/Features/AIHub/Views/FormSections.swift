import SwiftUI

// MARK: - Form Section Enum
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

// MARK: - Living Situation Section
struct LivingSituationSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            FormCard {
                VStack(spacing: 16) {
                    Picker("Housing Status", selection: $viewModel.profile.requiredInfo.livingSituation.housingStatus) {
                        ForEach(HousingStatus.allCases, id: \.self) { status in
                            Text(status.rawValue).tag(status)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    TextField("Monthly Housing Cost", value: $viewModel.profile.requiredInfo.livingSituation.monthlyHousingCost, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Stepper("Household Size: \(viewModel.profile.requiredInfo.livingSituation.householdSize)", 
                           value: $viewModel.profile.requiredInfo.livingSituation.householdSize, 
                           in: 1...10)
                }
            }
        }
    }
}

// MARK: - Career Section
struct CareerSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    @State private var newCareerGoal = ""
    @State private var newCertification = ""
    
    var body: some View {
        VStack(spacing: 16) {
            FormCard {
                VStack(spacing: 16) {
                    TextField("Profession", text: Binding(
                        get: { viewModel.profile.optionalInfo.career.profession ?? "" },
                        set: { viewModel.profile.optionalInfo.career.profession = $0.isEmpty ? nil : $0 }
                    ))
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Picker("Education Level", selection: Binding(
                        get: { viewModel.profile.optionalInfo.career.educationLevel ?? .highSchool },
                        set: { viewModel.profile.optionalInfo.career.educationLevel = $0 }
                    )) {
                        ForEach(EducationLevel.allCases, id: \.self) { level in
                            Text(level.rawValue).tag(level)
                        }
                    }
                }
            }
            
            // Career Goals
            VStack(alignment: .leading, spacing: 8) {
                Text("Career Goals")
                    .font(.headline)
                    .foregroundColor(.white)
                
                ForEach(viewModel.profile.optionalInfo.career.careerGoals, id: \.self) { goal in
                    HStack {
                        Text(goal)
                            .foregroundColor(.white)
                        Spacer()
                        Button(action: {
                            viewModel.profile.optionalInfo.career.careerGoals.removeAll { $0 == goal }
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(Color(hex: "94A3B8"))
                        }
                    }
                    .padding()
                    .background(Color(hex: "1E293B"))
                    .cornerRadius(8)
                }
                
                HStack {
                    TextField("Add Career Goal", text: $newCareerGoal)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: {
                        if !newCareerGoal.isEmpty {
                            viewModel.profile.optionalInfo.career.careerGoals.append(newCareerGoal)
                            newCareerGoal = ""
                        }
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(Color(hex: "3B82F6"))
                    }
                }
            }
            
            // Certifications
            VStack(alignment: .leading, spacing: 8) {
                Text("Certifications")
                    .font(.headline)
                    .foregroundColor(.white)
                
                ForEach(viewModel.profile.optionalInfo.career.certifications, id: \.self) { cert in
                    HStack {
                        Text(cert)
                            .foregroundColor(.white)
                        Spacer()
                        Button(action: {
                            viewModel.profile.optionalInfo.career.certifications.removeAll { $0 == cert }
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(Color(hex: "94A3B8"))
                        }
                    }
                    .padding()
                    .background(Color(hex: "1E293B"))
                    .cornerRadius(8)
                }
                
                HStack {
                    TextField("Add Certification", text: $newCertification)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: {
                        if !newCertification.isEmpty {
                            viewModel.profile.optionalInfo.career.certifications.append(newCertification)
                            newCertification = ""
                        }
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(Color(hex: "3B82F6"))
                    }
                }
            }
        }
    }
}

// MARK: - Preferences Section
struct PreferencesSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // Risk Tolerance
            FormCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Risk Tolerance")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    HStack {
                        Text("Conservative")
                            .font(.caption)
                            .foregroundColor(Color(hex: "94A3B8"))
                        Spacer()
                        Text("Aggressive")
                            .font(.caption)
                            .foregroundColor(Color(hex: "94A3B8"))
                    }
                    
                    Slider(
                        value: Binding(
                            get: { Double(viewModel.profile.optionalInfo.preferences.riskTolerance ?? 3) },
                            set: { viewModel.profile.optionalInfo.preferences.riskTolerance = Int($0) }
                        ),
                        in: 1...5,
                        step: 1
                    )
                    .tint(Color(hex: "3B82F6"))
                }
            }
            
            // Saving Methods
            FormCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Preferred Saving Methods")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    ForEach(SavingMethod.allCases, id: \.self) { method in
                        Toggle(method.rawValue, isOn: Binding(
                            get: { viewModel.profile.optionalInfo.preferences.preferredSavingMethods.contains(method) },
                            set: { isSelected in
                                if isSelected {
                                    viewModel.profile.optionalInfo.preferences.preferredSavingMethods.append(method)
                                } else {
                                    viewModel.profile.optionalInfo.preferences.preferredSavingMethods.removeAll { $0 == method }
                                }
                            }
                        ))
                        .foregroundColor(.white)
                    }
                }
            }
            
            // Investment Interests
            FormCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Investment Interests")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    ForEach(InvestmentType.allCases, id: \.self) { type in
                        Toggle(type.rawValue, isOn: Binding(
                            get: { viewModel.profile.optionalInfo.preferences.investmentInterests.contains(type) },
                            set: { isSelected in
                                if isSelected {
                                    viewModel.profile.optionalInfo.preferences.investmentInterests.append(type)
                                } else {
                                    viewModel.profile.optionalInfo.preferences.investmentInterests.removeAll { $0 == type }
                                }
                            }
                        ))
                        .foregroundColor(.white)
                    }
                }
            }
            
            // Debt Comfort Level
            FormCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Debt Comfort Level")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    HStack {
                        Text("Debt Averse")
                            .font(.caption)
                            .foregroundColor(Color(hex: "94A3B8"))
                        Spacer()
                        Text("Debt Tolerant")
                            .font(.caption)
                            .foregroundColor(Color(hex: "94A3B8"))
                    }
                    
                    Slider(
                        value: Binding(
                            get: { Double(viewModel.profile.optionalInfo.preferences.debtComfortLevel ?? 3) },
                            set: { viewModel.profile.optionalInfo.preferences.debtComfortLevel = Int($0) }
                        ),
                        in: 1...5,
                        step: 1
                    )
                    .tint(Color(hex: "3B82F6"))
                }
            }
        }
    }
}

// MARK: - Life Events Section
struct LifeEventsSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    @State private var showAddEvent = false
    @State private var newEvent = LifeEvent(
        type: .other,
        expectedDate: Date(),
        description: ""
    )
    
    var body: some View {
        VStack(spacing: 16) {
            ForEach(viewModel.profile.optionalInfo.lifeEvents) { event in
                LifeEventCard(event: event)
            }
            .onDelete { indexSet in
                viewModel.removeLifeEvent(at: indexSet)
            }
            
            Button(action: { showAddEvent = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Life Event")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color(hex: "3B82F6"), style: StrokeStyle(lineWidth: 2, dash: [5]))
                )
            }
        }
        .sheet(isPresented: $showAddEvent) {
            AddLifeEventSheet(event: $newEvent, isPresented: $showAddEvent) { event in
                viewModel.addLifeEvent(event)
            }
        }
    }
}

struct LifeEventCard: View {
    let event: LifeEvent
    
    var body: some View {
        FormCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(event.type.rawValue)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "3B82F6"))
                    Spacer()
                    Text(event.expectedDate, style: .date)
                        .font(.caption)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
                
                Text(event.description)
                    .font(.body)
                    .foregroundColor(.white)
                
                if let cost = event.estimatedCost {
                    Text("Estimated Cost: $\(cost, specifier: "%.2f")")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                }
            }
        }
    }
}

struct AddLifeEventSheet: View {
    @Binding var event: LifeEvent
    @Binding var isPresented: Bool
    let onSave: (LifeEvent) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Event Details")) {
                    Picker("Type", selection: $event.type) {
                        ForEach(LifeEventType.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                    
                    DatePicker("Expected Date", selection: $event.expectedDate, displayedComponents: .date)
                    
                    TextField("Description", text: $event.description)
                    
                    TextField("Estimated Cost (Optional)", value: $event.estimatedCost, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Add Life Event")
            .navigationBarItems(
                leading: Button("Cancel") {
                    isPresented = false
                },
                trailing: Button("Save") {
                    onSave(event)
                    isPresented = false
                }
                .disabled(event.description.isEmpty)
            )
        }
    }
}

// MARK: - Stress Points Section
struct StressPointsSection: View {
    @ObservedObject var viewModel: FinancialDNAProfileViewModel
    @State private var showAddStressPoint = false
    @State private var newStressPoint = StressPoint(
        category: .other,
        description: "",
        priority: 1
    )
    
    var body: some View {
        VStack(spacing: 16) {
            ForEach(viewModel.profile.optionalInfo.stressPoints) { point in
                StressPointCard(point: point)
            }
            .onDelete { indexSet in
                viewModel.removeStressPoint(at: indexSet)
            }
            
            Button(action: { showAddStressPoint = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Stress Point")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color(hex: "3B82F6"), style: StrokeStyle(lineWidth: 2, dash: [5]))
                )
            }
        }
        .sheet(isPresented: $showAddStressPoint) {
            AddStressPointSheet(point: $newStressPoint, isPresented: $showAddStressPoint) { point in
                viewModel.addStressPoint(point)
            }
        }
    }
}

struct StressPointCard: View {
    let point: StressPoint
    
    var body: some View {
        FormCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(point.category.rawValue)
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "3B82F6"))
                    Spacer()
                    PriorityBadge(priority: point.priority)
                }
                
                Text(point.description)
                    .font(.body)
                    .foregroundColor(.white)
            }
        }
    }
}

struct AddStressPointSheet: View {
    @Binding var point: StressPoint
    @Binding var isPresented: Bool
    let onSave: (StressPoint) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Stress Point Details")) {
                    Picker("Category", selection: $point.category) {
                        ForEach(StressCategory.allCases, id: \.self) { category in
                            Text(category.rawValue).tag(category)
                        }
                    }
                    
                    TextField("Description", text: $point.description)
                    
                    Picker("Priority", selection: $point.priority) {
                        Text("Low").tag(1)
                        Text("Medium").tag(2)
                        Text("High").tag(3)
                    }
                }
            }
            .navigationTitle("Add Stress Point")
            .navigationBarItems(
                leading: Button("Cancel") {
                    isPresented = false
                },
                trailing: Button("Save") {
                    onSave(point)
                    isPresented = false
                }
                .disabled(point.description.isEmpty)
            )
        }
    }
} 