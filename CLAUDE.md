# Fintellect Development Guide

## Build/Run Commands
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build client (Vite) and server (esbuild) for production
- `npm run migrate`: Execute database migrations
- Client: `cd client && npm run dev`: Run client development server
- MCP Setup: `cd server/services/ai/mcp && ./setup.sh`: Set up MCP Agent environment

## Code Style Guidelines
- **Architecture**: MVVM for mobile, component-based for web
- **TypeScript**: Use strict mode, explicit typing (avoid `any`)
- **Naming**: 
  - PascalCase for components, interfaces, types
  - camelCase for variables, functions, instances
  - ALL_CAPS for constants
- **Imports**: Group by external/internal, alphabetize
- **Error Handling**: Use try/catch with specific error types
- **Mobile**: Follow Apple's Human Interface Guidelines
- **Components**: One component per file, maintain separation of concerns
- **APIs**: Centralize in lib/api.ts, use TanStack Query
- **AI Integration**: Use established agent patterns, check auth

## MCP Integration
- **What is MCP**: Model Context Protocol - standardized interface for AI to access external data and tools
- **Architecture**:
  - **MCP Servers**: Expose specific capabilities (tools, resources, prompts)
  - **MCP Clients**: Connect to servers and relay information to AI models
  - **MCP Hosts**: Applications that integrate MCP clients (Claude, Cursor)
- **Components**:
  - **Resources**: File-like data that servers expose to clients
  - **Tools**: Executable functions exposed by servers
  - **Prompts**: Pre-written templates with placeholders for specific tasks
- **Setup**: Configure `mcp_agent.secrets.yaml` with API keys after running setup script

## AI Agent Framework
- **Agent Memory**: 
  - Use enhanced KnowledgeStore for persistent user context
  - Implement vector database for semantic conversation storage
  - Maintain proper memory hierarchies (short vs. long-term)
- **Agent Personas**:
  - Financial Planning Agent: "Horizon" - Thoughtful, forward-thinking
  - Investment Advisor Agent: "Vertex" - Analytical, precise
  - Expense Optimization Agent: "Thrive" - Resourceful, practical
  - Financial Goal Tracking Agent: "Summit" - Motivational, supportive
- **User Data Collection**:
  - Progressive profiling through contextual questions
  - Interactive onboarding experiences
  - Financial goals and life events timeline
  - Regular financial health check-ins
- **Design Consistency**:
  - Agent-specific color schemes and visual elements
  - Consistent personality in conversational UI
  - Adaptive interfaces based on user preferences

## Implementation Roadmap
- **Phase 1**: Foundation - MCP Agent setup, Thrive agent implementation
- **Phase 2**: Core Functionality - Vector DB, conversation memory, additional agents
- **Phase 3**: Advanced Features - Cross-agent memory, persona evolution
- **Phase 4**: Optimization - Performance enhancements, privacy controls

## Key Files
- Mobile app entry: mobile/FintellectMobile/FintellectMobileApp.swift
- Web app entry: client/src/main.tsx
- Backend entry: server/index.ts
- Database schema: db/schema.ts
- AI Services: server/services/ai/index.ts
- Agent Definitions: server/services/ai/agents/
- Memory Store: server/services/ai/store/KnowledgeStore.ts
- MCP Integration: server/services/ai/mcp/agent_manager.ts
- MCP Agents: server/services/ai/mcp/scripts/