# openmanus-service/sentinel_openmanus_service.py
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import asyncio
import uuid
import logging
import json
from typing import Dict, Any, List
from pathlib import Path
import tomli_w

# --- Restore OpenManus Imports --- #
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'OpenManus'))
try:
    from OpenManus.app.agent.manus import Manus
    from OpenManus.app.schema import Message
    from OpenManus.app.tool import BrowserUseTool # Import BrowserUseTool for detecting browser events
    OPENMANUS_AVAILABLE = True
except ImportError as e:
    logging.error(f"Failed to import OpenManus components: {e}. OpenManus functionality disabled.")
    OPENMANUS_AVAILABLE = False
# ------------------------------- #

# --- Browser State Handling --- #
class BrowserStateHandler:
    """Handler for browser state events from OpenManus."""
    
    def __init__(self, connection_manager):
        self.connection_manager = connection_manager
        self.last_screenshot = {}  # Store last screenshot per agent_id to avoid duplicates
        
    async def process_messages(self, agent_id: str, messages: list):
        """Process messages from agent to extract browser state."""
        # Look for messages from browser_use tool
        for message in messages:
            # We're interested in tool responses with browser state or images
            if message.get('role') == 'tool' and message.get('content'):
                content = message.get('content')
                if isinstance(content, str):
                    try:
                        # Try to parse as JSON
                        content_obj = json.loads(content)
                        
                        # Check if it's a browser_use tool response with state info
                        if ('output' in content_obj and 
                            isinstance(content_obj['output'], str) and 
                            ('"url":' in content_obj['output'] or '"title":' in content_obj['output'])):
                            
                            # Extract and send screenshot if available
                            base64_image = content_obj.get('base64_image')
                            
                            # Only send if it's a new screenshot (avoid duplicates)
                            if base64_image and self.last_screenshot.get(agent_id) != base64_image:
                                self.last_screenshot[agent_id] = base64_image
                                
                                # Send browser state event to client
                                await self.connection_manager.send_message({
                                    'type': 'browser_state',
                                    'data': content_obj['output'],
                                    'base64_image': base64_image
                                }, agent_id)
                                
                                logger.info(f"Sent browser state with screenshot for agent {agent_id}")
                            elif '"url":' in content_obj['output']:
                                # Still send state updates without screenshots or with duplicate screenshots
                                await self.connection_manager.send_message({
                                    'type': 'browser_state',
                                    'data': content_obj['output'],
                                }, agent_id)
                                logger.info(f"Sent browser state update (no new screenshot) for agent {agent_id}")
                    except (ValueError, json.JSONDecodeError, TypeError):
                        # Not valid JSON or not the structure we're looking for
                        pass
# --- End Browser State Handling --- #

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Initializing FastAPI App...")
app = FastAPI()
logger.info("FastAPI App instance created.")

active_agents: Dict[str, Manus] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, agent_id: str):
        await websocket.accept()
        self.active_connections[agent_id] = websocket
        logger.info(f"WebSocket connected for agent {agent_id}. Active connections: {list(self.active_connections.keys())}")

    def disconnect(self, agent_id: str):
        if agent_id in self.active_connections:
            del self.active_connections[agent_id]
            logger.info(f"WebSocket disconnected for agent {agent_id}. Active connections: {list(self.active_connections.keys())}")

    async def send_message(self, message: dict, agent_id: str):
        websocket = self.active_connections.get(agent_id)
        if websocket:
            try:
                # Add more detailed logging about what is being sent
                logger.info(f"Sending message type '{message['type']}' to agent {agent_id}")
                if message['type'] in ['terminal_command', 'workspace_files', 'browser_state', 'agent_progress']:
                    logger.info(f"Sending specialized message: {message}")
                
                await websocket.send_json(message)
                logger.debug(f"Successfully sent message type '{message['type']}' to agent {agent_id}")
                return True
            except WebSocketDisconnect:
                logger.warning(f"WebSocket disconnected while sending to agent {agent_id}")
                self.disconnect(agent_id)
                return False
            except Exception as e:
                logger.error(f"Error sending message to agent {agent_id}: {e}", exc_info=True)
                return False
        else:
            logger.warning(f"No active WebSocket connection for agent {agent_id} to send {message['type']}")
            # Try to find if this agent_id exists with a different key
            for conn_id in list(self.active_connections.keys()):
                logger.info(f"Available connection: {conn_id}")
            return False

manager = ConnectionManager()
browser_state_handler = BrowserStateHandler(manager)

