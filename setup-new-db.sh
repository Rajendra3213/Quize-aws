#!/bin/bash

echo "Setting up new database with individual timers..."

cd backend

# Reset database with new schema
python reset_db.py

# Seed questions
python seed_questions.py

echo "Database setup complete!"
echo "- Individual timers per user"
echo "- Prevention of retaking after submission"
echo "- 70 unique AWS questions loaded"