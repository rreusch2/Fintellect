# Implementation Recommendations for Fintellect-OpenManus Integration

## Overview
This document provides detailed recommendations for implementing the Sentinel Research Agent page in Fintellect by integrating with OpenManus. Based on our compatibility analysis, we recommend a hybrid approach that leverages OpenManus's capabilities while maintaining Fintellect's existing architecture.

## Architecture Recommendations

### 1. Communication Layer

We recommend implementing a bidirectional communication layer between Fintellect and OpenManus:

```
┌─────────────────┐                 ┌─────────────────┐
│   Fintellect    │◄───REST API────►│    OpenManus    │
│  (TypeScript)   │                 │     (Python)    │
└────────┬────────┘                 └────────┬────────┘
         │                                   │
         │                                   │
┌────────▼────────┐                 ┌────────▼────────┐
│  E2B Sandbox    │      Shared     │  Docker Sandbox  │
│  Environment    │◄────Volumes────►│   Environment    │
└─────────────────┘                 └─────────────────┘
```

**Implementation Details:**
- Create a REST API service in OpenManus that Fintellect can communicate with
- Implement WebSocket connections for real-time updates from OpenManus to Fintellect
- Use shared volumes between the E2B and Docker environments for file exchange

### 2. Agent Integration

Integrate OpenManus's agent architecture with Fintellect's SentinelAgent:

```
┌─────────────────────────────────────────────────────┐
│                    Fintellect                       │
│                                                     │
│  ┌─────────────┐        ┌─────────────────────┐     │
│  │ SentinelPage│◄───────┤ SentinelAgent      │     │
│  │   (React)   │        │  (TypeScript)      │     │
│  └─────────────┘        └──────────┬──────────┘     │
│                                    │                │
│                                    ▼                │
│                         ┌────────────────────┐      │
│                         │ OpenManusConnector │      │
│                         └──────────┬─────────┘      │
└─────────────────────────────────────┼───────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────┐
│                    OpenManus                        │
│                                                     │
│  ┌─────────────┐        ┌─────────────────────┐     │
│  │ MCP Server  │◄───────┤ Manus Agent        │     │
│  │             │        │                    │     │
│  └─────────────┘        └──────────┬─────────┘     │
│                                    │               │
│                                    ▼               │
│                         ┌────────────────────┐     │
│                         │  Docker Sandbox    │     │
│                         └────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

**Implementation Details:**
- Create an OpenManusConnector class in Fintellect that handles communication with OpenManus
- Extend SentinelAgent to delegate certain tasks to OpenManus via the connector
- Implement MCP (Model Context Protocol) server in OpenManus to standardize tool interactions

### 3. UI Integration

Enhance Fintellect's UI to visualize OpenManus operations:

```
┌─────────────────────────────────────────────────────┐
│                 Sentinel Page UI                    │
│                                                     │
│  ┌─────────────┐        ┌─────────────────────┐     │
│  │ Preferences │        │ Running Tab         │     │
│  │   Panel     │        │                     │     │
│  └─────────────┘        └─────────────────────┘     │
│                                │                    │
│                                ▼                    │
│  ┌─────────────┐        ┌─────────────────────┐     │
│  │ Results     │        │ Left Panel          │     │
│  │   Panel     │        │ (Agent Summaries)   │     │
│  └─────────────┘        └─────────────────────┘     │
│                                │                    │
│                                ▼                    │
│                         ┌─────────────────────┐     │
│                         │ Right Panel         │     │
│                         │ (Sandbox Viewer)    │     │
│                         └─────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

**Implementation Details:**
- Create a tabbed interface in the Running Tab to show different aspects of the research process
- Implement a left panel that displays real-time summaries from the agent
- Develop a right panel with tabs for:
  - Terminal output
  - File editor/viewer
  - Browser actions
  - Generated visualizations
  - Final results

## Technical Implementation Steps

### 1. OpenManus Integration Service

Create a Python-based service that adapts OpenManus for Fintellect:

```python
# sentinel_openmanus_service.py
from fastapi import FastAPI, WebSocket
from app.agent.manus import Manus
import asyncio

app = FastAPI()
active_agents = {}

@app.post("/api/research/start")
async def start_research(request_data: dict):
    agent_id = str(uuid.uuid4())
    agent = Manus()
    active_agents[agent_id] = agent
    
    # Start agent in background task
    asyncio.create_task(run_agent(agent_id, request_data["prompt"]))
    
    return {"agent_id": agent_id, "status": "started"}

async def run_agent(agent_id, prompt):
    agent = active_agents[agent_id]
    await agent.run(prompt)
    
@app.websocket("/ws/agent/{agent_id}")
async def agent_websocket(websocket: WebSocket, agent_id: str):
    await websocket.accept()
    agent = active_agents.get(agent_id)
    if not agent:
        await websocket.close(code=1000, reason="Agent not found")
        return
        
    # Set up event listeners to forward agent updates to websocket
    # ...
```

### 2. Fintellect OpenManus Connector

Implement a TypeScript connector in Fintellect:

