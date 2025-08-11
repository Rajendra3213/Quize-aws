#!/bin/bash

echo "Testing Enhanced AWS Quiz Platform..."

# Start backend
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python seed_questions.py
else
    source venv/bin/activate
fi

echo "Starting backend on port 8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "Starting frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 Enhanced AWS Quiz Platform is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo ""
echo "✨ New Features:"
echo "   • Professional UI with gradient backgrounds"
echo "   • 70-minute timer with auto-submit"
echo "   • Question navigation grid"
echo "   • Mark questions for review"
echo "   • Back/Forward navigation"
echo "   • Real-time progress tracking"
echo "   • Enhanced leaderboard"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait