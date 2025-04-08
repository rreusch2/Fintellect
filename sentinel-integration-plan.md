# Sentinel UI Enhancement Technical Plan

## Overview

This plan outlines the technical enhancements needed to improve the Sentinel UI, specifically:

1. **Terminal Output Improvements** - Display actual commands and execution results
2. **Agent Activity Feed Improvements** - Show step-based summaries and file results
3. **File Result Integration** - Add downloadable file support with previews

## 1. Backend Modifications

### 1.1. Enhanced Terminal Command Detection and Forwarding

#### File: `openmanus-service/sentinel_openmanus_service.py`

We'll enhance the Python service to detect and forward terminal commands by:

1. Adding a `TerminalCommandHandler` class to detect commands
2. Implementing workspace file monitoring
3. Creating message categorization for better UI display

```python
class TerminalCommandHandler:
    def __init__(self, connection_manager):
        self.connection_manager = connection_manager
        self.last_command = {}  # Store last command per agent_id
        
    async def process_messages(self, agent_id: str, messages: list):
        """Process messages to extract terminal commands and their outputs."""
        for message in messages:
            # Check for terminal/command events in tool messages
            if message.get('role') == 'tool' and message.get('content'):
                content = message.get('content')
                
                # Try to detect shell commands (most important ones to show)
                if isinstance(content, str):
                    try:
                        content_obj = json.loads(content)
                        
                        # Check if it's a terminal command output
                        if ('observation' in content_obj and 
                            isinstance(content_obj['observation'], str) and
                            ('ubuntu@sandbox' in content_obj['observation'] or 
                             'cd /' in content_obj['observation'] or
                             'python' in content_obj['observation'])):
                            
                            # Extract command and output
                            await self.connection_manager.send_message({
                                'type': 'terminal_command',
                                'command': self.extract_command(content_obj),
                                'output': self.extract_output(content_obj)
                            }, agent_id)
                    except:
                        pass
    
    def extract_command(self, content_obj):
        """Extract the command from content."""
        # Simple heuristic to extract the command from a terminal output
        observation = content_obj.get('observation', '')
        if 'ubuntu@sandbox' in observation:
            # Find the line with the command
            for line in observation.split('\n'):
                if 'ubuntu@sandbox' in line and '$' in line:
                    cmd = line.split('$', 1)[1].strip()
                    if cmd:
                        return cmd
        return ''
        
    def extract_output(self, content_obj):
        """Extract the command output."""
        observation = content_obj.get('observation', '')
        if 'ubuntu@sandbox' in observation:
            # Get everything after the first command line
            lines = observation.split('\n')
            for i, line in enumerate(lines):
                if 'ubuntu@sandbox' in line and '$' in line:
                    # Return the rest of the output
                    return '\n'.join(lines[i+1:])
        return observation
```

### 1.2. Workspace File Monitoring

Add a file system watcher to monitor the OpenManus workspace folder:

```python
class WorkspaceMonitor:
    def __init__(self, connection_manager, workspace_path="/app/OpenManus/workspace"):
        self.connection_manager = connection_manager
        self.workspace_path = workspace_path
        self.known_files = {}  # agent_id -> {filename: last_modified}
        
    async def scan_workspace(self, agent_id):
        """Scan workspace for new or modified files."""
        try:
            if not os.path.exists(self.workspace_path):
                logger.warning(f"Workspace path {self.workspace_path} does not exist")
                return
                
            if agent_id not in self.known_files:
                self.known_files[agent_id] = {}
                
            current_files = {}
            file_updates = []
            
            # Scan workspace files
            for filename in os.listdir(self.workspace_path):
                file_path = os.path.join(self.workspace_path, filename)
                if os.path.isfile(file_path):
                    # Get modification time
                    mtime = os.path.getmtime(file_path)
                    current_files[filename] = mtime
                    
                    # Check if new or modified
                    if filename not in self.known_files[agent_id] or self.known_files[agent_id][filename] < mtime:
                        # Read file content
                        try:
                            with open(file_path, 'r') as f:
                                content = f.read()
                            
                            # Only include text files, max 10KB
                            if len(content) < 10240 and is_text_file(content):
                                file_updates.append({
                                    'name': filename,
                                    'path': file_path,
                                    'content': content[:2048],  # Truncate large content
                                    'content_type': guess_content_type(filename)
                                })
                        except:
                            logger.error(f"Error reading file {file_path}")
            
            # Update known files
            self.known_files[agent_id] = current_files
            
            # Send file updates if any
            if file_updates:
                await self.connection_manager.send_message({
                    'type': 'workspace_files',
                    'files': file_updates
                }, agent_id)
                
        except Exception as e:
            logger.error(f"Error scanning workspace: {e}")
            
    def is_text_file(content):
        """Check if content is likely text."""
        return all(c < 128 for c in content[:1000])
        
    def guess_content_type(filename):
        """Guess content type based on extension."""
        if filename.endswith('.py'):
            return 'python'
        elif filename.endswith('.md'):
            return 'markdown'
        elif filename.endswith('.txt'):
            return 'text'
        elif filename.endswith('.json'):
            return 'json'
        elif filename.endswith('.csv'):
            return 'csv'
        else:
            return 'text'
```

