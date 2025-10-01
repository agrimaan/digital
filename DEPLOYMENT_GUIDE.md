# Agrimaan Digital - Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the enhanced Agrimaan Digital platform with comprehensive admin UI functionality.

## Prerequisites
- Node.js 16+ with npm
- MongoDB 5.0+
- Redis (optional, for caching)
- Docker & Docker Compose (optional)
- Git

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/agrimaan/digital.git
cd digital
```

### 2. Environment Configuration
Create `.env` files for each service:

#### Backend Services
```bash
# backend/admin-service/.env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/agrimaan_admin
JWT_SECRET=your-jwt-secret-key
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

#### Frontend Admin UI
```bash
# frontend/admin-ui/.env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=production
```

## Installation Steps

### 1. Install Backend Dependencies
```bash
# Install all backend services
cd backend
for service in admin-service user-service content-service analytics-service notification-service; do
  cd $service && npm install && cd ..
done
```

### 2. Install Frontend Dependencies
```bash
cd frontend/admin-ui
npm install
```

### 3. Database Setup
```bash
# Start MongoDB
mongod --dbpath /data/db

# Create database and indexes
mongo
use agrimaan_admin
db.admins.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.audit_logs.createIndex({ timestamp: -1 })
db.notifications.createIndex({ user: 1, read: 1 })
```

### 4. Seed Initial Data
```bash
cd backend/admin-service
npm run seed
```

## Development Setup

### 1. Start Backend Services
```bash
# Start all services with PM2
npm install -g pm2
pm2 start ecosystem.config.js

# Or start individually
cd backend/admin-service
npm run dev

cd backend/user-service
npm run dev

# Continue for other services...
```

### 2. Start Frontend Development
```bash
cd frontend/admin-ui
npm start
```

## Production Deployment

### 1. Build Frontend
```bash
cd frontend/admin-ui
npm run build
```

### 2. Start Production Services
```bash
# Start all services
pm2 start ecosystem.config.js --env production

# Or use Docker
docker-compose up -d
```

## Docker Deployment

### 1. Build and Run with Docker
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7.0
    ports:
      - "6379:6379"

  admin-service:
    build: ./backend/admin-service
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
      - redis
    environment:
      - NODE_ENV=production

  admin-ui:
    build: ./frontend/admin-ui
    ports:
      - "5006:80"
    depends_on:
      - admin-service

volumes:
  mongodb_data:
```

## Environment Variables

### Required Environment Variables
```bash
# Backend
PORT=3001
MONGODB_URI=mongodb://localhost:27017/agrimaan
JWT_SECRET=your-secure-jwt-secret
REDIS_URL=redis://localhost:6379
NODE_ENV=production

# Frontend
REACT_APP_API_URL=http://localhost:3001/api
```

### Optional Environment Variables
```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password

# Cloud Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Analytics
GOOGLE_ANALYTICS_ID=your-ga-id
```

## Nginx Configuration

### 1. Nginx Server Block
```nginx
# /etc/nginx/sites-available/agrimaan
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/agrimaan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Configuration

### 1. Install Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 2. Generate SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## Database Backup

### 1. Automated Backup Script
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/agrimaan"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --host localhost --port 27017 --db agrimaan --out $BACKUP_DIR/$DATE
```

### 2. Add to Crontab
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Monitoring Setup

### 1. PM2 Monitoring
```bash
pm2 install pm2-server-monit
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Health Checks
```bash
# Create health check endpoint
curl -f http://localhost:3001/api/health || exit 1
```

## Load Balancing

### 1. Multiple Instances
```bash
# PM2 cluster mode
pm2 start backend/admin-service/server.js -i max --name "admin-service"
```

### 2. Nginx Load Balancing
```nginx
upstream backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    location /api {
        proxy_pass http://backend;
    }
}
```

## Security Hardening

### 1. Firewall Configuration
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Rate Limiting
```bash
# Install fail2ban
sudo apt install fail2ban
```

### 3. Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Performance Optimization

### 1. Database Optimization
```javascript
// Add indexes for better performance
db.users.createIndex({ email: 1 });
db.content.createIndex({ status: 1, createdAt: -1 });
db.audit_logs.createIndex({ user: 1, timestamp: -1 });
```

### 2. Redis Caching
```javascript
// Cache frequently accessed data
client.setex('users:count', 3600, userCount);
```

### 3. CDN Configuration
```bash
# Configure CDN for static assets
npm run build
aws s3 sync build/ s3://your-cdn-bucket/
```

## Troubleshooting

### Common Issues

#### 1. Database Connection
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

#### 2. Port Already in Use
```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

#### 3. Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

## Health Checks

### 1. API Health Check
```bash
curl -f http://localhost:3001/api/health
```

### 2. Database Health Check
```bash
mongo --eval "db.runCommand('ping')"
```

### 3. Frontend Health Check
```bash
curl -f http://localhost:5006
```

## Maintenance

### 1. Update Dependencies
```bash
npm update
npm audit fix
```

### 2. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/agrimaan
```

### 3. Database Maintenance
```bash
# Optimize database
mongo agrimaan --eval "db.runCommand({compact: 'users'})"
```

## Support

### 1. Log Files
- Backend: `/var/log/agrimaan/`
- Frontend: Browser console
- System: `/var/log/syslog`

### 2. Contact Information
- Technical Support: support@agrimaan.com
- Documentation: docs.agrimaan.com
- Status Page: status.agrimaan.com

## Next Steps
1. Configure monitoring
2. Set up alerts
3. Configure backups
4. Test disaster recovery
5. Update documentation
6. Train team members