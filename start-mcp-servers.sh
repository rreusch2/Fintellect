#!/bin/bash
# Start all MCP servers in separate terminals

# Load environment variables
source .env

# Create log directory
mkdir -p logs/mcp-servers

echo "Starting MCP servers..."

# --- REMOVED FAILED SERVER STARTUPS (Yahoo, Deep Research, Google News) ---
# --- REMOVED BRAVE SEARCH STARTUP (defaults to stdio, not usable by backend HTTP client) ---

echo "No background MCP servers configured to start via HTTP in this script."
echo "Client-side tools (like Cursor) may start servers via stdio based on their own config."

echo "MCP server startup attempts complete."