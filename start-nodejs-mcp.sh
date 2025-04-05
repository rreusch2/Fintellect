#!/bin/bash
# Simplified MCP server startup focusing on Node.js servers

# Load environment variables
source .env
mkdir -p logs/mcp-servers

echo "Starting Financial Research MCP servers..."

# 1. Exa MCP (Node.js) - Port 8002
cd server/services/ai/mcp-servers/exa-mcp-server
echo "Setting up Exa Search MCP (Node.js)..."
npm install > ../../../../../logs/mcp-servers/exa-install.log 2>&1
# Start with HTTP server mode instead of stdio
EXA_API_KEY=$EXA_API_KEY node ./build/index.js --port 8002 --http > ../../../../../logs/mcp-servers/exa.log 2>&1 &
echo "Started Exa MCP on port 8002"

# 2. Google News MCP (Node.js) - Port 8004
cd ../server-google-news
echo "Setting up Google News MCP (Node.js)..."
npm install > ../../../../../logs/mcp-servers/google-news-install.log 2>&1
# Make sure SERP_API_KEY is properly set
export SERP_API_KEY=$SERPAPI_KEY
PORT=8004 SERP_API_KEY=$SERPAPI_KEY node dist/index.js > ../../../../../logs/mcp-servers/google-news.log 2>&1 &
echo "Started Google News MCP on port 8004"

echo "Node.js MCP servers started. Check logs in logs/mcp-servers/ directory"
cd ../../../../../

echo "Note: Python-based servers (Yahoo Finance and Deep Research) require additional setup."