# Helper function for reading file content asynchronously
def read_file_content(file_path: str) -> str | None:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        # Log the specific error here as well for better debugging
        logging.error(f"Error in read_file_content for {file_path}: {e}")
        return None

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

async def run_agent_process(agent_id: str, prompt: str):
    if not OPENMANUS_AVAILABLE:
        logger.error("OpenManus not available, cannot start research.")
        return

    logger.info(f"Starting REAL OpenManus research for agent {agent_id}...")
    
    # Log WebSocket connection status
    logger.info(f"WebSocket connections at start: {list(manager.active_connections.keys())}")
    if agent_id in manager.active_connections:
        logger.info(f"WebSocket connection exists for agent {agent_id}")
    else:
        logger.warning(f"No WebSocket connection for agent {agent_id}")
    
    await manager.send_message({"type": "status", "message": "Agent process starting...", "agentId": agent_id}, agent_id)

    agent_instance: Manus | None = None
    final_result_payload: Dict[str, Any] = {
        "type": "final_result", "results": [], "files": []
    }

    try:
        agent_instance = Manus()
        active_agents[agent_id] = agent_instance
        logger.info(f"Manus agent instance created for {agent_id}.")

        await manager.send_message({"type": "status", "message": "Executing research steps...", "agentId": agent_id}, agent_id)
        
        # Begin agent thinking loop - process messages periodically
        async def process_messages_periodically():
            message_count = 0
            while agent_id in active_agents:
                message_count += 1
                if message_count % 10 == 0:
                    logger.info(f"Processing messages iteration {message_count} for agent {agent_id}")
                
                if hasattr(agent_instance, 'messages'):
                    try:
                        # Process messages for browser state and other updates
                        messages_list = [msg.to_dict() for msg in agent_instance.messages]
                        logger.debug(f"Got {len(messages_list)} messages for agent {agent_id}")
                        
                        # 1. Process browser state
                        await browser_state_handler.process_messages(agent_id, messages_list)
                        
                        # 5. Periodically send heartbeat status messages
                        if message_count % 50 == 0:  # Every ~100 seconds
                            await manager.send_message({
                                "type": "agent_status", 
                                "data": f"Agent still running... (iteration {message_count})",
                                "agentId": agent_id
                            }, agent_id)
                        
                    except Exception as e:
                        logger.error(f"Error processing messages: {str(e)}", exc_info=True)
                
                await asyncio.sleep(2)  # Check every 2 seconds
        
        # Start background task for processing
        message_processing_task = asyncio.create_task(process_messages_periodically())
        
        # Run the agent with the prompt
        final_answer = await agent_instance.run(prompt)
        
        # Cancel the periodic task once the agent finishes
        message_processing_task.cancel()
        try:
            await message_processing_task
        except asyncio.CancelledError:
            pass
            
        logger.info(f"Agent {agent_id} run completed. Final Answer: {final_answer}")

        # Retrieve final results and history
        # TODO: Refine how the 'final answer' is identified and extracted
        final_answer = "Agent finished, but no specific report output found." # Default
        full_history = []
        try:
            # Use the correct property to access history
            full_history = [msg.to_dict() for msg in agent_instance.messages] # Convert Message objects to dicts
            logger.info(f"Agent {agent_id} final history retrieved, length: {len(full_history)}")

            # Attempt to find the output of the last python_execute tool call
            python_execute_results = [
                msg for msg in reversed(full_history)
                if msg.get('role') == 'tool' and msg.get('tool_call_id') # Ensure tool_call_id exists
            ]
            # Find the corresponding assistant message with the tool call to check the name
            for tool_msg in python_execute_results:
                assistant_tool_call_msg = next((
                    m for m in reversed(full_history)
                    if m.get('role') == 'assistant' and m.get('tool_calls') and
                       any(tc.get('id') == tool_msg.get('tool_call_id') for tc in m['tool_calls'])
                ), None)

                if assistant_tool_call_msg:
                     # Find the specific tool call details
                     tool_call_details = next((
                         tc for tc in assistant_tool_call_msg['tool_calls']
                         if tc.get('id') == tool_msg.get('tool_call_id') and tc.get('function', {}).get('name') == 'python_execute'
                     ), None)

                     if tool_call_details:
                        # Found the result of a python_execute call
                        # Extract the observation if possible
                        tool_content = tool_msg.get('content', '{}')
                        if isinstance(tool_content, str):
                            try:
                                # Handle escaped string format if necessary
                                import json
                                import ast
                                # Try parsing as JSON first, then literal eval as fallback
                                try:
                                    content_dict = json.loads(tool_content)
                                except json.JSONDecodeError:
                                    try:
                                        # Handle cases where it might be a string literal of a dict
                                        content_dict = ast.literal_eval(tool_content)
                                    except (SyntaxError, ValueError):
                                        content_dict = {} # Fallback

                                if isinstance(content_dict, dict) and 'observation' in content_dict:
                                     final_answer = content_dict['observation'].strip()
                                     logger.info(f"Extracted final answer from python_execute observation.")
                                     break # Stop searching once found
                                else:
                                     logger.warning(f"Python execute result content was not a dict with 'observation': {tool_content[:100]}...")
                            except Exception as parse_err:
                                logger.warning(f"Could not parse python_execute result content: {parse_err}. Content: {tool_content[:100]}...")
                                final_answer = tool_content # Fallback to raw content
                                break
                        else:
                            final_answer = str(tool_content) # Fallback if content is not string
                            break


            # Fallback to last assistant message if no python_execute output found
            if final_answer == "Agent finished, but no specific report output found.":
                 assistant_messages = [m for m in full_history if m.get('role') == 'assistant' and m.get('content')]
                 if assistant_messages:
                     final_answer = assistant_messages[-1].get('content', final_answer) # Get content of the last assistant message

        except Exception as hist_err:
            logger.error(f"Agent {agent_id} - Error processing history/final answer: {hist_err}")
            final_answer = f"Agent finished, but history processing failed: {hist_err}"

        # --- Get list of generated files ---
        generated_files = []
        try:
            # Use the workspace_root from the agent's config if available
            # Default to the path used in docker-compose if not found
            workspace_dir_str = "/app/OpenManus/workspace" # Default path
            if hasattr(agent_instance, 'config') and hasattr(agent_instance.config, 'workspace_root'):
                 workspace_dir_str = str(agent_instance.config.workspace_root)

            workspace_path = Path(workspace_dir_str)
            if workspace_path.is_dir():
                logger.info(f"Listing files in workspace: {workspace_path}")
                for item in workspace_path.iterdir():
                    if item.is_file():
                         # Create a relative path for the frontend if possible
                         try:
                             relative_path = item.relative_to(Path("/app/OpenManus"))
                             generated_files.append({"name": item.name, "path": str(relative_path)})
                         except ValueError:
                            # If it's outside the expected parent, just use the name
                            logger.warning(f"File {item.name} found outside expected OpenManus dir, using name only.")
                            generated_files.append({"name": item.name, "path": item.name})

                logger.info(f"Found generated files: {generated_files}")
                final_result_payload["files"] = generated_files
            else:
                 logger.warning(f"Workspace directory not found or not a directory: {workspace_path}")

        except Exception as file_err:
            logger.error(f"Error listing files in workspace {workspace_dir_str}: {file_err}")
        # --- End Get list of generated files ---

        # Prepare the final payload
        summary = final_answer[:500] + ('...' if len(final_answer) > 500 else '') # Use extracted answer for summary
        report_content = { "report_text": final_answer, "full_history": full_history }
        results_list = [
            {"type": "report", "title": f"OpenManus Research Summary ({agent_id})", "summary": summary,
             "content": report_content,
             "sources": [], "analysisMetadata": {}}]

        # Update the payload dictionary
        final_result_payload["results"] = results_list
        # Files are already added if found

        # --- Log the final payload structure before sending --- #
        logger.info(f"---- Preparing final_result payload for Agent {agent_id} ----")
        logger.info(f"Final Answer (type: {type(final_answer)}, len: {len(final_answer)}): {final_answer[:200]}...")
        logger.info(f"Full History (type: {type(full_history)}, len: {len(full_history)}, element_type: {type(full_history[0]) if full_history else 'N/A'})")
        logger.info(f"Generated Files: {generated_files}")
        # Avoid logging the full history/results again here if it's too verbose
        # log.info(f"Payload to send: {final_result_payload}")
        logger.info(f"---- End Payload Prep ----")
        # --- End Logging --- #

        # --- Read Report Files and Add Content ---
        file_contents = {}
        report_files_to_read = {
            'financial_research_report.txt': os.path.join(workspace_path, 'financial_research_report.txt'),
            'financial_research_summary.txt': os.path.join(workspace_path, 'financial_research_summary.txt')
        }

        # Check if the result structure is as expected and files were generated
        if isinstance(final_result_payload, dict) and 'files' in final_result_payload and isinstance(final_result_payload['files'], list):
            generated_filenames = {f.get('name') for f in final_result_payload['files'] if isinstance(f, dict) and 'name' in f}
            
            for filename, expected_full_path in report_files_to_read.items():
                # Only try to read if the agent reported generating the file
                if filename in generated_filenames:
                    try:
                        logger.info(f"[{agent_id}] Attempting to read content of file: {expected_full_path}")
                        content = await asyncio.to_thread(read_file_content, expected_full_path)
                        if content is not None:
                            file_contents[filename] = content
                            logger.info(f"[{agent_id}] Successfully read {len(content)} characters from {filename}.")
                        else:
                           logger.warning(f"[{agent_id}] Read operation returned None for: {expected_full_path}")
                    except FileNotFoundError:
                        logger.warning(f"[{agent_id}] Report file not found during read attempt: {expected_full_path}")
                    except Exception as read_err:
                        logger.error(f"[{agent_id}] Error reading file {expected_full_path}: {read_err}")
                else:
                    logger.warning(f"[{agent_id}] Agent did not report generating file: {filename}")
        else:
             logger.warning(f"[{agent_id}] Could not process final_result files list for content reading. final_result type: {type(final_result_payload)}")
        # -----------------------------------------

        # Prepare the payload, ensuring values exist or provide defaults
        results_list = []
        files_list = []
        if isinstance(final_result_payload, dict):
            results_list = final_result_payload.get('results', [])
            files_list = final_result_payload.get('files', [])
        elif final_result_payload is not None: # Handle non-dict but non-None results
             results_list = [final_result_payload]

        result_payload = {
            "type": "final_result",
            "results": results_list,
            "files": files_list,
            "file_contents": file_contents, # Add the dictionary of file contents
            "agentId": agent_id
        }
        logger.info(f"[{agent_id}] Sending final_result (contents included: {bool(file_contents)}).")
        await manager.send_message(result_payload, agent_id)
        await manager.send_message({"type": "status", "message": "Agent process completed successfully."}, agent_id)

    except Exception as e:
        logger.error(f"Error during agent process for {agent_id}: {e}", exc_info=True)
        await manager.send_message({"type": "error", "message": f"Agent process failed: {type(e).__name__}: {e}"}, agent_id)
        final_result_payload["results"] = [
             {"type": "report", "title": f"OpenManus Research FAILED ({agent_id})",
              "summary": f"Agent process failed with error: {type(e).__name__}: {e}",
              "content": {"error_details": str(e)}, "sources": [], "analysisMetadata": {}}]
        await manager.send_message(final_result_payload, agent_id)

    finally:
        logger.info(f"Agent process finishing for {agent_id}.")
        if agent_instance and hasattr(agent_instance, 'cleanup'):
            try:
                await agent_instance.cleanup()
                logger.info(f"Agent {agent_id} cleanup complete.")
            except Exception as cleanup_error:
                logger.error(f"Error during agent cleanup for {agent_id}: {cleanup_error}")
        if agent_id in active_agents:
            del active_agents[agent_id]

