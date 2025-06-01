#!/bin/bash

# Script to inspect files created by the agent in Docker containers

echo "🔍 Inspecting Docker containers and files..."

# List all running containers
echo "📋 Running containers:"
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}"

echo ""
echo "🔎 Looking for sandbox containers..."

# Find sandbox containers (they usually have 'sandbox' in the name or are based on certain images)
SANDBOX_CONTAINERS=$(docker ps --filter "name=sandbox" --format "{{.ID}}" 2>/dev/null)

if [ -z "$SANDBOX_CONTAINERS" ]; then
    echo "No containers with 'sandbox' in name found. Checking for Node.js containers..."
    SANDBOX_CONTAINERS=$(docker ps --filter "ancestor=node" --format "{{.ID}}" 2>/dev/null)
fi

if [ -z "$SANDBOX_CONTAINERS" ]; then
    echo "❌ No sandbox containers found. Listing all containers:"
    docker ps -a
    exit 1
fi

for CONTAINER_ID in $SANDBOX_CONTAINERS; do
    echo ""
    echo "🐳 Inspecting container: $CONTAINER_ID"
    
    # Get container info
    CONTAINER_NAME=$(docker inspect --format='{{.Name}}' $CONTAINER_ID | sed 's/^\/*//')
    echo "   Name: $CONTAINER_NAME"
    
    # Check for workspace directory
    echo "   📁 Checking for workspace directories..."
    docker exec $CONTAINER_ID find / -name "workspace" -type d 2>/dev/null | head -10
    
    # List workspace contents if it exists
    WORKSPACE_PATHS="/workspace /tmp/workspace /app/workspace /home/workspace"
    
    for WORKSPACE_PATH in $WORKSPACE_PATHS; do
        if docker exec $CONTAINER_ID test -d "$WORKSPACE_PATH" 2>/dev/null; then
            echo ""
            echo "   📂 Found workspace at: $WORKSPACE_PATH"
            echo "   📋 Contents:"
            docker exec $CONTAINER_ID ls -la "$WORKSPACE_PATH" 2>/dev/null || echo "      (empty or no access)"
            
            # Look for common file types
            echo "   📄 Looking for .md, .txt, .json files:"
            docker exec $CONTAINER_ID find "$WORKSPACE_PATH" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.json" \) 2>/dev/null | head -20
            
            # Show recent files
            echo "   🕒 Recent files (last 10 minutes):"
            docker exec $CONTAINER_ID find "$WORKSPACE_PATH" -type f -mmin -10 2>/dev/null | head -10
        fi
    done
    
    echo ""
    echo "   🔍 Searching for research/scrape directories..."
    docker exec $CONTAINER_ID find / -name "*research*" -o -name "*scrape*" -type d 2>/dev/null | head -10
    
    echo "   ═══════════════════════════════════════════════"
done

echo ""
echo "💡 To inspect a specific file, run:"
echo "   docker exec CONTAINER_ID cat /path/to/file"
echo ""
echo "💡 To get an interactive shell in a container:"
echo "   docker exec -it CONTAINER_ID /bin/bash"
echo "   # or"
echo "   docker exec -it CONTAINER_ID /bin/sh"