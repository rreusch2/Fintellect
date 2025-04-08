# Sentinel UI Enhancement Implementation Plan

## Overview

This document outlines the implementation steps to enhance the Sentinel UI with the new components:

1. Backend handlers for detecting terminal commands and tracking agent progress
2. Updates to the OpenManus service to integrate these handlers 
3. Frontend components for visualizing agent activity and files

## 1. Backend Integration

### 1.1. Adding Handlers to OpenManus Service

The handlers have been implemented in the `openmanus-service/handlers` directory:

- `terminal_command_handler.py` - Detects and processes terminal commands
- `workspace_monitor.py` - Monitors filesystem changes in the workspace
- `task_progress_tracker.py` - Tracks agent progress across states

Now we need to integrate these into the OpenManus service:

1. Add imports to `sentinel_openmanus_service.py`:

```python
from handlers import TerminalCommandHandler, WorkspaceMonitor, TaskProgressTracker
```

2. Initialize handlers in the `run_agent_process` function:

```python
async def run_agent_process(agent_id: str, prompt: str):
    # ... existing code ...
    
    # Initialize handlers
    terminal_handler = TerminalCommandHandler(manager)
    workspace_monitor = WorkspaceMonitor(manager)
    task_tracker = TaskProgressTracker(manager)
    
    # ... more existing code ...
    
    # Begin agent thinking loop - process messages periodically
    async def process_messages_periodically():
        while agent_id in active_agents:
            if hasattr(agent_instance, 'messages'):
                # Process messages for various purposes
                messages_list = [msg.to_dict() for msg in agent_instance.messages]
                
                # 1. Process browser state (existing)
                await browser_state_handler.process_messages(agent_id, messages_list)
                
                # 2. Process terminal commands (new)
                await terminal_handler.process_messages(agent_id, messages_list)
                
                # 3. Update task progress (new)
                await task_tracker.process_messages(agent_id, messages_list)
                
                # 4. Scan workspace for file changes (new)
                await workspace_monitor.scan_workspace(agent_id)
                
            await asyncio.sleep(2)  # Check every 2 seconds
```

3. Add file download handling to the WebSocket handler:

```python
async def handler(websocket: WebSocketServerProtocol):
    # ... existing code ...
    
    async for message in websocket:
        try:
            data = json.loads(message)
            
            # ... existing message handling ...
            
            if data.get("type") == "file_download":
                filename = data.get("filename")
                if filename and agent_id in active_agents:
                    await handle_file_download(agent_id, filename)
                else:
                    await manager.send_message({
                        "type": "error",
                        "message": "Missing filename or no active agent"
                    }, agent_id)
                    
        except json.JSONDecodeError:
            # ... existing error handling ...
```

4. Add the file download handler function:

```python
async def handle_file_download(agent_id: str, filename: str):
    """Handle file download request from client."""
    try:
        file_path = os.path.join("/app/OpenManus/workspace", filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            # Read file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Send content to client
            await manager.send_message({
                'type': 'file_content',
                'filename': filename,
                'content': content,
                'content_type': guess_content_type(filename) # Reuse from WorkspaceMonitor
            }, agent_id)
            logger.info(f"[{agent_id}] Sent file content for {filename}")
            return True
        else:
            logger.warning(f"File {filename} not found for download request")
            await manager.send_message({
                'type': 'error',
                'message': f"File {filename} not found"
            }, agent_id)
            return False
    except Exception as e:
        logger.error(f"Error handling file download for {filename}: {e}")
        await manager.send_message({
            'type': 'error',
            'message': f"Error reading file {filename}: {str(e)}"
        }, agent_id)
        return False
```

## 2. Frontend Integration

### 2.1. Create New Components

Create the following new components in `client/src/features/Sentinel/components`:

1. `FileViewer.tsx` - For viewing file contents
2. Update `TerminalOutput.tsx` - To handle terminal commands properly
3. Update `AgentActivityFeed.tsx` - To show progress and file outputs

### 2.2. Update SentinelPage Component