### 1.3. Task Progress Categorization

Add a component to categorize agent progress into steps:

```python
class TaskProgressTracker:
    """Tracks agent progress and categorizes into meaningful steps."""
    
    def __init__(self, connection_manager):
        self.connection_manager = connection_manager
        self.agent_states = {}  # agent_id -> current state info
        
    async def process_messages(self, agent_id: str, messages: list):
        """Process messages to derive task progress."""
        if agent_id not in self.agent_states:
            self.agent_states[agent_id] = {
                'step': 'initialization',
                'progress': 0,
                'steps_completed': [],
                'current_focus': 'Starting research',
                'output_files': []
            }
            
            # Send initial state
            await self.send_state_update(agent_id)
        
        # Look for progress indicators in messages
        state_change = False
        
        for message in messages:
            if self.update_state_from_message(agent_id, message):
                state_change = True
                
        if state_change:
            await self.send_state_update(agent_id)
    
    def update_state_from_message(self, agent_id: str, message: dict):
        """Update agent state based on message content."""
        # Extract content - handle different message types
        content = ''
        if message.get('role') == 'assistant' and message.get('content'):
            content = message['content']
        elif message.get('role') == 'tool' and message.get('content'):
            try:
                content_obj = json.loads(message['content'])
                if 'observation' in content_obj:
                    content = content_obj['observation']
            except:
                content = str(message['content'])
        else:
            return False
            
        # Don't process if empty content
        if not content:
            return False
            
        state = self.agent_states[agent_id]
        changed = False
        
        # Pattern matching for state transitions
        if state['step'] == 'initialization' and ('searching' in content.lower() or 'collecting data' in content.lower()):
            state['step'] = 'data_collection'
            state['progress'] = 20
            state['current_focus'] = 'Gathering financial data and market information'
            state['steps_completed'].append({
                'name': 'Initialization complete',
                'description': 'Agent has initialized and started gathering data'
            })
            changed = True
            
        elif state['step'] == 'data_collection' and ('analyzing' in content.lower() or 'processing data' in content.lower()):
            state['step'] = 'analysis'
            state['progress'] = 50
            state['current_focus'] = 'Analyzing collected financial information'
            state['steps_completed'].append({
                'name': 'Data collection complete',
                'description': 'Agent has collected necessary market data'
            })
            changed = True
            
        elif state['step'] == 'analysis' and ('generating report' in content.lower() or 'creating summary' in content.lower()):
            state['step'] = 'report_generation'
            state['progress'] = 80
            state['current_focus'] = 'Generating financial insights and reports'
            state['steps_completed'].append({
                'name': 'Analysis complete',
                'description': 'Agent has analyzed collected data'
            })
            changed = True
            
        elif state['step'] == 'report_generation' and ('completed' in content.lower() or 'finished' in content.lower()):
            state['step'] = 'complete'
            state['progress'] = 100
            state['current_focus'] = 'Research complete'
            state['steps_completed'].append({
                'name': 'Report generation complete',
                'description': 'Agent has generated final reports and insights'
            })
            changed = True
            
        # Detect created files
        file_matches = re.findall(r'Created (?:file|report|output) (\w+\.\w+)', content)
        for file_match in file_matches:
            if file_match not in [f['name'] for f in state['output_files']]:
                state['output_files'].append({
                    'name': file_match,
                    'type': file_match.split('.')[-1],
                    'timestamp': datetime.now().isoformat()
                })
                changed = True
        
        return changed
        
    async def send_state_update(self, agent_id):
        """Send the current state update via websocket."""
        await self.connection_manager.send_message({
            'type': 'agent_progress',
            'data': self.agent_states[agent_id]
        }, agent_id)
```

