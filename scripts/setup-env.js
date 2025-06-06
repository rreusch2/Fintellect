#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Server .env template
const serverEnvTemplate = `# Generated by Enhanced Nexus setup script

# Environment Mode
ENV_MODE=development

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/fintellect"

# Session & JWT Configuration
SESSION_SECRET="your-session-secret-here"
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-here"

# Plaid Configuration
PLAID_CLIENT_ID="your-plaid-client-id"
PLAID_SECRET="your-plaid-secret"
PLAID_ENV="sandbox"

# LLM Providers (Enhanced Nexus)
GOOGLE_AI_API_KEY="your-google-ai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Web Research Tools
TAVILY_API_KEY="your-tavily-api-key"
FIRECRAWL_API_KEY="your-firecrawl-api-key"
RAPIDAPI_KEY="your-rapidapi-key"

# Secure Execution Environment
DAYTONA_API_KEY="your-daytona-api-key"
DAYTONA_BASE_URL="http://localhost:3986"

# Server Configuration
PORT=5001
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"

# Redis (Optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SSL=false
`;

// Client .env template
const clientEnvTemplate = `# Frontend Environment Variables
# These are safe to expose to the client

# Environment Mode
VITE_ENV_MODE=development

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:5001
VITE_NEXUS_API_URL=http://localhost:5001/api/nexus

# Public Configuration
VITE_APP_NAME=Fintellect
VITE_APP_VERSION=1.0.0

# Public Feature Flags
VITE_ENABLE_NEXUS=true
VITE_ENABLE_AI_FEATURES=true

# Public Analytics (if needed)
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=
`;

function createEnvFile(filePath, content, description) {
  const dir = path.dirname(filePath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  ${description} already exists at ${filePath}`);
    return false;
  }
  
  // Write the file
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created ${description} at ${filePath}`);
  return true;
}

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  console.log('🚀 Enhanced Nexus Environment Setup');
  console.log('=====================================');
  console.log('This script will create separate .env files for backend and frontend.');
  console.log('');
  
  const projectRoot = process.cwd();
  const serverEnvPath = path.join(projectRoot, 'server', '.env');
  const clientEnvPath = path.join(projectRoot, 'client', '.env.local');
  
  console.log(`Project root: ${projectRoot}`);
  console.log(`Server .env: ${serverEnvPath}`);
  console.log(`Client .env: ${clientEnvPath}`);
  console.log('');
  
  // Check if files exist
  const serverExists = fs.existsSync(serverEnvPath);
  const clientExists = fs.existsSync(clientEnvPath);
  
  if (serverExists || clientExists) {
    console.log('⚠️  Some environment files already exist:');
    if (serverExists) console.log(`   - ${serverEnvPath}`);
    if (clientExists) console.log(`   - ${clientEnvPath}`);
    console.log('');
    
    const overwrite = await promptUser('Do you want to overwrite existing files? (y/N): ');
    if (overwrite !== 'y' && overwrite !== 'yes') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  // Create server .env
  if (!serverExists || await promptUser('Overwrite server .env? (y/N): ') === 'y') {
    if (serverExists) fs.unlinkSync(serverEnvPath);
    createEnvFile(serverEnvPath, serverEnvTemplate, 'Server .env file');
  }
  
  // Create client .env
  if (!clientExists || await promptUser('Overwrite client .env.local? (y/N): ') === 'y') {
    if (clientExists) fs.unlinkSync(clientEnvPath);
    createEnvFile(clientEnvPath, clientEnvTemplate, 'Client .env.local file');
  }
  
  console.log('');
  console.log('🎉 Environment setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Edit server/.env with your actual API keys');
  console.log('2. Edit client/.env.local if needed');
  console.log('3. See NEXUS_ENV_SETUP.md for API key setup instructions');
  console.log('4. Start the server: cd server && npm run dev');
  console.log('5. Start the client: cd client && npm run dev');
  console.log('');
  
  rl.close();
}

main().catch(console.error); 