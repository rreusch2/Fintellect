# 🚀 Fintellect GitHub Codespaces Setup

This devcontainer configuration provides a complete development environment for Fintellect in GitHub Codespaces.

## 🆓 Free Tier Information

GitHub Codespaces free tier includes:
- **120 core hours per month** for free
- **15 GB storage** included
- **2-core machines** available on free tier
- Perfect for development work!

## 🛠️ What's Included

- **Node.js 20** with TypeScript support
- **Docker-in-Docker** for AI sandbox functionality
- **Python 3** for AI tool execution
- **Git & GitHub CLI** pre-configured
- **VS Code extensions** for optimal development
- **Port forwarding** for all services (5001, 5173, 5174, 3000)

## 📋 Setup Steps

### 1. Start Codespace
1. Go to your GitHub repository
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait for the environment to build (2-3 minutes)

### 2. Configure Environment Variables
After the codespace starts, update the `.env` file:

```bash
# Edit the environment file
code .env
```

**Required values:**
```env
DATABASE_URL=postgresql://username:password@host:5432/database
SESSION_SECRET=your-super-secret-session-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

**Optional values:**
```env
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
```

### 3. Start Development Servers

**Backend Server:**
```bash
cd server
npm run dev
```

**Frontend Server (new terminal):**
```bash
cd client  
npm run dev
```

## 🐳 Docker Sandbox

The AI tools use Docker for secure code execution:
- **Workspace**: `/tmp/fintellect-workspace`
- **Image**: `python:3.11-slim`
- **Auto-configured**: No additional setup needed!

## 🔧 VS Code Extensions

Pre-installed extensions:
- TypeScript support
- Tailwind CSS IntelliSense
- Prettier code formatting
- Docker support
- Python support

## 🌐 Port Forwarding

Automatic port forwarding for:
- **5001**: Backend API server
- **5173**: Vite dev server (client)
- **5174**: Alternative frontend port
- **3000**: Web application

## 🚨 Important Notes

1. **Environment Variables**: Make sure to set your actual API keys in `.env`
2. **Database**: Use your Neon.tech PostgreSQL connection string
3. **Docker**: The AI sandbox will work automatically with Docker-in-Docker
4. **Free Tier**: 120 hours/month should be plenty for development

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Kill any existing processes
pkill -f tsx
pkill -f node
```

**Docker not working?**
```bash
# Test Docker
docker run --rm python:3.11-slim python3 -c "print('Docker works!')"
```

**Need to restart?**
- Use **Ctrl+Shift+P** → **Codespaces: Rebuild Container**

## ✅ Verification

Once setup is complete, you should see:
1. Backend server running on port 5001
2. Frontend server running on port 5173
3. Docker workspace at `/tmp/fintellect-workspace`
4. AI tools creating actual files in the sandbox

Ready to develop! 🎉 