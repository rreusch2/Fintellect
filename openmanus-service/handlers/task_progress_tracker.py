import logging
import re
import json
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class TaskProgressTracker:
    """Tracks agent progress and categorizes into meaningful steps."""
    
    def __init__(self, connection_manager):
        """Initialize with the WebSocket connection manager."""
        self.connection_manager = connection_manager
        self.agent_states = {}  # agent_id -> current state info
        
    async def process_messages(self, agent_id: str, messages: list):
        """Process messages to derive task progress."""
        logger.info(f"[TaskProgressTracker] Processing {len(messages)} messages for agent {agent_id}")
        
        if agent_id not in self.agent_states:
            # Initialize state for new agent
            self.agent_states[agent_id] = {
                'step': 'initialization',
                'progress': 0,
                'steps_completed': [],
                'current_focus': 'Starting financial research',
                'output_files': []
            }
            
            # Send initial state
            await self.send_state_update(agent_id)
            logger.info(f"[{agent_id}] Initialized task progress tracking")
        
        # Look for progress indicators in messages
        state_change = False
        
        # Process only the last 5 messages to avoid redundant updates
        # (the latest messages will give the most current state)
        recent_messages = messages[-10:] if len(messages) > 10 else messages
        
        for message in recent_messages:
            if await self.update_state_from_message(agent_id, message):
                state_change = True
                
        if state_change:
            await self.send_state_update(agent_id)
            logger.info(f"[{agent_id}] Task progress updated: {self.agent_states[agent_id]['step']} - {self.agent_states[agent_id]['progress']}%")
        
        logger.info(f"[TaskProgressTracker] Completed processing for agent {agent_id}")
    
    async def update_state_from_message(self, agent_id: str, message: dict):
        """Update agent state based on message content."""
        # Extract content - handle different message types
        content = ''
        if message.get('role') == 'assistant' and message.get('content'):
            content = message['content']
        elif message.get('role') == 'tool' and message.get('content'):
            try:
                if isinstance(message['content'], str):
                    content_obj = json.loads(message['content'])
                    if isinstance(content_obj, dict) and 'observation' in content_obj:
                        content = content_obj['observation']
                    else:
                        content = str(message['content'])
                else:
                    content = str(message['content'])
            except:
                content = str(message['content'])
        else:
            return False
            
        # Don't process if empty content
        if not content:
            return False
            
        state = self.agent_states[agent_id]
        changed = False
        
        # Look for created files first - this happens across all steps
        await self.detect_files(agent_id, content)
        
        # Pattern matching for state transitions
        # Financial research states:
        # 1. initialization -> data_collection 
        # 2. data_collection -> analysis
        # 3. analysis -> report_generation
        # 4. report_generation -> complete
        
        financial_data_patterns = [
            'searching for financial', 'collecting market data', 'gathering financial info',
            'searching for market', 'collecting data', 'retrieving financial data',
            'looking up market trends', 'accessing financial news', 'getting stock information',
            'obtaining financial reports', 'fetching market data', 'gathering stock data',
            'retrieving economic indicators'
        ]
        
        analysis_patterns = [
            'analyzing data', 'processing financial info', 'examining market trends',
            'evaluating financial data', 'reviewing market information', 'studying financial reports',
            'assessing market conditions', 'analyzing stock performance', 'calculating metrics',
            'identifying patterns', 'recognizing trends'
        ]
        
        report_patterns = [
            'generating report', 'creating summary', 'compiling findings',
            'preparing report', 'summarizing analysis', 'creating findings document',
            'generating insights', 'writing summary', 'producing report',
            'documenting results', 'preparing summary'
        ]
        
        completion_patterns = [
            'completed analysis', 'finished research', 'research complete',
            'completed the task', 'finished the report', 'completed report',
            'analysis complete', 'task complete', 'research is complete',
            'search complete'
        ]
        
        # Check for data collection state
        if state['step'] == 'initialization' and any(pattern in content.lower() for pattern in financial_data_patterns):
            state['step'] = 'data_collection'
            state['progress'] = 25
            state['current_focus'] = 'Gathering financial data and market information'
            state['steps_completed'].append({
                'name': 'Initialization complete',
                'description': 'Agent has initialized and started gathering data',
                'timestamp': datetime.now().isoformat()
            })
            changed = True
            
        # Check for analysis state
        elif state['step'] == 'data_collection' and any(pattern in content.lower() for pattern in analysis_patterns):
            state['step'] = 'analysis'
            state['progress'] = 50
            state['current_focus'] = 'Analyzing collected financial information'
            state['steps_completed'].append({
                'name': 'Data collection complete',
                'description': 'Agent has collected necessary market data',
                'timestamp': datetime.now().isoformat()
            })
            changed = True
            
        # Check for report generation state
        elif state['step'] == 'analysis' and any(pattern in content.lower() for pattern in report_patterns):
            state['step'] = 'report_generation'
            state['progress'] = 75
            state['current_focus'] = 'Generating financial insights and reports'
            state['steps_completed'].append({
                'name': 'Analysis complete',
                'description': 'Agent has analyzed collected data',
                'timestamp': datetime.now().isoformat()
            })
            changed = True
            
        # Check for completion state
        elif state['step'] == 'report_generation' and any(pattern in content.lower() for pattern in completion_patterns):
            state['step'] = 'complete'
            state['progress'] = 100
            state['current_focus'] = 'Research complete'
            state['steps_completed'].append({
                'name': 'Report generation complete',
                'description': 'Agent has generated final reports and insights',
                'timestamp': datetime.now().isoformat()
            })
            changed = True
        
        # Fallback for long-running data collection 
        # If we've been in data_collection for a while, move to analysis
        elif state['step'] == 'data_collection' and len(state['steps_completed']) == 1:
            # Check if this message is substantially later in the conversation
            if len(messages) > 20 and messages.index(message) > len(messages) * 0.5:
                state['step'] = 'analysis'
                state['progress'] = 50
                state['current_focus'] = 'Analyzing collected financial information'
                state['steps_completed'].append({
                    'name': 'Data collection complete',
                    'description': 'Agent has collected necessary market data',
                    'timestamp': datetime.now().isoformat()
                })
                changed = True
        
        return changed
    
    async def detect_files(self, agent_id: str, content: str):
        """Detect file creation mentions in content."""
        state = self.agent_states[agent_id]
        changed = False
        
        # Different patterns for created files
        file_patterns = [
            # Created file: filename.ext
            r'Created (?:file|report|output)(?:\s*:)?\s+(\w+\.\w+)',
            # Saved financial_report.txt
            r'Saved\s+(\w+\.\w+)',
            # Generated market_analysis.csv
            r'Generated\s+(\w+\.\w+)',
            # Writing results to: output.json
            r'Writing (?:results|output|data) to(?:\s*:)?\s+(\w+\.\w+)',
            # Creating summary.txt file
            r'Creating\s+(\w+\.\w+) file',
            # Stored data in data.csv
            r'Stored (?:data|results|output) in\s+(\w+\.\w+)'
        ]
        
        for pattern in file_patterns:
            file_matches = re.findall(pattern, content)
            for file_match in file_matches:
                if file_match.lower() not in [f['name'].lower() for f in state['output_files']]:
                    state['output_files'].append({
                        'name': file_match,
                        'type': file_match.split('.')[-1],
                        'timestamp': datetime.now().isoformat()
                    })
                    logger.info(f"[{agent_id}] Detected file creation: {file_match}")
                    changed = True
        
        return changed
    
    async def send_state_update(self, agent_id):
        """Send the current state update via websocket."""
        try:
            state_data = self.agent_states[agent_id]
            logger.info(f"[{agent_id}] Sending progress update: {state_data['step']} ({state_data['progress']}%)")
            await self.connection_manager.send_message({
                'type': 'agent_progress',
                'data': state_data,
                'agentId': agent_id
            }, agent_id)
        except Exception as e:
            logger.error(f"Error sending agent progress update: {e}", exc_info=True)
            
    def add_file_to_tracking(self, agent_id: str, filename: str):
        """Add a file to tracking (called externally when a file is detected by other means)."""
        if agent_id in self.agent_states:
            state = self.agent_states[agent_id]
            if filename not in [f['name'] for f in state['output_files']]:
                state['output_files'].append({
                    'name': filename,
                    'type': filename.split('.')[-1],
                    'timestamp': datetime.now().isoformat()
                })
                asyncio.create_task(self.send_state_update(agent_id))
                return True
        return False 