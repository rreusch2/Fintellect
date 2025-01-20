import Foundation

// Intent and Categories
struct Intent {
    let category: IntentCategory
    let confidence: Float
    let parameters: [String: Any]?
}

enum IntentCategory {
    case conversation  // General chat, questions
    case insight      // Financial analysis, recommendations
    case learning     // Educational content
    case analytics    // Data analysis, charts
}

// Response Metadata
struct ResponseMetadata {
    let category: String
    let timestamp: Date
    let confidence: Float
    let source: String
    let tags: [String]
}

// Visual Content Data Structures
struct ChartData {
    let type: ChartType
    let title: String
    let data: [DataPoint]
    let configuration: ChartConfiguration
}

struct TableData {
    let headers: [String]
    let rows: [[String]]
    let style: TableStyle
}

struct CardData {
    let title: String
    let subtitle: String?
    let content: String
    let style: CardStyle
}

// Action Styling
enum ActionStyle {
    case primary
    case secondary
    case destructive
    case plain
}

// Chart Types and Configuration
enum ChartType {
    case pie
    case line
    case bar
    case area
}

struct ChartConfiguration {
    let colors: [String]
    let showLegend: Bool
    let animate: Bool
    let interactive: Bool
}

struct DataPoint: Identifiable {
    let id = UUID()
    let label: String
    let value: Double
    let category: String?
}

// Styling
struct TableStyle {
    let headerColor: String
    let alternateRowColors: Bool
    let borderStyle: BorderStyle
}

struct CardStyle {
    let backgroundColor: String
    let borderColor: String
    let shadowRadius: CGFloat
}

enum BorderStyle {
    case none
    case light
    case medium
    case heavy
} 