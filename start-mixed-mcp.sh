#!/bin/bash
# Custom MCP server startup for mixed Python/Node repositories

# Load environment variables
source .env
mkdir -p logs/mcp-servers

echo "Starting Financial Research MCP servers..."

# 1. Yahoo Finance MCP (Python) - Port 8001
cd server/services/ai/mcp-servers/yfinance-mcp
echo "Setting up Yahoo Finance MCP (Python)..."
# Create Python virtual environment if needed
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -e . > ../../../../../logs/mcp-servers/yfinance-install.log 2>&1
# Start the server
PORT=8001 python -m src.app > ../../../../../logs/mcp-servers/yfinance.log 2>&1 &
echo "Started Yahoo Finance MCP on port 8001"
deactivate

# 2. Exa MCP (Node.js) - Port 8002
cd ../exa-mcp-server
echo "Setting up Exa Search MCP (Node.js)..."
npm install > ../../../../../logs/mcp-servers/exa-install.log 2>&1
# The binary path is specified in package.json
PORT=8002 EXA_API_KEY=$EXA_API_KEY node ./build/index.js > ../../../../../logs/mcp-servers/exa.log 2>&1 &
echo "Started Exa MCP on port 8002"

# 3. Deep Research MCP (Python) - Port 8003
cd ../mcp-server-deep-research
echo "Setting up Deep Research MCP (Python)..."
# Create Python virtual environment if needed
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -e . > ../../../../../logs/mcp-servers/deep-research-install.log 2>&1
# Start the server
PORT=8003 OPENAI_API_KEY=$OPENAI_API_KEY python -m src.main > ../../../../../logs/mcp-servers/deep-research.log 2>&1 &
echo "Started Deep Research MCP on port 8003"
deactivate

# 4. Google News MCP (Node.js) - Port 8004
cd ../server-google-news
echo "Setting up Google News MCP (Node.js)..."
npm install > ../../../../../logs/mcp-servers/google-news-install.log 2>&1
# This one has a proper start script
PORT=8004 SERP_API_KEY=$SERPAPI_KEY npm start > ../../../../../logs/mcp-servers/google-news.log 2>&1 &
echo "Started Google News MCP on port 8004"

echo "All Financial Research MCP servers started. Check logs in logs/mcp-servers/ directory"
cd ../../../../../