# Integration Guide for sentinel_openmanus_service.py

This guide explains how to integrate the new handlers into the sentinel_openmanus_service.py file to enable enhanced terminal command detection, workspace monitoring, and task progress tracking.

## 1. Import the Handlers

Add these imports to the top of `sentinel_openmanus_service.py`:

```python
# Import new handlers
from handlers.terminal_command_handler import TerminalCommandHandler
from handlers.workspace_monitor import WorkspaceMonitor
from handlers.task_progress_tracker import TaskProgressTracker
```

## 2. Add File Content Type Detection

Add this utility function to the file (can be placed with other utility functions):

```python
def guess_content_type(filename):
    """Guess content type based on file extension."""
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == '.py':
        return 'python'
    elif ext in ('.md', '.markdown'):
        return 'markdown'
    elif ext == '.txt':
        return 'text'
    elif ext == '.json':
        return 'json'
    elif ext == '.csv':
        return 'csv'
    elif ext in ('.js', '.ts'):
        return 'javascript'
    elif ext in ('.html', '.htm'):
        return 'html'
    elif ext == '.css':
        return 'css'
    elif ext in ('.yml', '.yaml'):
        return 'yaml'
    elif ext in ('.xml', '.svg'):
        return 'xml'
    elif ext == '.sh':
        return 'shell'
    else:
        return 'text'
```

## 3. Add File Download Handler

Add this function to handle file download requests:

```python
async def handle_file_download(agent_id: str, filename: str):
    """Handle file download request from client."""
    try:
        # Use workspace path from agent configuration or default
        workspace_path = "/app/OpenManus/workspace"
        file_path = os.path.join(workspace_path, filename)
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            # Read file content
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Send content to client
                await manager.send_message({
                    'type': 'file_content',
                    'filename': filename,
                    'content': content,
                    'content_type': guess_content_type(filename)
                }, agent_id)
                logger.info(f"[{agent_id}] Sent file content for {filename}")
                return True
            except UnicodeDecodeError:
                # For binary files, send a message but no content
                await manager.send_message({
                    'type': 'file_content',
                    'filename': filename,
                    'content': f"Binary file ({os.path.getsize(file_path)} bytes)",
                    'content_type': 'binary',
                    'is_binary': True
                }, agent_id)
                logger.info(f"[{agent_id}] Sent binary file info for {filename}")
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

## 4. Update the WebSocket Handler

Find the WebSocket message handler function and update it to handle file download requests:

```python
# In the handler function (the WebSocket connection handler)
async for message in websocket:
    try:
        data = json.loads(message)
        logger.info(f"Received message: {data}")
        
        # ... existing message handling ...
        
        # Handle file download requests
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
        # ... existing error handling ...
```

## 5. Enhance the run_agent_process Function

Update the `run_agent_process` function to initialize and use the new handlers:

```python
async def run_agent_process(agent_id: str, prompt: str):
    # ... existing code ...
    
    # Initialize handlers
    terminal_handler = TerminalCommandHandler(manager)
    workspace_monitor = WorkspaceMonitor(manager, workspace_path="/app/OpenManus/workspace")
    task_tracker = TaskProgressTracker(manager)
    
    # ... more existing code ...
    
    # Begin agent thinking loop - process messages periodically
    async def process_messages_periodically():
        while agent_id in active_agents:
            if hasattr(agent_instance, 'messages'):
                # Process messages for various purposes
                try:
                    messages_list = [msg.to_dict() for msg in agent_instance.messages]
                    
                    # 1. Process browser state (existing handler - keep if already exists)
                    if 'browser_state_handler' in locals():
                        await browser_state_handler.process_messages(agent_id, messages_list)
                    
                    # 2. Process terminal commands (new)
                    await terminal_handler.process_messages(agent_id, messages_list)
                    
                    # 3. Update task progress (new)
                    await task_tracker.process_messages(agent_id, messages_list)
                    
                    # 4. Scan workspace for file changes (new)
                    await workspace_monitor.scan_workspace(agent_id)
                except Exception as e:
                    logger.error(f"Error processing messages: {e}")
                
            # Adjust the sleep interval based on your needs
            await asyncio.sleep(2)  # Check every 2 seconds
    
    # Start the periodic processing
    asyncio.create_task(process_messages_periodically())
    
    # ... rest of existing code ...
```

## 6. Update the directory_listing Function (Optional)

If you have a directory_listing function for the /list endpoint, update it to include content type information:

```python
async def directory_listing(workspace_path: str = "/app/OpenManus/workspace"):
    """List files in the workspace directory."""
    try:
        result = []
        
        for item in os.listdir(workspace_path):
            item_path = os.path.join(workspace_path, item)
            if os.path.isfile(item_path):
                try:
                    file_size = os.path.getsize(item_path)
                    result.append({
                        "name": item,
                        "path": item_path,
                        "size": file_size,
                        "content_type": guess_content_type(item)
                    })
                except Exception as e:
                    logger.error(f"Error getting file info for {item}: {e}")
        
        return result
    except Exception as e:
        logger.error(f"Error listing directory: {e}")
        return []
```

## Implementation Verification

After making these changes, you should run the following tests to verify the implementation:

1. **Terminal Command Detection**: Run the agent and have it execute some terminal commands. Verify these are properly detected and formatted in the UI.

2. **File Monitoring**: Create some files in the workspace and check if they appear in the UI's file list.

3. **Task Progress**: Monitor a complete agent run to ensure it transitions through the expected phases (initialization → data collection → analysis → report). 