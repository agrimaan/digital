# Admin BFF Deployment Checklist

Use this checklist to ensure proper deployment of the Admin BFF service.

## Pre-Deployment

### 1. Code Review
- [ ] All code reviewed and approved
- [ ] No console.log statements in production code
- [ ] Error handling implemented for all endpoints
- [ ] Authentication middleware applied to all routes
- [ ] Service clients properly configured

### 2. Dependencies
- [ ] All dependencies installed (`npm install`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Dependencies up to date
- [ ] package-lock.json committed

### 3. Configuration
- [ ] `.env` file configured with production values
- [ ] JWT_SECRET is strong and unique
- [ ] All service URLs are correct
- [ ] PORT is available (default: 3013)
- [ ] NODE_ENV set to 'production'

### 4. Testing
- [ ] Health check endpoint works
- [ ] All dashboard endpoints tested
- [ ] Resource CRUD operations tested
- [ ] Authentication works correctly
- [ ] Authorization rejects non-admin users
- [ ] Error handling tested
- [ ] Service unavailability handled gracefully

## Deployment Steps

### 1. Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Set secure JWT secret
export JWT_SECRET=your-secure-secret-here

# Configure service URLs
export USER_SERVICE_URL=http://user-service:3002
export FIELD_SERVICE_URL=http://field-service:3003
# ... etc
```

### 2. Install Dependencies
```bash
cd digital/backend/admin-bff
npm install --production
```

### 3. Create Logs Directory
```bash
mkdir -p logs
chmod 755 logs
```

### 4. Build Docker Image (if using Docker)
```bash
docker build -t admin-bff:latest .
```

### 5. Start Service

**Option A: Direct Node.js**
```bash
npm start
```

**Option B: Docker**
```bash
docker run -d \
  --name admin-bff \
  -p 3013:3013 \
  --env-file .env \
  admin-bff:latest
```

**Option C: Docker Compose**
```bash
docker-compose up -d admin-bff
```

### 6. Verify Deployment
```bash
# Check health endpoint
curl http://localhost:3013/health

# Check logs
tail -f logs/combined.log

# Test authenticated endpoint
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3013/api/bff/dashboard/stats
```

## Post-Deployment

### 1. Monitoring Setup
- [ ] Log monitoring configured
- [ ] Error alerting set up
- [ ] Performance monitoring enabled
- [ ] Health check monitoring active

### 2. Security
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if applicable)
- [ ] Security headers configured
- [ ] JWT secret rotated from default

### 3. Documentation
- [ ] API documentation accessible
- [ ] Deployment guide updated
- [ ] Team trained on new endpoints
- [ ] Frontend integration completed

### 4. Backup & Recovery
- [ ] Backup strategy defined
- [ ] Recovery procedures documented
- [ ] Rollback plan prepared

## Frontend Integration

### 1. Update Frontend Service
- [ ] `adminService.ts` updated to use BFF endpoints
- [ ] Base URL changed to `/api/bff`
- [ ] All API calls tested

### 2. Update Components
- [ ] AdminDashboard component updated
- [ ] Resource management components updated
- [ ] Error handling implemented
- [ ] Loading states implemented

### 3. Testing
- [ ] Dashboard loads correctly
- [ ] All statistics display properly
- [ ] Recent users/orders show correctly
- [ ] Resource CRUD operations work
- [ ] Error messages display appropriately

## Production Checklist

### Performance
- [ ] Response times < 2 seconds
- [ ] Parallel service calls working
- [ ] No memory leaks
- [ ] CPU usage acceptable

### Reliability
- [ ] Service restarts automatically on failure
- [ ] Graceful shutdown implemented
- [ ] Health checks passing
- [ ] Error recovery working

### Security
- [ ] Authentication required on all endpoints
- [ ] Authorization checks working
- [ ] No sensitive data in logs
- [ ] HTTPS enforced

### Monitoring
- [ ] Logs being collected
- [ ] Errors being tracked
- [ ] Performance metrics available
- [ ] Alerts configured

## Rollback Plan

If issues occur after deployment:

### 1. Immediate Actions
```bash
# Stop the service
docker stop admin-bff
# or
pm2 stop admin-bff

# Revert frontend changes
git checkout HEAD~1 digital/frontend/src/services/adminService.ts
```

### 2. Restore Previous Version
```bash
# Use previous Docker image
docker run -d admin-bff:previous-version

# Or revert code
git revert <commit-hash>
```

### 3. Verify Rollback
- [ ] Health check passes
- [ ] Dashboard loads
- [ ] No errors in logs

## Maintenance

### Daily
- [ ] Check logs for errors
- [ ] Monitor service health
- [ ] Review performance metrics

### Weekly
- [ ] Review error rates
- [ ] Check disk space (logs)
- [ ] Update dependencies if needed

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Documentation updates

## Troubleshooting

### Service Won't Start
1. Check port availability: `lsof -i :3013`
2. Verify environment variables: `printenv | grep SERVICE`
3. Check logs: `tail -f logs/error.log`
4. Verify dependencies: `npm list`

### Can't Connect to Backend Services
1. Verify service URLs in `.env`
2. Check network connectivity: `ping user-service`
3. Verify services are running: `docker ps`
4. Check service health endpoints

### Authentication Errors
1. Verify JWT_SECRET matches across services
2. Check token format in requests
3. Verify user has admin role
4. Check token expiration

### Performance Issues
1. Check service response times
2. Review parallel request handling
3. Monitor memory usage
4. Check for slow database queries

## Sign-Off

### Development Team
- [ ] Code complete and tested
- [ ] Documentation complete
- [ ] Ready for deployment

**Signed:** _________________ **Date:** _________

### Operations Team
- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Deployment successful

**Signed:** _________________ **Date:** _________

### Product Team
- [ ] Functionality verified
- [ ] User acceptance complete
- [ ] Ready for production

**Signed:** _________________ **Date:** _________

## Notes

Add any deployment-specific notes here:

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Version:** _________________

**Environment:** _________________