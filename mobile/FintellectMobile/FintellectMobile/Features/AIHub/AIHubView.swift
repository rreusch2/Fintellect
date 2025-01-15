import SwiftUI

struct AIHubView: View {
    @StateObject private var viewModel = AIHubViewModel()
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Hero Section with Stats
                VStack(spacing: 16) {
                    Text("AI-Powered Financial Services")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                    
                    Text("Experience the future of finance with our advanced AI technologies")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    
                    // Stats Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(viewModel.aiStats) { stat in
                            StatCard(stat: stat)
                        }
                    }
                }
                .padding(.horizontal)
                
                // AI Disclaimer
                AIDisclaimerCard()
                    .padding(.horizontal)
                
                // Available Services Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "sparkles")
                            .foregroundColor(Color(hex: "3B82F6"))
                        Text("Available Services")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 16) {
                            ForEach(viewModel.availableServices) { service in
                                ServiceCard(service: service)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                
                // Coming Soon Section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "rocket")
                            .foregroundColor(Color(hex: "3B82F6"))
                        Text("Coming Soon")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 16) {
                            ForEach(viewModel.upcomingServices) { service in
                                ServiceCard(service: service, isComingSoon: true)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical, 24)
        }
        .background(BackgroundView())
        .navigationTitle("AI Hub")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let stat: AIStat
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: stat.icon)
                .font(.system(size: 20))
                .foregroundColor(Color(hex: "3B82F6").opacity(0.8))
            Text(stat.value)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
            Text(stat.label)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
                .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

struct AIDisclaimerCard: View {
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "info.circle")
                .foregroundColor(Color(hex: "3B82F6"))
            
            Text("These insights are AI-generated based on your financial data. Consider them as suggestions, not professional financial advice.")
                .font(.caption)
                .foregroundColor(.gray)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
                .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

struct ServiceCard: View {
    let service: AIService
    var isComingSoon: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Icon
            Image(systemName: service.icon)
                .font(.system(size: 24))
                .foregroundColor(service.iconColor)
                .frame(width: 48, height: 48)
                .background(service.iconColor.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            
            // Content
            VStack(alignment: .leading, spacing: 8) {
                Text(service.title)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(service.description)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(3)
                    .frame(maxWidth: 250)
                
                // Features
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(service.features, id: \.self) { feature in
                        HStack(spacing: 6) {
                            Circle()
                                .fill(service.iconColor.opacity(0.6))
                                .frame(width: 6, height: 6)
                            Text(feature)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
            }
            
            if !isComingSoon {
                NavigationLink(destination: service.destination) {
                    Text("Access Service")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(service.iconColor.opacity(0.2))
                        )
                }
            }
        }
        .padding()
        .frame(width: 300)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1E293B"))
                .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
        .opacity(isComingSoon ? 0.8 : 1)
    }
}

#Preview {
    NavigationView {
        AIHubView()
    }
} 