### 1.4. Integration with OpenManus Service

Update the agent process flow to use these new components:

```python
async def run_agent_process(agent_id: str, prompt: str):
    # ... [existing code]
    
    # Initialize handlers
    terminal_handler = TerminalCommandHandler(manager)
    workspace_monitor = WorkspaceMonitor(manager)
    task_tracker = TaskProgressTracker(manager)
    
    # Begin agent thinking loop - process messages periodically
    async def process_messages_periodically():
        while agent_id in active_agents:
            if hasattr(agent_instance, 'messages'):
                # Process messages for various purposes
                messages_list = [msg.to_dict() for msg in agent_instance.messages]
                
                # 1. Process browser state
                await browser_state_handler.process_messages(agent_id, messages_list)
                
                # 2. Process terminal commands
                await terminal_handler.process_messages(agent_id, messages_list)
                
                # 3. Update task progress
                await task_tracker.process_messages(agent_id, messages_list)
                
                # 4. Scan workspace for file changes
                await workspace_monitor.scan_workspace(agent_id)
                
            await asyncio.sleep(2)  # Check every 2 seconds
```

## 2. Frontend Modifications

### 2.1. Improved Terminal Output Component

#### File: `client/src/features/Sentinel/components/TerminalOutput.tsx`

Enhance to better display commands and their outputs:

```typescript
// Existing imports...

// Additional command formatting
const formatCommand = (command: string) => {
  return (
    <div className="command-block">
      <span className="text-green-400 font-semibold">$ </span>
      <span className="text-cyan-300">{command}</span>
    </div>
  );
};

// Existing component with modifications
const TerminalOutput: React.FC<TerminalOutputProps> = ({ logs, isConnected, onCommandSubmit }) => {
  // ... existing code

  // Enhanced render function with command highlighting
  const renderLogContent = (log: LogLine) => {
    // Special handling for terminal_command type (new)
    if (log.type === 'terminal_command') {
      return (
        <div>
          {formatCommand(log.command)}
          <div className="pl-4 text-gray-300 whitespace-pre-wrap">{log.output}</div>
        </div>
      );
    }
    
    // Original cases
    switch (log.type) {
      case 'terminal_stdout':
        return formatOutput(log.data, log.type);
      // ... existing cases
    }
  };
  
  // ... rest of component
};
```

### 2.2. Enhanced Agent Activity Feed

#### File: `client/src/features/Sentinel/components/AgentActivityFeed.tsx`

Improve to show meaningful steps and file results:

