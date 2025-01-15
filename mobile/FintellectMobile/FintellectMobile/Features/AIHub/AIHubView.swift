import SwiftUI

struct AIHubView: View {
    @StateObject private var viewModel = AIHubViewModel()
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Hero Section
                VStack(spacing: 16) {
                    Text("AI Financial Services")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                    
                    Text("Featuring 24/7 availability, bank-grade security, real-time analysis, and seamless Plaid integration for your financial success.")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "94A3B8"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                .padding(.top)
                
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
                    
                    VStack(spacing: 16) {
                        ForEach(viewModel.availableServices) { service in
                            ServiceCard(service: service)
                        }
                    }
                    .padding(.horizontal)
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
                    
                    VStack(spacing: 16) {
                        ForEach(viewModel.upcomingServices) { service in
                            ServiceCard(service: service, isComingSoon: true)
                        }
                    }
                    .padding(.horizontal)
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

struct AIDisclaimerCard: View {
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "info.circle")
                .foregroundColor(Color(hex: "3B82F6"))
            
            Text("These insights are AI-generated based on your financial data. Consider them as suggestions, not professional financial advice.")
                .font(.caption)
                .foregroundColor(Color(hex: "94A3B8"))
                .lineLimit(3)
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
            // Icon and Title Row
            HStack(spacing: 16) {
                Image(systemName: service.icon)
                    .font(.system(size: 24))
                    .foregroundColor(service.iconColor)
                    .frame(width: 48, height: 48)
                    .background(service.iconColor.opacity(0.2))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                
                Text(service.title)
                    .font(.headline)
                    .foregroundColor(.white)
            }
            
            // Description
            Text(service.description)
                .font(.subheadline)
                .foregroundColor(Color(hex: "94A3B8"))
                .fixedSize(horizontal: false, vertical: true)
            
            // Features
            VStack(alignment: .leading, spacing: 8) {
                ForEach(service.features, id: \.self) { feature in
                    HStack(spacing: 8) {
                        Circle()
                            .fill(service.iconColor.opacity(0.6))
                            .frame(width: 6, height: 6)
                        Text(feature)
                            .font(.caption)
                            .foregroundColor(Color(hex: "94A3B8"))
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