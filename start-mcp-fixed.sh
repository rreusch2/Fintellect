#!/bin/bash
# Start all financial research MCP servers with proper configuration

# Load environment variables
source .env

# Create log directory
mkdir -p logs/mcp-servers

echo "Starting Financial Research MCP servers..."

# Start Yahoo Finance MCP (port 8001)
cd server/services/ai/mcp-servers/yfinance-mcp
echo "Setting up Yahoo Finance MCP..."
npm install > ../../../../../logs/mcp-servers/yfinance-install.log 2>&1
# Check if index.js or similar exists
if [ -f "index.js" ]; then
  PORT=8001 node index.js > ../../../../../logs/mcp-servers/yfinance.log 2>&1 &
  echo "Started Yahoo Finance MCP on port 8001"
elif [ -f "app.js" ]; then
  PORT=8001 node app.js > ../../../../../logs/mcp-servers/yfinance.log 2>&1 &
  echo "Started Yahoo Finance MCP on port 8001"
elif [ -f "src/index.js" ]; then
  PORT=8001 node src/index.js > ../../../../../logs/mcp-servers/yfinance.log 2>&1 &
  echo "Started Yahoo Finance MCP on port 8001"
else
  echo "Cannot find entry point for Yahoo Finance MCP"
fi

# Start Exa MCP (port 8002)
cd ../exa-mcp-server
echo "Setting up Exa Search MCP..."
npm install > ../../../../../logs/mcp-servers/exa-install.log 2>&1
# Check if index.js or similar exists
if [ -f "index.js" ]; then
  PORT=8002 EXA_API_KEY=$EXA_API_KEY node index.js > ../../../../../logs/mcp-servers/exa.log 2>&1 &
  echo "Started Exa MCP on port 8002"
elif [ -f "app.js" ]; then
  PORT=8002 EXA_API_KEY=$EXA_API_KEY node app.js > ../../../../../logs/mcp-servers/exa.log 2>&1 &
  echo "Started Exa MCP on port 8002"
elif [ -f "src/index.js" ]; then
  PORT=8002 EXA_API_KEY=$EXA_API_KEY node src/index.js > ../../../../../logs/mcp-servers/exa.log 2>&1 &
  echo "Started Exa MCP on port 8002"
else
  echo "Cannot find entry point for Exa MCP"
fi

# Start Deep Research MCP (port 8003)
cd ../mcp-server-deep-research
echo "Setting up Deep Research MCP..."
npm install > ../../../../../logs/mcp-servers/deep-research-install.log 2>&1
# Check if index.js or similar exists
if [ -f "index.js" ]; then
  PORT=8003 OPENAI_API_KEY=$OPENAI_API_KEY node index.js > ../../../../../logs/mcp-servers/deep-research.log 2>&1 &
  echo "Started Deep Research MCP on port 8003"
elif [ -f "app.js" ]; then
  PORT=8003 OPENAI_API_KEY=$OPENAI_API_KEY node app.js > ../../../../../logs/mcp-servers/deep-research.log 2>&1 &
  echo "Started Deep Research MCP on port 8003"
elif [ -f "src/index.js" ]; then
  PORT=8003 OPENAI_API_KEY=$OPENAI_API_KEY node src/index.js > ../../../../../logs/mcp-servers/deep-research.log 2>&1 &
  echo "Started Deep Research MCP on port 8003"
else
  echo "Cannot find entry point for Deep Research MCP"
fi

# Start Google News MCP (port 8004)
cd ../server-google-news
echo "Setting up Google News MCP..."
npm install > ../../../../../logs/mcp-servers/google-news-install.log 2>&1
# Use the proper environment variable name SERP_API_KEY
export SERP_API_KEY=$SERPAPI_KEY
PORT=8004 SERP_API_KEY=$SERPAPI_KEY node dist/index.js > ../../../../../logs/mcp-servers/google-news.log 2>&1 &
echo "Started Google News MCP on port 8004"

echo "All Financial Research MCP servers started. Check logs in logs/mcp-servers/ directory"
cd ../../../../../