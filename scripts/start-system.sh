#!/bin/bash

echo "🚀 Starting Vision Logistics Tracking System..."

# Check for required tools
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed. Please install Docker first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install npm first."
    exit 1
fi

echo "✓ Prerequisites check passed"

# Install dependencies if not already done
echo "📦 Installing dependencies..."
npm install
npm install --workspace=collector
npm install --workspace=manager  
npm install --workspace=ui

# Start Docker services
echo "🐳 Starting infrastructure services..."
cd docker
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."
for i in {1..30}; do
    if curl -s http://localhost:6379 > /dev/null 2>&1 && \
       curl -s http://localhost:9092 > /dev/null 2>&1; then
        echo "✓ Infrastructure services are ready"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "⚠️  Infrastructure services may not be fully ready, but continuing..."
        break
    fi
    
    sleep 2
done

cd ..

echo "🎯 Infrastructure is ready! You can now start the application services:"
echo ""
echo "Terminal 1 - Collector Service:"
echo "  npm run dev:collector"
echo ""
echo "Terminal 2 - Manager Service:" 
echo "  npm run dev:manager"
echo ""
echo "Terminal 3 - UI Dashboard:"
echo "  npm run dev:ui"
echo ""
echo "Terminal 4 - Generate Test Data:"
echo "  npm run generate-test-data"
echo ""
echo "🌐 Access points:"
echo "  • UI Dashboard: http://localhost:3000"
echo "  • Kafka UI: http://localhost:8080" 
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo "📖 See README.md for detailed instructions"