@app.post("/api/research/start")
async def start_research(request_data: dict):
    prompt = request_data.get("prompt")
    if not prompt:
        return JSONResponse(status_code=400, content={"error": "Prompt is required"})
    if not OPENMANUS_AVAILABLE:
        logger.error("OpenManus not available, cannot start research.")
        return JSONResponse(status_code=500, content={"error": "OpenManus agent backend is not configured or failed to load."})

    agent_id = str(uuid.uuid4())
    logger.info(f"Received start research request. Assigning agent ID: {agent_id}")
    asyncio.create_task(run_agent_process(agent_id, prompt))
    return {"agent_id": agent_id, "status": "started"}

@app.websocket("/ws/agent/{agent_id}")
async def agent_websocket(websocket: WebSocket, agent_id: str):
    await manager.connect(websocket, agent_id)
    try:
        # Send a welcome message to test the connection
        await manager.send_message({
            'type': 'agent_status',
            'data': 'WebSocket connection established. Ready to receive agent updates.',
            'agentId': agent_id
        }, agent_id)
        
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                logger.info(f"Received message from client for agent {agent_id}: {message_data}")
                
                # Handle file download requests
                if message_data.get("type") == "file_download":
                    filename = message_data.get("filename")
                    if filename:
                        await handle_file_download(agent_id, filename)
                    else:
                        await manager.send_message({
                            "type": "error",
                            "message": "Missing filename for file download",
                            "agentId": agent_id
                        }, agent_id)
                # Handle debug client messages
                elif message_data.get("type") == "debug_client_message":
                    logger.info(f"Received debug message from client: {message_data.get('message')}")
                    
                    # Echo the message back
                    await manager.send_message({
                        "type": "system_info",
                        "data": f"Server received your message: {message_data.get('message')}",
                        "agentId": agent_id
                    }, agent_id)
                    
                    # Send a few test messages of different types
                    test_messages = [
                        {
                            "type": "terminal_command",
                            "command": "echo 'Server test command'",
                            "output": "Server test command output",
                            "agentId": agent_id
                        },
                        {
                            "type": "browser_state",
                            "data": '{"url": "https://test-server.com", "title": "Test Server Page"}',
                            "agentId": agent_id
                        },
                        {
                            "type": "agent_progress",
                            "data": {
                                "step": "server_test",
                                "progress": 75,
                                "steps_completed": [{"name": "Server Test Step", "description": "Test step from server"}],
                                "current_focus": "Testing WebSocket messages",
                                "output_files": []
                            },
                            "agentId": agent_id
                        }
                    ]
                    
                    # Send each test message
                    for msg in test_messages:
                        await manager.send_message(msg, agent_id)
                        await asyncio.sleep(0.5)  # Small delay between messages
                else:
                    logger.info(f"Unhandled message type: {message_data.get('type')} (ignored)")
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(agent_id)
    except Exception as e:
        logger.error(f"WebSocket error for agent {agent_id}: {e}")
        manager.disconnect(agent_id)

