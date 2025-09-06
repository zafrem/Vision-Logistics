#!/bin/bash

# Vision Logistics Services Starter
set -e

echo "🚀 Starting Vision Logistics Services..."
echo "======================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker or use Homebrew:"
    echo "  brew install kafka"
    echo "  brew services start zookeeper"
    echo "  brew services start kafka"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker Desktop"
    exit 1
fi

cd "$(dirname "$0")"

# Start services
echo "🔧 Starting services..."
echo "  Starting Redis..."
docker compose -f docker/docker-compose.yml up -d redis

# Wait and verify
echo "⏳ Waiting for services..."
sleep 5

echo "🔍 Verifying services..."
timeout 10s bash -c 'until docker exec vision-redis redis-cli ping | grep -q PONG; do sleep 1; done' && echo "✅ Redis ready" || echo "❌ Redis failed"

echo ""
echo "🎉 Services started!"
echo "Redis: localhost:6379"
echo ""
echo "Run 'npm start' to start application modules"
echo "Run './stop-services.sh' to stop all services"