```typescript
// Existing imports...
import { Download, CheckCircle } from 'lucide-react';

// New props to handle agent progress
interface AgentProgress {
  step: string;
  progress: number;
  steps_completed: Array<{ name: string; description: string }>;
  current_focus: string;
  output_files: Array<{ name: string; type: string; timestamp: string }>;
}

interface AgentActivityFeedProps {
  logs: LogLine[];
  progress?: AgentProgress;
  onCommandSubmit: (command: string) => void;
  onFileDownload: (filename: string) => void;
}

const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
  logs,
  progress,
  onCommandSubmit,
  onFileDownload
}) => {
  // ... existing code

  // New rendering for agent progress
  const renderAgentProgress = () => {
    if (!progress) return null;
    
    return (
      <div className="agent-progress mb-4 p-3 border-l-2 border-indigo-500 bg-indigo-900/20 rounded-r">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-indigo-300">Current Progress</h4>
          <span className="text-xs bg-indigo-800 px-1.5 py-0.5 rounded text-indigo-200">
            {progress.progress}%
          </span>
        </div>
        
        <div className="w-full bg-gray-700 h-1.5 rounded overflow-hidden mb-2">
          <div 
            className="bg-indigo-500 h-full rounded" 
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-300 italic">{progress.current_focus}</p>
        
        {/* Completed Steps */}
        {progress.steps_completed.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs uppercase text-gray-400 mb-1">Completed Steps</h5>
            <div className="space-y-1">
              {progress.steps_completed.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-200">{step.name}</p>
                    {step.description && (
                      <p className="text-xs text-gray-400">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Output Files */}
        {progress.output_files.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs uppercase text-gray-400 mb-1">Generated Files</h5>
            <div className="flex flex-wrap gap-2 mt-1">
              {progress.output_files.map((file, idx) => (
                <button
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-blue-300 transition"
                  onClick={() => onFileDownload(file.name)}
                >
                  <Download size={12} />
                  {file.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="agent-activity-log flex flex-col h-full bg-gradient-to-b from-gray-950 to-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Header (existing) */}
      
      {/* Log Area with Progress */}
      <div className="flex-1 overflow-y-auto p-3 text-sm space-y-2">
        {/* Show progress at the top if available */}
        {renderAgentProgress()}
        
        {/* Regular logs */}
        {activityLogs.map((log) => (
          // ... existing log rendering
        ))}
        
        {/* ... rest of existing rendering */}
        <div ref={logsEndRef} /> 
      </div>
      
      {/* ... rest of component */}
    </div>
  );
};
```

### 2.3. File Viewer Component

#### File: `client/src/features/Sentinel/components/FileViewer.tsx`

Create a new component to display file contents:

```typescript
import React from 'react';
import { X, Download, FileText, FileCode } from 'lucide-react';

interface FileViewerProps {
  file: {
    name: string;
    content: string;
    content_type: string;
  };
  onClose: () => void;
  onDownload: (filename: string) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, onDownload }) => {
  // Helper to select icon based on file type
  const getFileIcon = () => {
    switch (file.content_type) {
      case 'python':
        return <FileCode className="text-blue-400" />;
      case 'markdown':
        return <FileText className="text-purple-400" />;
      case 'json':
        return <FileCode className="text-yellow-400" />;
      default:
        return <FileText className="text-gray-400" />;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-3">
          <div className="flex items-center gap-2">
            {getFileIcon()}
            <h3 className="font-medium text-gray-200">{file.name}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-blue-400 transition"
              onClick={() => onDownload(file.name)}
              title="Download file"
            >
              <Download size={18} />
            </button>
            <button 
              className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400 transition"
              onClick={onClose}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* File Content */}
        <div className="overflow-auto flex-1 p-4">
          <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
            {file.content}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
```

### 2.4. Update ResearchDisplay Component

#### File: `client/src/features/Sentinel/components/ResearchDisplay.tsx`

Integrate new components and handle file operations:

