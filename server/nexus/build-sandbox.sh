#!/bin/bash

echo "🚀 Building Financial Analysis Sandbox..."

# Navigate to the nexus directory
cd "$(dirname "$0")"

# Build the Docker image using Docker Compose V2
echo "📦 Building Docker image..."
docker compose build

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🎯 To test the sandbox system:"
    echo "1. Restart your Node.js server"
    echo "2. Test with: 'Research current market conditions'"
    echo "3. Files will be created in Docker containers automatically"
    echo ""
    echo "🔍 To manually run a container for testing:"
    echo "docker run -d --name test-sandbox -p 6080:6080 -p 8080:8080 financial-analysis-sandbox:latest"
    echo ""
    echo "📁 To access files in container:"
    echo "docker exec -it test-sandbox ls -la /workspace/"
    echo ""
    echo "🌐 To access VNC (when container is running):"
    echo "http://localhost:6080"
    echo ""
    echo "🚀 You can also use Docker Compose to manage the service:"
    echo "docker compose up -d    # Start the service"
    echo "docker compose down     # Stop the service"
    echo "docker compose logs     # View logs"
else
    echo "❌ Docker build failed!"
    exit 1
fi 