#!/bin/bash

# Quick script to check files in the Docker containers

echo "🔍 Quick File Check for Agent-Created Files"
echo "=============================================="

# Function to check a specific container
check_container() {
    local container_id=$1
    local container_name=$(docker inspect --format='{{.Name}}' $container_id | sed 's/^\/*//')
    
    echo ""
    echo "🐳 Container: $container_name ($container_id)"
    echo "---"
    
    # Check common workspace locations
    local workspace_found=false
    
    for workspace_path in "/workspace" "/tmp/workspace" "/app/workspace" "/home/workspace"; do
        if docker exec $container_id test -d "$workspace_path" 2>/dev/null; then
            echo "📁 Found workspace at: $workspace_path"
            workspace_found=true
            
            echo "   📋 Directory contents:"
            docker exec $container_id ls -la "$workspace_path" 2>/dev/null | sed 's/^/      /'
            
            echo "   📄 All files (recursive):"
            docker exec $container_id find "$workspace_path" -type f 2>/dev/null | sed 's/^/      /'
            
            echo "   📝 Recent .md files:"
            docker exec $container_id find "$workspace_path" -name "*.md" -type f -exec echo "      {}" \; -exec head -5 {} \; -exec echo "      ..." \; 2>/dev/null
            
            echo "   🔍 Research/scrape directories:"
            docker exec $container_id find "$workspace_path" -type d \( -name "*research*" -o -name "*scrape*" \) 2>/dev/null | sed 's/^/      /'
            
            break
        fi
    done
    
    if [ "$workspace_found" = false ]; then
        echo "   ❌ No workspace directory found"
        echo "   🔍 Searching for any .md files:"
        docker exec $container_id find / -name "*.md" -type f 2>/dev/null | head -10 | sed 's/^/      /'
    fi
}

# Find containers that might be sandboxes
echo "🔎 Looking for potential sandbox containers..."

# Check containers with 'sandbox' in name first
SANDBOX_CONTAINERS=$(docker ps --filter "name=sandbox" --format "{{.ID}}" 2>/dev/null)

if [ -z "$SANDBOX_CONTAINERS" ]; then
    echo "   No 'sandbox' containers found, checking Node.js containers..."
    SANDBOX_CONTAINERS=$(docker ps --filter "ancestor=node" --format "{{.ID}}" 2>/dev/null)
fi

if [ -z "$SANDBOX_CONTAINERS" ]; then
    echo "   No Node.js containers found, checking all running containers..."
    SANDBOX_CONTAINERS=$(docker ps --format "{{.ID}}" 2>/dev/null)
fi

if [ -z "$SANDBOX_CONTAINERS" ]; then
    echo "❌ No running containers found!"
    echo ""
    echo "📋 All containers (including stopped):"
    docker ps -a
    exit 1
fi

# Check each container
for container_id in $SANDBOX_CONTAINERS; do
    check_container "$container_id"
done

echo ""
echo "💡 To view a specific file:"
echo "   docker exec CONTAINER_ID cat /path/to/file"
echo ""
echo "💡 To search for files containing specific text:"
echo "   docker exec CONTAINER_ID grep -r 'search term' /workspace"
echo ""
echo "💡 To get an interactive shell:"
echo "   docker exec -it CONTAINER_ID /bin/bash"