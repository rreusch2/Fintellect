import SwiftUI

struct SectionTitle: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(Color(hex: "3B82F6"))
            
            Text(title)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }
}

struct BulletPoint: View {
    let text: String
    
    init(_ text: String) {
        self.text = text
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(Color(hex: "3B82F6"))
                .frame(width: 6, height: 6)
                .padding(.top, 6)
            
            Text(text)
                .foregroundColor(Color(hex: "94A3B8"))
        }
    }
} 