```typescript
// Existing imports...
import FileViewer from './FileViewer';

// Updated interface
interface ResearchDisplayProps {
  // ... existing props
  agentProgress?: AgentProgress;
  workspaceFiles?: Array<{
    name: string;
    path: string;
    content: string;
    content_type: string;
  }>;
  onFileDownload: (filename: string) => void;
}

const ResearchDisplay: React.FC<ResearchDisplayProps> = ({
  // ... existing props
  agentProgress,
  workspaceFiles = [],
  onFileDownload
}) => {
  // ... existing state
  const [viewingFile, setViewingFile] = useState<null | {
    name: string;
    content: string;
    content_type: string;
  }>(null);
  
  // Handler for workspace file downloads
  const handleFileClick = (filename: string) => {
    const file = workspaceFiles.find(f => f.name === filename);
    if (file) {
      setViewingFile({
        name: file.name,
        content: file.content,
        content_type: file.content_type
      });
    } else {
      // If file metadata exists but content not available, trigger download
      onFileDownload(filename);
    }
  };
  
  // ... rest of component
  
  return (
    <div className={`grid gap-4 h-full ${rightPaneVisible ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
      {/* Agent Activity Feed (Left Pane) */}
      <div className={rightPaneVisible ? '' : 'col-span-1'}>
        <AgentActivityLog 
          logs={activityLogs} 
          progress={agentProgress}
          onCommandSubmit={onAgentPrompt}
          onFileDownload={handleFileClick}
        />
      </div>

      {/* Right Pane (Terminal/Browser) */}
      {/* ... existing right pane code */}
      
      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer 
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onDownload={onFileDownload}
        />
      )}
    </div>
  );
};
```

## 3. Message Flow & Integration

### 3.1. New WebSocket Message Types

We're introducing new message types for enhanced functionality:

| Type | Description | Sender | Data Structure |
|------|-------------|--------|----------------|
| `terminal_command` | Terminal command and output | Server | `{ command: string, output: string }` |
| `workspace_files` | Detected files in workspace | Server | `{ files: Array<{name, path, content, content_type}> }` |
| `agent_progress` | Agent progress tracking | Server | `{ step, progress, steps_completed, current_focus, output_files }` |
| `file_download` | Request file download | Client | `{ filename: string }` |

### 3.2. Integration in SentinelPage

Update the page component to handle new message types:

```typescript
// In SentinelPage.tsx

// New state for enhanced features
const [agentProgress, setAgentProgress] = useState<AgentProgress | undefined>(undefined);
const [workspaceFiles, setWorkspaceFiles] = useState<Array<{
  name: string;
  path: string;
  content: string;
  content_type: string;
}>>([]);

// Modified WebSocket message handler
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
    // ... existing message handlers
  } catch (e) {
    console.error("Failed to parse command WebSocket message:", e);
    addLog({ type: 'system_info', data: `Received raw message: ${event.data}`, agentId: null });
  }
};

// File download handler
const handleFileDownload = (filename: string) => {
  if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify({ type: 'file_download', filename }));
  } else {
    addLog({ type: 'system_error', data: 'Command channel not connected. Cannot request file.', agentId: null });
  }
};

// In the running tab render function
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

## 4. Server-Side File Download Handling

Add endpoint to handle file download requests:

```python
# In sentinel_openmanus_service.py

# Handle file download request
async def handle_file_download(agent_id: str, filename: str):
    """Handle file download request."""
    try:
        file_path = os.path.join("/app/OpenManus/workspace", filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            # Read file content
            with open(file_path, 'r') as f:
                content = f.read()
                
            # Send content to client
            await manager.send_message({
                'type': 'file_content',
                'filename': filename,
                'content': content,
                'content_type': guess_content_type(filename)
            }, agent_id)
            return True
        else:
            logger.warning(f"File {filename} not found for download request")
            return False
    except Exception as e:
        logger.error(f"Error handling file download for {filename}: {e}")
        return False

# Update WebSocket handler to handle file download requests
async def handler(websocket: WebSocketServerProtocol):
    # ... existing code
    
    async for message in websocket:
        try:
            data = json.loads(message)
            
            # ... existing message handling
            
            if data.get("type") == "file_download":
                filename = data.get("filename")
                if filename and active_agent_id:
                    await handle_file_download(active_agent_id, filename)
                else:
                    await manager.send_message({
                        "type": "error",
                        "message": "Missing filename or no active agent"
                    }, client_id)
                    
        except json.JSONDecodeError:
            # ... existing error handling
```

## 5. Implementation Timeline

1. **Phase 1: Backend Enhancements**
   - Implement TerminalCommandHandler
   - Implement WorkspaceMonitor
   - Implement TaskProgressTracker
   - Update run_agent_process to use new components

2. **Phase 2: Frontend Component Updates**
   - Update TerminalOutput to display commands
   - Enhance AgentActivityFeed for progress display
   - Create FileViewer component
   - Update ResearchDisplay to integrate new components

3. **Phase 3: Message Flow and Integration**
   - Add new WebSocket message types
   - Update SentinelPage to handle new message types
   - Implement file download functionality

4. **Phase 4: Testing and Refinement**
   - Test with real agent runs
   - Refine pattern matching for better task progress tracking
   - Improve UI/UX based on feedback 