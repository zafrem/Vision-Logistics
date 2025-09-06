#!/bin/bash

# Vision Logistics Services Stopper
set -e

echo "🛑 Stopping Vision Logistics Services..."
echo "======================================"

cd "$(dirname "$0")"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found"
    exit 1
fi

# Stop application processes first
echo "🔄 Stopping application processes..."
pkill -f "tsx watch" || true
pkill -f "vite" || true
pkill -f "node.*startup" || true

# Stop Docker services
echo "🔧 Stopping Docker services..."
echo "  Stopping Redis Commander..."
docker compose -f docker/docker-compose.yml stop redis-commander || true

echo "  Stopping Redis..."
docker compose -f docker/docker-compose.yml stop redis || true

# Remove containers
echo "🗑️  Removing containers..."
docker compose -f docker/docker-compose.yml rm -f || true

# Kill processes on specific ports
echo "🔌 Cleaning up ports..."
for port in 3000 3001 3002 6379 8081; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

echo ""
echo "✅ All services stopped!"
echo "======================================"