# AWS Quiz Platform

A simple quiz platform built with FastAPI, SQLite, and Next.js for testing AWS basics knowledge.

## Features

- **Admin Panel**: Create quiz channels with unique codes
- **User Participation**: Join channels using codes
- **70 AWS Questions**: Pre-loaded with AWS basics questions
- **Real-time Scoring**: Track scores and view leaderboard
- **Responsive Design**: Works on desktop and mobile

## Architecture

- **Backend**: FastAPI with SQLite database
- **Frontend**: Next.js with TypeScript
- **Database**: SQLite for simplicity
- **Deployment**: EC2 with Nginx reverse proxy

## Local Development

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_questions.py  # Load 70 AWS questions
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## EC2 Deployment

1. Launch an EC2 instance (Ubuntu 20.04 LTS recommended)
2. Configure security group to allow HTTP (port 80) and SSH (port 22)
3. Upload project files to EC2
4. Run deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Usage

1. **Admin**: Create a channel and share the generated code
2. **Users**: Join using the channel code
3. **Quiz**: Answer 70 AWS questions (multiple choice)
4. **Results**: View leaderboard after completion

## API Endpoints

- `POST /users/` - Create user
- `POST /channels/` - Create channel (admin only)
- `POST /join-channel/` - Join channel
- `GET /questions/` - Get all questions
- `POST /submit-answer/` - Submit answer
- `GET /leaderboard/{channel_code}` - Get leaderboard

## Database Schema

- **Users**: username, is_admin
- **Channels**: name, code, admin_id
- **Questions**: text, options (A-D), correct_answer
- **Participants**: user_id, channel_id, score
- **Answers**: participant_id, question_id, selected_answer, is_correct

## Security Considerations

- No authentication implemented (basic version)
- SQLite suitable for small deployments
- Consider adding HTTPS for production
- Rate limiting recommended for production

## Scaling

For larger deployments, consider:
- PostgreSQL instead of SQLite
- Redis for session management
- Load balancer for multiple instances
- WebSocket for real-time updates