@app.get("/")
async def read_root():
    return {"message": "OpenManus Integration Service is running", "openmanus_available": OPENMANUS_AVAILABLE}

@app.get("/debug/send-test-message/{agent_id}")
async def send_test_message(agent_id: str):
    """Send a test message to client for debugging."""
    logger.info(f"Received request to send test message to agent {agent_id}")
    
    if agent_id in manager.active_connections:
        # Send a terminal command as test
        test_message = {
            'type': 'terminal_command',
            'command': 'echo "Test Message from Server"',
            'output': 'This is a test message from the server.',
            'agentId': agent_id
        }
        
        # Send a browser state update as test
        browser_message = {
            'type': 'browser_state',
            'data': '{"url": "https://test.com", "title": "Test Page"}',
            'agentId': agent_id
        }
        
        # Send progress update as test
        progress_message = {
            'type': 'agent_progress',
            'data': {
                'step': 'test_step',
                'progress': 50,
                'steps_completed': [{'name': 'Test Step', 'description': 'This is a test step', 'timestamp': '2023-04-08T12:34:56'}],
                'current_focus': 'Testing the WebSocket connection',
                'output_files': [{'name': 'test.txt', 'type': 'txt', 'timestamp': '2023-04-08T12:34:56'}]
            },
            'agentId': agent_id
        }
        
        success1 = await manager.send_message(test_message, agent_id)
        success2 = await manager.send_message(browser_message, agent_id)
        success3 = await manager.send_message(progress_message, agent_id)
        
        return {
            "status": "messages_sent" if success1 and success2 and success3 else "some_failed",
            "terminal_command_sent": success1,
            "browser_state_sent": success2,
            "progress_sent": success3
        }
    else:
        available_connections = list(manager.active_connections.keys())
        return {
            "status": "no_connection", 
            "message": f"No WebSocket connection for agent {agent_id}",
            "available_connections": available_connections
        }

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

