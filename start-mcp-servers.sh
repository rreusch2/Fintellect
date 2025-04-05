#!/bin/bash
# Start all MCP servers in separate terminals

# Load environment variables
source .env

# Create log directory
mkdir -p logs/mcp-servers

echo "Starting MCP servers..."

# Start Yahoo Finance MCP (port 8001)
cd server/services/ai/mcp-servers/yfinance-mcp
npm install > ../../../../../logs/mcp-servers/yfinance-install.log
PORT=8001 npm start > ../../../../../logs/mcp-servers/yfinance.log 2>&1 &
echo "Started Yahoo Finance MCP on port 8001"

# Start Exa MCP (port 8002)
cd ../exa-mcp-server
npm install > ../../../../../logs/mcp-servers/exa-install.log
EXA_API_KEY=$EXA_API_KEY PORT=8002 npm start > ../../../../../logs/mcp-servers/exa.log 2>&1 &
echo "Started Exa Search MCP on port 8002"

# Start Deep Research MCP (port 8003)
cd ../mcp-server-deep-research
npm install > ../../../../../logs/mcp-servers/deep-research-install.log
OPENAI_API_KEY=$OPENAI_API_KEY PORT=8003 npm start > ../../../../../logs/mcp-servers/deep-research.log 2>&1 &
echo "Started Deep Research MCP on port 8003"

# Start Google News MCP (port 8004)
cd ../server-google-news
npm install > ../../../../../logs/mcp-servers/google-news-install.log
SERPAPI_KEY=$SERPAPI_KEY PORT=8004 npm start > ../../../../../logs/mcp-servers/google-news.log 2>&1 &
echo "Started Google News MCP on port 8004"

echo "All MCP servers started. Check logs in logs/mcp-servers/ directory"
cd ../../../../../