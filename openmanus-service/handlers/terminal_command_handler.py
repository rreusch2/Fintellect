import json
import logging
import re

logger = logging.getLogger(__name__)

class TerminalCommandHandler:
    """Handler for detecting and processing terminal commands from OpenManus messages."""
    
    def __init__(self, connection_manager):
        """Initialize with the WebSocket connection manager."""
        self.connection_manager = connection_manager
        self.last_command = {}  # Store last command per agent_id
        
    async def process_messages(self, agent_id: str, messages: list):
        """Process messages to extract terminal commands and their outputs."""
        logger.info(f"[TerminalCommandHandler] Processing {len(messages)} messages for agent {agent_id}")
        terminal_commands_found = 0
        
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
                             'python' in content_obj['observation'] or
                             'curl' in content_obj['observation'] or
                             'wget' in content_obj['observation'] or
                             'ls' in content_obj['observation'])):
                            
                            command = self.extract_command(content_obj)
                            output = self.extract_output(content_obj)
                            
                            # Only send if we have a command
                            if command:
                                terminal_commands_found += 1
                                logger.info(f"[{agent_id}] Extracted terminal command: {command}")
                                await self.connection_manager.send_message({
                                    'type': 'terminal_command',
                                    'command': command,
                                    'output': output,
                                    'agentId': agent_id
                                }, agent_id)
                    except Exception as e:
                        logger.debug(f"Error processing potential terminal command: {str(e)}")
                        
        logger.info(f"[TerminalCommandHandler] Completed processing for agent {agent_id}. Found {terminal_commands_found} terminal commands.")
    
    def extract_command(self, content_obj):
        """Extract the command from content."""
        # Simple heuristic to extract the command from a terminal output
        observation = content_obj.get('observation', '')
        if 'ubuntu@sandbox' in observation:
            # Find the line with the command
            for line in observation.split('\n'):
                if 'ubuntu@sandbox' in line and '$' in line:
                    cmd_parts = line.split('$', 1)
                    if len(cmd_parts) > 1:
                        cmd = cmd_parts[1].strip()
                        if cmd:
                            return cmd
        
        # Try to extract from the input
        input_text = content_obj.get('input', {}).get('text', '')
        if input_text:
            # Try to find bash commands
            bash_pattern = r'```bash\s*(.*?)\s*```'
            bash_match = re.search(bash_pattern, input_text, re.DOTALL)
            if bash_match:
                return bash_match.group(1).strip()
                
            # Look for shell commands that start with common patterns
            shell_pattern = r'(cd |ls |mkdir |python |grep |cat |find |wget |curl |git )'
            shell_match = re.search(shell_pattern, input_text)
            if shell_match:
                # Extract the line with the command
                command_line_pattern = r'(' + shell_pattern + r'.*?)(\n|$)'
                command_match = re.search(command_line_pattern, input_text)
                if command_match:
                    return command_match.group(1).strip()
        
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