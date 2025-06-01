# 🔍 Agent File Inspection Guide

This guide provides multiple methods to check what files the agent is creating and their content within the Docker setup.

## 📋 Quick Reference

### Method 1: Browser Developer Tools (Easiest)
1. Open Browser DevTools (F12) → Network tab
2. Trigger agent actions in your conversation
3. Look for API calls to:
   - `GET /sandboxes/{sandbox_id}/files?path=...` (file listing)
   - `GET /sandboxes/{sandbox_id}/files/content?path=...` (file content)
4. Inspect the responses to see files and content

### Method 2: Frontend File Browser (Recommended)
- Click the **"Files"** button in the Analyst page header
- Browse the `/workspace` directory and subdirectories
- View file content directly in the browser
- Download files as needed

### Method 3: Command Line Scripts

#### Quick File Check
```bash
./quick_file_check.sh
```
This script automatically finds sandbox containers and shows:
- Workspace directory contents
- All files (recursive listing)
- Recent .md files with preview
- Research/scrape directories

#### Full Docker Inspection
```bash
./inspect_docker_files.sh
```
More comprehensive inspection including:
- All running containers
- Multiple workspace path checks
- Recent files (last 10 minutes)
- File type filtering

### Method 4: Direct API Calls

First, get your sandbox ID from the browser network tab, then:

```bash
# Replace with your actual sandbox ID
SANDBOX_ID="your-sandbox-id-here"

# List files in workspace root
curl "http://localhost:8000/sandboxes/${SANDBOX_ID}/files?path=/workspace" \
  -H "Cookie: your-session-cookie"

# List files in research directory
curl "http://localhost:8000/sandboxes/${SANDBOX_ID}/files?path=/workspace/research" \
  -H "Cookie: your-session-cookie"

# Read a specific file
curl "http://localhost:8000/sandboxes/${SANDBOX_ID}/files/content?path=/workspace/Research_Results.md" \
  -H "Cookie: your-session-cookie"
```

### Method 5: Direct Docker Container Access

```bash
# List all running containers
docker ps

# Find your sandbox container (usually has 'sandbox' in name or is Node.js based)
CONTAINER_ID="your-container-id"

# Browse workspace directory
docker exec $CONTAINER_ID ls -la /workspace

# Find all files in workspace
docker exec $CONTAINER_ID find /workspace -type f

# View a specific file
docker exec $CONTAINER_ID cat /workspace/Research_Results.md

# Search for files containing specific text
docker exec $CONTAINER_ID grep -r "market conditions" /workspace

# Get an interactive shell
docker exec -it $CONTAINER_ID /bin/bash
```

## 📁 Common File Locations

The agent typically creates files in these directories:

- `/workspace/` - Main workspace directory
- `/workspace/research/` - Research files and reports
- `/workspace/scrape/` - Web scraping results
- `/tmp/workspace/` - Alternative workspace location

## 📄 Common File Types

- `Research_Results.md` - Main research reports
- `*.json` - Scraped web content and structured data
- `*.txt` - Text-based research notes
- `todo_list.md` - Agent's task lists
- Timestamped files like `20250131_143022_example.json`

## 🔧 Troubleshooting

### No Files Found?
1. Check if the agent has actually run tools (look in Computer sidebar)
2. Verify the conversation has tool calls that create files
3. Check alternative workspace paths: `/tmp/workspace`, `/app/workspace`

### Container Not Found?
1. Run `docker ps` to see all running containers
2. Look for containers with 'sandbox', 'node', or recent creation times
3. Check `docker ps -a` to see stopped containers

### Permission Denied?
1. Try with `sudo` if needed
2. Ensure Docker is running and accessible
3. Check if you're in the docker group: `groups $USER`

### File Content Issues?
1. Check file encoding: `docker exec CONTAINER_ID file /path/to/file`
2. Try viewing with `head` or `tail` for large files
3. Check if file is binary: `docker exec CONTAINER_ID file /path/to/file`

## 🐛 Debugging Agent File Creation

### Check Tool Call Results
1. Open Computer sidebar in the UI
2. Look at the "Files" tab to see extracted workspace files
3. Check tool call results for file creation confirmations

### Monitor Real-Time File Creation
```bash
# Watch workspace directory for changes
docker exec CONTAINER_ID watch -n 1 'find /workspace -type f -ls'

# Monitor file creation in real-time
docker exec CONTAINER_ID inotifywait -m -r -e create /workspace
```

### Verify Placeholder Content Detection
Check browser console logs for:
- `[isPlaceholderContent]` messages
- File skipping notifications
- Content analysis results

## 🔗 API Endpoints Reference

All endpoints require authentication and proper sandbox access:

- `GET /sandboxes/{sandbox_id}/files?path={path}` - List files
- `GET /sandboxes/{sandbox_id}/files/content?path={path}` - Read file
- `POST /sandboxes/{sandbox_id}/files` - Create file (with form data)

## 📝 Example Workflows

### 1. After Agent Research Session
```bash
# Run quick check
./quick_file_check.sh

# Look for research files
docker exec CONTAINER_ID find /workspace -name "*research*" -o -name "*Results*"

# View the main research file
docker exec CONTAINER_ID cat /workspace/Research_Results.md
```

### 2. Debugging Placeholder Content
```bash
# Check all .md files for content
docker exec CONTAINER_ID find /workspace -name "*.md" -exec echo "=== {} ===" \; -exec cat {} \;

# Look for files with minimal content
docker exec CONTAINER_ID find /workspace -type f -size -100c
```

### 3. Download All Agent Files
```bash
# Create local backup directory
mkdir -p ./agent_files_backup

# Copy all files from container
docker cp CONTAINER_ID:/workspace ./agent_files_backup/
```

---

**Need Help?** Check the browser console logs and network tab for additional debugging information.