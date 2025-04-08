import os
import asyncio
from pathlib import Path
import websockets
from websockets.server import serve, WebSocketServerProtocol
import json
import uuid

# Assuming OpenManus modules are importable (adjust paths if needed)
# These might be relative imports depending on your final structure
from handlers.terminal_command_handler import TerminalCommandHandler
from handlers.workspace_monitor import WorkspaceMonitor
from handlers.task_progress_tracker import TaskProgressTracker
from OpenManus.app.config import config # Import the global config object
from OpenManus.app.agent.manus import Manus
from OpenManus.app.tool import ToolCollection, WebSearch, BrowserUseTool, PythonExecuteTool, EditorTool

# Assuming logger setup exists
from loguru import logger # Example, use your actual logger setup

# --- Configuration Loading ---
# Ensure config is loaded or relevant values are set from environment
# This might happen at the top level or within functions as needed.
# The provided code snippet doesn't show the full original config loading,
# so we'll assume `config` is populated correctly elsewhere or via the function below.

# Function to configure OpenManus global config from environment variables
def configure_openmanus_from_env():
    """Reads environment variables and updates the global OpenManus config."""
    logger.info("Configuring OpenManus from environment variables...")

    # LLM Config (Prioritizing Anthropic as per original logic)
    default_llm = config.llm.get('default', {}) # Get existing default or empty dict
    default_llm['api_type'] = os.getenv("LLM_API_TYPE", "anthropic") # Default to anthropic if not set
    default_llm['api_key'] = os.getenv("ANTHROPIC_API_KEY") if default_llm['api_type'] == 'anthropic' else os.getenv("OPENAI_API_KEY", "key-not-set")
    default_llm['model'] = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620") if default_llm['api_type'] == 'anthropic' else os.getenv("OPENAI_MODEL", "gpt-4o")
    default_llm['base_url'] = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1/") if default_llm['api_type'] == 'anthropic' else os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1/")
    default_llm['api_version'] = os.getenv("AZURE_API_VERSION") if default_llm['api_type'] == 'azure' else None # Specific to Azure

    # Vision Config (Assuming it mirrors LLM for now)
    vision_llm = default_llm.get('vision', {})
    vision_llm['api_type'] = default_llm['api_type'] # Mirror LLM settings
    vision_llm['api_key'] = default_llm['api_key']
    vision_llm['model'] = default_llm['model'] # Or use a specific vision model env var
    vision_llm['base_url'] = default_llm['base_url']
    vision_llm['api_version'] = default_llm['api_version']
    default_llm['vision'] = vision_llm # Assign back

    # Update the global config
    config.llm['default'] = default_llm

    # Search Config
    search_config = config.search_config or {} # Ensure search_config exists
    search_config['engine'] = os.getenv("SEARCH_ENGINE", "DuckDuckGo")
    search_config['api_key'] = os.getenv("SERP_API_KEY") or os.getenv("BRAVE_API_KEY") or os.getenv("EXA_API_KEY") # Get first available key
    config.search_config = search_config

    # Browser Config (Keep as is or add env vars if needed)
    config.browser_config = {"headless": True, "disable_security": True}

    # Sandbox Config (Keep as is or add env vars if needed)
    config.sandbox = {"use_sandbox": False, "network_enabled": True}

    # Workspace Directory (Using the default from OpenManus config object)
    # WORKSPACE_DIR is mapped via docker-compose to the correct internal path
    logger.info(f"OpenManus Workspace Root (from config): {config.workspace_root}")


    if not default_llm['api_key'] or default_llm['api_key'] == "key-not-set":
        logger.warning(f"API Key for {default_llm['api_type']} is not set!")

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocketServerProtocol] = {}

    async def connect(self, websocket: WebSocketServerProtocol, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected.")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected.")

    async def send_personal_message(self, message: dict, websocket: WebSocketServerProtocol):
        """Sends a JSON message to a specific websocket connection."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send message: {e}")

    async def broadcast(self, message: str):
        # Not used in this specific agent setup, but kept for potential future use
        disconnected_clients = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception:
                disconnected_clients.append(client_id)
        for client_id in disconnected_clients:
            self.disconnect(client_id)

manager = ConnectionManager()

# --- Agent Execution Logic ---
async def run_agent_process(agent_id: str, preference: dict, websocket: WebSocketServerProtocol):
    """Runs the Manus agent with the given preference and communicates via WebSocket."""
    agent_instance = None # Initialize agent_instance
    results = [] # Initialize results to an empty list
    try:
        logger.info(f"Starting agent process for {agent_id} with preference topics: {preference.get('topics', 'N/A')}")
        await manager.send_personal_message({"type": "status", "message": "Initializing agent...", "agentId": agent_id}, websocket)

        # Configure OpenManus based on environment variables
        configure_openmanus_from_env() # Ensure config is updated
        logger.info(f"OpenManus configured. Using LLM: {config.llm.get('default', {}).get('model')}")
        logger.info(f"OpenManus workspace: {config.workspace_root}") # Log the path it WILL use

        # --- Agent Initialization ---
        # Ensure necessary tools are imported (inside the function is safer for potential reload scenarios)
        from OpenManus.app.tool import ToolCollection, WebSearch, BrowserUseTool, PythonExecuteTool, EditorTool
        from OpenManus.app.agent.manus import Manus # Make sure Manus is imported

        # Explicitly provide the tools, including WebSearch
        agent_tools = ToolCollection([
            WebSearch(),
            BrowserUseTool(),
            PythonExecuteTool(),
            EditorTool()
        ])
        # Increase max_steps to allow for more complex planning
        agent_instance = Manus(available_tools=agent_tools, max_steps=40) 
        logger.info(f"Manus agent instance created for {agent_id} with tools: {[t.name for t in agent_instance.available_tools.tools]} and max_steps=40")

        await manager.send_personal_message({"type": "status", "message": "Agent initialized. Starting research...", "agentId": agent_id}, websocket)

        # --- Prepare Prompt ---
        # Convert preference details into a natural language prompt
        prompt = (
            f"Perform financial research based on the following preferences:\n"
            f"- Topics: {', '.join(preference.get('topics', []))}\n"
            f"- Keywords: {', '.join(preference.get('keywords', []))}\n"
            f"- Asset Classes: {', '.join(preference.get('assetClasses', []))}\n"
            f"- Specific Tickers: {', '.join(preference.get('specificAssets', {}).get('tickers', []))}\n"
            f"- Data Sources: {', '.join(k for k, v in preference.get('dataSources', {}).items() if v)}\n"
            f"- Analysis Types: {', '.join(k for k, v in preference.get('analysisTypes', {}).items() if v)}\n"
            # f"- Custom Instructions: {preference.get('customInstructions', 'None')}\n\n" # Uncomment if needed
            f"Please provide detailed findings, including data processing steps, generated files (like charts or reports), and a final summary of insights."
        )
        logger.debug(f"Generated prompt for agent {agent_id}: {prompt[:200]}...")

        # --- Run Agent ---
        final_answer_text = await agent_instance.run(prompt)
        logger.info(f"Agent {agent_id} run completed. Final Answer snippet: {str(final_answer_text)[:200]}...")

        # --- Process Results ---
        # Attempt to parse final answer or use it directly
        summary_content = str(final_answer_text) # Default to full output
        title = f"OpenManus Research Summary ({agent_id})"
        # You could add more sophisticated parsing here if the agent
        # is expected to return a structured JSON or specific sections.
        # For now, we'll use a snippet for summary and full text for content.
        summary = summary_content[:500] + ('...' if len(summary_content) > 500 else '')

        results = [{
            "type": "report", 
            "title": title,
            "summary": summary, 
            "content": { "full_output": summary_content }, 
            "sources": [], # TODO: Populate if agent provides sources
            "analysisMetadata": {} # TODO: Populate if agent provides analysis
        }]
        logger.info(f"Agent {agent_id} successfully generated results.")

        # --- List Generated Files --- 
        generated_files = []
        workspace_path_str = str(config.workspace_root) # Get workspace path from config
        if os.path.exists(workspace_path_str):
            try:
                files_in_workspace = os.listdir(workspace_path_str)
                generated_files = [
                    {"name": f, "path": os.path.join(workspace_path_str, f)} 
                    for f in files_in_workspace 
                    if os.path.isfile(os.path.join(workspace_path_str, f))
                ]
                logger.info(f"Found generated files for agent {agent_id}: {[f['name'] for f in generated_files]}")
            except Exception as list_err:
                logger.error(f"Error listing files in workspace {workspace_path_str} for agent {agent_id}: {list_err}")
        else:
            logger.warning(f"Workspace path {workspace_path_str} does not exist for agent {agent_id}.")

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

    except Exception as e:
        final_answer_error = str(e) # Capture error message
        logger.exception(f"Error during agent process for {agent_id}")
        # Send error status message via WebSocket
        try:
            await manager.send_personal_message({
                "type": "error", # Use 'error' type for clarity
                "message": f"Agent process failed: {final_answer_error}",
                "agentId": agent_id
            }, websocket)
        except Exception as ws_err:
             logger.error(f"Failed to send error status over WebSocket for agent {agent_id}: {ws_err}")
        # Structure the results list to contain the error details
        results = [{"type": "report", "title": f"OpenManus Research FAILED ({agent_id})", "summary": f"Agent process failed with error: {final_answer_error}", "content": { "error_details": final_answer_error }, "sources": [], "analysisMetadata": {}}]

    finally:
        logger.info(f"Agent process finishing for {agent_id}.")
        # Attempt to add full history to results if no prior error occurred
        # and results list exists and is not empty
        if agent_instance and 'results' in locals() and results and isinstance(results, list) and len(results) > 0:
             # Check if the first result item is a dict and does NOT contain error details
             if isinstance(results[0], dict) and not results[0].get('content', {}).get('error_details'):
                 try:
                    # Use to_dict_list() based on schema.py
                    history_list = agent_instance.memory.to_dict_list()
                    # Add history under a specific key, e.g., 'full_history', to the 'content' dict
                    if 'content' not in results[0]:
                         results[0]['content'] = {} # Ensure content dict exists
                    results[0]['content']['full_history'] = history_list
                    logger.info(f"Successfully added agent history to results for {agent_id}.")
                 except AttributeError as mem_err:
                     logger.error(f"Error accessing agent memory history for {agent_id}: {mem_err}")
                 except Exception as hist_err:
                     logger.error(f"Error processing agent history for {agent_id}: {hist_err}")
             else:
                  logger.info(f"Skipping history addition for agent {agent_id} due to error in results or unexpected format.")
        else:
             logger.info(f"Skipping history addition for agent {agent_id}: agent_instance missing or results list problematic.")

        # Send the final results (or error result) via WebSocket
        final_payload = {
            "type": "final_result",
            "results": results, # Contains either success data + history or error info
            "files": generated_files, # Use the list populated above
            "agentId": agent_id
        }
        # Ensure websocket is still valid before sending
        if websocket and not websocket.closed: # Check if websocket is explicitly closed
             try:
                await manager.send_personal_message(final_payload, websocket)
                logger.info(f"Sent final_result payload for agent {agent_id}.")
             except Exception as send_err:
                 logger.error(f"Error sending final_result payload for agent {agent_id}: {send_err}")
        else:
             logger.warning(f"WebSocket closed or invalid before sending final result for agent {agent_id}.")


        # Clean up agent resources
        if agent_instance:
             try:
                 await agent_instance.cleanup()
                 logger.info(f"Agent {agent_id} resource cleanup called.")
             except Exception as cleanup_err:
                 logger.error(f"Error during agent cleanup for {agent_id}: {cleanup_err}")
        logger.info(f"Agent {agent_id} processing complete.")


# --- WebSocket Server Logic ---
async def handler(websocket: WebSocketServerProtocol):
    """Handles incoming WebSocket connections and messages."""
    client_id = str(uuid.uuid4()) # Generate a unique ID for the client
    await manager.connect(websocket, client_id)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Received message from {client_id}: {data.get('type')}")

                if data.get("type") == "start_research":
                    preference = data.get("preference")
                    if preference:
                        agent_id = str(uuid.uuid4()) # Unique ID for this agent run
                        logger.info(f"Received start_research request. Starting agent {agent_id} in background.")
                        # Send initial ack back to client
                        await manager.send_personal_message({
                            "type": "status",
                            "message": "Received research request. Initializing agent...",
                            "agentId": agent_id # Include agentId in ack
                        }, websocket)
                        # Run the agent process in the background
                        asyncio.create_task(run_agent_process(agent_id, preference, websocket))
                    else:
                        await manager.send_personal_message({"type": "error", "message": "Missing preference data"}, websocket)

                # Add handlers for other message types if needed

            except json.JSONDecodeError:
                logger.error(f"Received invalid JSON from {client_id}")
                await manager.send_personal_message({"type": "error", "message": "Invalid JSON format"}, websocket)
            except Exception as e:
                 logger.exception(f"Error processing message from {client_id}: {e}")
                 await manager.send_personal_message({"type": "error", "message": f"Internal server error: {str(e)}"}, websocket)

    except websockets.exceptions.ConnectionClosedOK:
        logger.info(f"Connection closed normally for {client_id}.")
    except websockets.exceptions.ConnectionClosedError as e:
        logger.warning(f"Connection closed with error for {client_id}: {e}")
    finally:
        manager.disconnect(client_id)

async def main():
    """Starts the WebSocket server."""
    # Apply initial configuration from environment variables on startup
    configure_openmanus_from_env()
    host = "0.0.0.0"
    port = 8000
    logger.info(f"Starting WebSocket server on {host}:{port}")
    async with serve(handler, host, port):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())

# Initialize handlers
terminal_handler = TerminalCommandHandler(manager)
workspace_monitor = WorkspaceMonitor(manager, workspace_path="/app/OpenManus/workspace")
task_tracker = TaskProgressTracker(manager)