@app.get("/api/workspace/files")
async def list_workspace_files():
    """API endpoint to list files in the workspace."""
    files = await directory_listing()
    return {"files": files}

def create_config_toml_from_env():
    # ... (initial checks) ...
    logger.info("Generating OpenManus config.toml from environment variables...")
    config_dir = Path(__file__).parent / "OpenManus" / "config"
    config_path = config_dir / "config.toml"
    # ... (mkdir) ...

    # Base structure, prioritizing Anthropic
    config_data = {
        "llm": {
            "api_type": "anthropic",
            "api_key": os.getenv("ANTHROPIC_API_KEY", "key-not-set"),
            "model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620"),
            "max_tokens": 4096,
            "temperature": 0.0,
            "base_url": "https://api.anthropic.com/v1/", # Use documented Anthropic base URL
            "api_version": None,
            "vision": {
                 "api_key": os.getenv("ANTHROPIC_API_KEY", "key-not-set"),
                 "model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620"),
                 "api_type": "anthropic",
                 "base_url": "https://api.anthropic.com/v1/", # Use documented Anthropic base URL
                 "api_version": None,
            }
        },
        "browser_config": { "headless": True, "disable_security": True },
        "search_config": { "engine": "DuckDuckGo", "fallback_engines": ["Baidu", "Bing"] },
        "sandbox": { "use_sandbox": False, "network_enabled": True }
    }

    # Log if API key is missing
    if config_data["llm"]["api_key"] == "key-not-set":
         logger.warning("ANTHROPIC_API_KEY not found in environment. LLM will fail.")

    # Write the config file
    try:
        with open(config_path, "wb") as f:
            tomli_w.dump(config_data, f)
        logger.info(f"Successfully wrote config.toml to {config_path}")
    except Exception as e:
        logger.error(f"Failed to write config.toml: {e}", exc_info=True)

