#!/bin/bash

echo "🚀 Setting up Fintellect development environment..."

# Update system packages
sudo apt-get update

# Install additional tools
sudo apt-get install -y curl wget git python3 python3-pip

# Set up workspace directory for Docker sandbox
echo "📁 Creating Docker workspace directory..."
sudo mkdir -p /tmp/fintellect-workspace
sudo chmod 777 /tmp/fintellect-workspace

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Set up git configuration (will be overridden by user's GitHub settings)
git config --global init.defaultBranch main

# Create environment file template if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env template..."
    cp .env.example .env 2>/dev/null || echo "# Fintellect Environment Variables
# Copy your actual values here

# Database
DATABASE_URL=your_neon_database_url_here

# Session Secret
SESSION_SECRET=your_session_secret_here

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Alpha Vantage (Optional)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Plaid (if using)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox" > .env
fi

# Pull Python Docker image for sandbox
echo "🐳 Pulling Python Docker image for sandbox..."
docker pull python:3.11-slim

# Test Docker functionality
echo "🧪 Testing Docker functionality..."
docker run --rm python:3.11-slim python3 -c "print('✅ Docker is working!')"

echo "✅ Fintellect development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your actual values"
echo "2. Run 'cd server && npm run dev' to start the backend"
echo "3. Run 'cd client && npm run dev' to start the frontend"
echo ""
echo "🔗 The AI sandbox will use /tmp/fintellect-workspace for file operations" 