Add the following state variables to `SentinelPage.tsx`:

```typescript
// New state for enhanced features
const [agentProgress, setAgentProgress] = useState<AgentProgress | undefined>(undefined);
const [workspaceFiles, setWorkspaceFiles] = useState<Array<{
  name: string;
  path: string;
  content: string;
  content_type: string;
}>>([]);
```

Update the WebSocket message handler:

```typescript
localWs.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log("Command WS Message:", message);

    // Extract agentId from the message
    const agentId = message.agentId;
    
    // Handle new message types
    if (message.type === 'terminal_command') {
      addLog({ 
        type: 'terminal_command',
        command: message.command,
        output: message.output,
        agentId
      });
    }
    else if (message.type === 'workspace_files') {
      setWorkspaceFiles(message.files || []);
    }
    else if (message.type === 'agent_progress') {
      setAgentProgress(message.data);
    }
    else if (message.type === 'file_content') {
      // Handle file content (download or display)
      handleFileContent(message);
    }
    // ... existing message type handling
  } catch (e) {
    console.error("Failed to parse command WebSocket message:", e);
  }
};
```

Add a file download handler:

```typescript
const handleFileDownload = (filename: string) => {
  if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify({ 
      type: 'file_download', 
      filename 
    }));
  } else {
    addLog({ 
      type: 'system_error', 
      data: 'Command channel not connected. Cannot request file.',
      agentId: null 
    });
  }
};

const handleFileContent = (message) => {
  // Create a download link
  const blob = new Blob([message.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = message.filename;
  a.click();
  URL.revokeObjectURL(url);
  
  // Show a toast that file was downloaded
  toast({
    title: 'File Downloaded',
    description: `File ${message.filename} has been downloaded.`,
    duration: 3000,
  });
};
```

Update the ResearchDisplay component props:

```typescript
<ResearchDisplay 
  activityLogs={logs.filter(log => 
    ['agent_status', 'user_command', 'task_summary', 'task_error', 'system_info', 'system_error'].includes(log.type)
  )}
  terminalLogs={logs.filter(log =>
    ['terminal_stdout', 'terminal_stderr', 'terminal_command', 'user_command', 'system_info', 'system_error', 'executing_command'].includes(log.type)
  )}
  isConnected={isWsConnected}
  onCommandSubmit={handleSendCommand}
  onAgentPrompt={handleSendCommand}
  browserImages={browserImages}
  browserState={browserState}
  agentProgress={agentProgress}
  workspaceFiles={workspaceFiles}
  onFileDownload={handleFileDownload}
/>
```

## 3. Implementation Schedule

### Phase 1: Backend (Day 1)
1. Integrate the handlers into sentinel_openmanus_service.py
2. Test WebSocket message generation
3. Verify file monitoring works

### Phase 2: Frontend (Days 2-3)
1. Create FileViewer.tsx
2. Update TerminalOutput.tsx
3. Update AgentActivityFeed.tsx
4. Integrate new components into ResearchDisplay.tsx

### Phase 3: Integration & Testing (Day 4)
1. Connect frontend to backend
2. Test with real agent runs
3. Refine UI/UX based on feedback

## 4. Testing Plan

1. **Terminal Command Detection Test**
   - Have agent execute various types of terminal commands
   - Verify commands are detected and displayed properly

2. **File Monitoring Test**
   - Create various files in the workspace
   - Verify files are detected and listed in the UI
   - Test file download functionality

3. **Progress Tracking Test**
   - Run a complete research task
   - Verify progress correctly transitions through stages
   - Check completion handling

## 5. Troubleshooting

Common issues and solutions:

1. **Agent IDs not matching:** Ensure WebSocket messages and state tracking use the same agent ID

2. **File content not readable:** Ensure error handling in the workspace monitor properly handles binary files

3. **Progress detection not working:** Check pattern matching in TaskProgressTracker and add more patterns if needed

4. **Message display timing issues:** Consider adding debouncing to state updates to prevent UI flicker

5. **WebSocket disconnection:** Implement reconnection logic and state persistence 