def configure_openmanus_from_env():
    """Reads environment variables and configures the OpenManus config object based on the selected provider.
    """
    provider = os.getenv("OPENMANUS_LLM_PROVIDER", "anthropic").lower()
    logging.info(f"Configuring OpenManus using LLM Provider: {provider}")

    # Ensure nested structures exist (safer than assuming)
    if not hasattr(config, 'llm') or config.llm is None: config.llm = {"default": {}}
    elif 'default' not in config.llm: config.llm['default'] = {}
    if not hasattr(config, 'vision') or config.vision is None: config.vision = {"default": {}}
    elif 'default' not in config.vision: config.vision['default'] = {}

    api_key = None
    base_url = None
    model_name = None
    api_type = provider # Default api_type to provider name

    if provider == "deepseek":
        api_key = os.getenv("DEEPSEEK_API_KEY")
        base_url = os.getenv("DEEPSEEK_BASE_URL")
        model_name = os.getenv("DEEPSEEK_MODEL_NAME")
        api_type = "openai" # Use openai type for compatibility
    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        model_name = os.getenv("ANTHROPIC_MODEL_NAME")
        # base_url not typically used by anthropic client in llm.py
    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL")
        model_name = os.getenv("OPENAI_MODEL_NAME")
    else:
        logging.error(f"Unsupported OPENMANUS_LLM_PROVIDER: {provider}. Falling back to Anthropic defaults.")
        # Fallback to Anthropic if provider is unknown
        api_key = os.getenv("ANTHROPIC_API_KEY")
        model_name = os.getenv("ANTHROPIC_MODEL_NAME")
        api_type = "anthropic" 

    # Configure LLM
    config.llm['default']['api_key'] = api_key
    config.llm['default']['api_type'] = api_type
    config.llm['default']['base_url'] = base_url
    config.llm['default']['model'] = model_name

    # Configure Vision Model (use same provider logic, allow overrides)
    # TODO: Refine vision model configuration if it needs separate provider logic
    # For now, assume vision uses the same provider and potentially model
    vision_api_key = os.getenv("VISION_API_KEY", api_key) # Fallback to main key
    vision_model_name = os.getenv("VISION_MODEL_NAME", model_name) # Fallback to main model
    vision_api_type = os.getenv("VISION_API_TYPE", api_type) # Fallback to main type
    vision_base_url = os.getenv("VISION_API_BASE", base_url) # Fallback to main base_url
    
    config.vision['default']['api_key'] = vision_api_key
    config.vision['default']['api_type'] = vision_api_type
    config.vision['default']['base_url'] = vision_base_url
    config.vision['default']['model'] = vision_model_name

    # Corrected f-strings for logging (alternative approach)
    llm_log_msg = (
        f"LLM Config (Provider: {provider}): "
        f"api_type={config.llm['default'].get('api_type')}, "
        f"model={config.llm['default'].get('model')}, "
        f"key_set={bool(config.llm['default'].get('api_key'))}, "
        f"base_url={config.llm['default'].get('base_url')}"
    )
    logging.info(llm_log_msg)

    vision_log_msg = (
        f"Vision Config: "
        f"api_type={config.vision['default'].get('api_type')}, "
        f"model={config.vision['default'].get('model')}, "
        f"key_set={bool(config.vision['default'].get('api_key'))}, "
        f"base_url={config.vision['default'].get('base_url')}"
    )
    logging.info(vision_log_msg)

    logging.info(f"Using default workspace root from OpenManus config: {config.workspace_root}")

@app.get("/debug/active-connections")
async def get_active_connections():
    """Return a list of active WebSocket connections."""
    connections = list(manager.active_connections.keys())
    return {
        "active_connections": connections,
        "count": len(connections)
    }

logger.info("FastAPI App configured.") 