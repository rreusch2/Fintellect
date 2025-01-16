import SwiftUI

struct CustomTextField: View {
    @Binding var text: String
    let placeholder: String
    let systemImage: String
    var isSecure: Bool = false
    @State private var isShowingPassword = false
    @FocusState private var isFocused: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(isFocused ? Color(hex: "3B82F6") : Color(hex: "64748B"))
                .frame(width: 24)
            
            // Text Field
            Group {
                if isSecure && !isShowingPassword {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .foregroundColor(.white)
            .tint(Color(hex: "3B82F6"))
            .focused($isFocused)
            
            // Show/Hide Password Button (only for secure fields)
            if isSecure {
                Button(action: {
                    isShowingPassword.toggle()
                }) {
                    Image(systemName: isShowingPassword ? "eye.slash.fill" : "eye.fill")
                        .foregroundColor(Color(hex: "64748B"))
                        .frame(width: 20, height: 20)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(hex: "1E293B"))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isFocused ? Color(hex: "3B82F6") : Color(hex: "334155"), lineWidth: 1)
                )
        )
    }
}

#Preview {
    VStack(spacing: 16) {
        CustomTextField(text: .constant(""), placeholder: "Email", systemImage: "envelope")
        CustomTextField(text: .constant(""), placeholder: "Password", systemImage: "lock", isSecure: true)
    }
    .padding()
    .background(Color(hex: "0F172A"))
} 