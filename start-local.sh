#!/bin/bash

echo "Starting AWS Quiz Platform locally..."

# Start backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed_questions.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &

# Start frontend
cd ../frontend
npm install
npm run dev &

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:3000"
echo "Press Ctrl+C to stop both services"

wait