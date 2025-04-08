import os
import logging
import time
import mimetypes
from pathlib import Path

logger = logging.getLogger(__name__)

class WorkspaceMonitor:
    """Monitor for workspace files created by the OpenManus agent."""
    
    def __init__(self, connection_manager, workspace_path="/app/OpenManus/workspace"):
        """Initialize with the WebSocket connection manager and workspace path."""
        self.connection_manager = connection_manager
        self.workspace_path = workspace_path
        self.known_files = {}  # agent_id -> {filename: last_modified}
        
        # Initialize mimetypes database
        mimetypes.init()
    
    async def scan_workspace(self, agent_id):
        """Scan workspace for new or modified files."""
        logger.info(f"[WorkspaceMonitor] Scanning workspace for agent {agent_id}")
        try:
            if not os.path.exists(self.workspace_path):
                logger.warning(f"Workspace path {self.workspace_path} does not exist")
                return
                
            if agent_id not in self.known_files:
                logger.info(f"Initializing known files tracking for agent {agent_id}")
                self.known_files[agent_id] = {}
                
            current_files = {}
            file_updates = []
            
            # Scan workspace files
            logger.info(f"Scanning files in {self.workspace_path}")
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
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                            
                            # Only include text files, max 10KB
                            if len(content) < 10240 and self.is_text_file(content):
                                file_updates.append({
                                    'name': filename,
                                    'path': file_path,
                                    'content': content[:2048],  # Truncate large content
                                    'content_type': self.guess_content_type(filename)
                                })
                                logger.info(f"[{agent_id}] Detected new/updated text file: {filename}")
                            else:
                                # For non-text files, just add metadata without content
                                file_updates.append({
                                    'name': filename,
                                    'path': file_path,
                                    'content': f"Binary file ({os.path.getsize(file_path)} bytes)",
                                    'content_type': 'binary',
                                    'is_binary': True
                                })
                                logger.info(f"[{agent_id}] Detected binary file: {filename}")
                        except Exception as e:
                            logger.error(f"Error reading file {file_path}: {e}")
            
            # Update known files
            self.known_files[agent_id] = current_files
            
            # Send file updates if any
            if file_updates:
                logger.info(f"[{agent_id}] Sending {len(file_updates)} file updates to client")
                await self.connection_manager.send_message({
                    'type': 'workspace_files',
                    'files': file_updates,
                    'agentId': agent_id
                }, agent_id)
            else:
                logger.info(f"[{agent_id}] No new or updated files to send")
                
        except Exception as e:
            logger.error(f"Error scanning workspace: {e}", exc_info=True)
    
    def is_text_file(self, content):
        """Check if content is likely text by examining a sample."""
        # Check only the first 1000 characters
        sample = content[:1000]
        # Text files should mostly contain ASCII characters (excluding some binary files that have text headers)
        text_chars = len([c for c in sample if 32 <= ord(c) < 127 or c in '\n\r\t'])
        return text_chars / max(1, len(sample)) > 0.7  # If >70% printable, likely text
    
    def guess_content_type(self, filename):
        """Guess content type based on file extension."""
        ext = Path(filename).suffix.lower()
        
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
        
        # Use mimetypes as fallback
        mime_type, _ = mimetypes.guess_type(filename)
        if mime_type:
            if mime_type.startswith('text/'):
                return mime_type.split('/')[1]
            elif mime_type.startswith('application/'):
                return mime_type.split('/')[1]
        
        return 'text' 