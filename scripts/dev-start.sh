#!/bin/bash

echo "🚀 Starting RAJ AI PLATFORM..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env and add your GROQ_API_KEY"
    echo "   Get your API key from: https://console.groq.com/keys"
    exit 1
fi

# Check if GROQ_API_KEY is set
if ! grep -q "GROQ_API_KEY=your_groq_api_key_here\|GROQ_API_KEY=$" .env; then
    echo "✅ GROQ_API_KEY appears to be configured"
else
    echo "⚠️  Please set your GROQ_API_KEY in .env file"
    echo "   Get your API key from: https://console.groq.com/keys"
    exit 1
fi

# Check if Python venv exists
if [ ! -d "venv" ]; then
    echo "🐍 Python virtual environment not found. Setting up..."
    ./scripts/setup-python.sh
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    pnpm install
fi

echo "🔍 Running type check..."
pnpm check

if [ $? -eq 0 ]; then
    echo "✅ Type check passed"
    echo "🌟 Starting development server..."
    echo "   Frontend: http://localhost:5173"
    echo "   Backend: http://localhost:3000"
    echo "   Health Check: http://localhost:3000/api/health"
    echo ""
    pnpm dev
else
    echo "❌ Type check failed. Please fix the errors above."
    exit 1
fi