```typescript
// OpenManusConnector.ts
export class OpenManusConnector {
  private baseUrl: string;
  private agentId: string | null = null;
  private socket: WebSocket | null = null;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async startResearch(preference: ResearchPreference): Promise<string> {
    // Convert preference to OpenManus prompt format
    const prompt = this.buildPromptFromPreference(preference);
    
    // Start research via REST API
    const response = await fetch(`${this.baseUrl}/api/research/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    const data = await response.json();
    this.agentId = data.agent_id;
    
    // Set up WebSocket connection for real-time updates
    this.connectWebSocket();
    
    return this.agentId;
  }
  
  private connectWebSocket() {
    if (!this.agentId) return;
    
    this.socket = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws/agent/${this.agentId}`);
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Forward events to appropriate handlers
      // ...
    };
  }
  
  private buildPromptFromPreference(preference: ResearchPreference): string {
    // Convert structured preference to natural language prompt
    // ...
  }
}
```

### 3. SentinelAgent Extension

Extend the existing SentinelAgent to work with OpenManus:

```typescript
// SentinelAgent.ts (extended)
import { OpenManusConnector } from './OpenManusConnector';

export class SentinelAgent {
  // Existing implementation...
  
  private openManusConnector: OpenManusConnector | null = null;
  
  constructor() {
    // Existing initialization...
    
    // Initialize OpenManus connector if configured
    if (process.env.OPENMANUS_URL) {
      this.openManusConnector = new OpenManusConnector(process.env.OPENMANUS_URL);
    }
  }
  
  async performResearch(userId: number, preferenceId: number): Promise<ResearchResult[]> {
    // If OpenManus is enabled, use it for research
    if (this.openManusConnector && process.env.USE_OPENMANUS === 'true') {
      return this.performOpenManusResearch(userId, preferenceId);
    }
    
    // Otherwise, use existing E2B implementation
    return this.performE2BResearch(userId, preferenceId);
  }
  
  private async performOpenManusResearch(userId: number, preferenceId: number): Promise<ResearchResult[]> {
    // Get preference from database
    const preference = await db.query.researchPreferences.findFirst({
      where: and(
        eq(researchPreferences.id, preferenceId),
        eq(researchPreferences.userId, userId)
      )
    });
    
    if (!preference) throw new Error("Preference not found");
    
    // Start research with OpenManus
    const agentId = await this.openManusConnector!.startResearch(preference);
    
    // Set up event handlers for WebSocket updates
    // ...
    
    // Return placeholder results (will be updated via WebSocket)
    return [];
  }
  
  private async performE2BResearch(userId: number, preferenceId: number): Promise<ResearchResult[]> {
    // Existing E2B implementation...
  }
}
```

### 4. UI Components for Sandbox Visualization

Implement React components for visualizing the sandbox:

```tsx
// SandboxViewer.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SandboxViewerProps {
  agentId: string;
  websocketUrl: string;
}

export const SandboxViewer: React.FC<SandboxViewerProps> = ({ agentId, websocketUrl }) => {
  const [activeTab, setActiveTab] = useState('terminal');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [files, setFiles] = useState<{name: string, content: string}[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  
  useEffect(() => {
    const socket = new WebSocket(`${websocketUrl}/ws/agent/${agentId}`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'terminal_output') {
        setTerminalOutput(prev => [...prev, data.content]);
      } else if (data.type === 'file_created' || data.type === 'file_updated') {
        setFiles(prev => {
          const fileIndex = prev.findIndex(f => f.name === data.file.name);
          if (fileIndex >= 0) {
            const newFiles = [...prev];
            newFiles[fileIndex] = data.file;
            return newFiles;
          } else {
            return [...prev, data.file];
          }
        });
      }
    };
    
    return () => {
      socket.close();
    };
  }, [agentId, websocketUrl]);
  
  return (
    <div className="sandbox-viewer">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="browser">Browser</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="terminal">
          <div className="terminal-output">
            {terminalOutput.map((line, i) => (
              <div key={i} className="terminal-line">{line}</div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="files">
          <div className="file-explorer">
            <div className="file-list">
              {files.map(file => (
                <div 
                  key={file.name} 
                  className={`file-item ${currentFile === file.name ? 'active' : ''}`}
                  onClick={() => setCurrentFile(file.name)}
                >
                  {file.name}
                </div>
              ))}
            </div>
            <div className="file-content">
              {currentFile && files.find(f => f.name === currentFile)?.content}
            </div>
          </div>
        </TabsContent>
        
        {/* Other tab contents... */}
      </Tabs>
    </div>
  );
};
```

## Deployment Recommendations

### 1. Docker Compose Setup

Create a Docker Compose configuration to run both services:

```yaml
# docker-compose.yml
version: '3'

services:
  fintellect:
    build: ./
    ports:
      - "3000:3000"
    environment:
      - OPENMANUS_URL=http://openmanus:8000
      - USE_OPENMANUS=true
    volumes:
      - shared_data:/app/shared
    depends_on:
      - openmanus
      
  openmanus:
    build: ./openmanus
    ports:
      - "8000:8000"
    volumes:
      - shared_data:/app/workspace
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WORKSPACE_DIR=/app/workspace

volumes:
  shared_data:
```

### 2. Development Workflow

We recommend a phased implementation approach:

1. **Phase 1**: Set up OpenManus as a standalone service
2. **Phase 2**: Implement the communication layer
3. **Phase 3**: Extend SentinelAgent to use OpenManus
4. **Phase 4**: Develop UI components for visualization
5. **Phase 5**: Integrate and test the complete system

## Next Steps

1. Set up a development environment with both Fintellect and OpenManus
2. Create a proof-of-concept integration focusing on the communication layer
3. Develop UI prototypes for the sandbox visualization
4. Implement the full integration in a staged approach
5. Test with various research scenarios to ensure robustness
