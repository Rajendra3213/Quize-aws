#!/bin/bash

# AWS Quiz Platform Deployment Script for EC2

echo "Setting up AWS Quiz Platform..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and Node.js
sudo apt install -y python3 python3-pip python3-venv nodejs npm

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initialize database and seed questions
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
python seed_questions.py

# Setup frontend
cd ../frontend
npm install
npm run build

# Create systemd services
sudo tee /etc/systemd/system/quiz-backend.service > /dev/null <<EOF
[Unit]
Description=Quiz Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Quize-aws/backend
Environment=PATH=/home/ubuntu/Quize-aws/backend/venv/bin
ExecStart=/home/ubuntu/Quize-aws/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/quiz-frontend.service > /dev/null <<EOF
[Unit]
Description=Quiz Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Quize-aws/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable quiz-backend quiz-frontend
sudo systemctl start quiz-backend quiz-frontend

# Install and configure nginx
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/quiz-platform > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/quiz-platform /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "Deployment complete!"
echo "Access your quiz platform at http://your-ec2-public-ip"