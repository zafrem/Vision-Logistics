# 🚨 Vision Logistics - Troubleshooting Guide

## Quick Fix for Connection Errors

If you're seeing these errors:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:3002/heatmap?collector_id=collector-01&camera_id=cam-001&window_ms=3600000:1
:3002/stats/cells?collector_id=collector-01&camera_id=cam-001:1
:3002/status:1
:3002/health:1
```

**🎯 Quick Solution:**
```bash
npm run fix-and-start
```

This command will:
1. ✅ Kill any conflicting processes
2. ✅ Clean install all dependencies  
3. ✅ Create missing assets (like vite.svg)
4. ✅ Start fallback services (no Docker needed)
5. ✅ Start all application services with proper error handling
6. ✅ Wait for services to be ready before reporting success

## 🔧 Manual Troubleshooting Steps

### Step 1: Check What's Running
```bash
# Check if services are running
npm run system:status

# Check ports manually
lsof -i :3000 -i :3001 -i :3002
netstat -tulpn | grep -E ':300[0-2]'  # Linux alternative
```

### Step 2: Kill Conflicting Processes
```bash
# Kill all Node processes (nuclear option)
killall node

# Kill specific ports
lsof -ti :3000 | xargs kill -9
lsof -ti :3001 | xargs kill -9  
lsof -ti :3002 | xargs kill -9
```

### Step 3: Clean Installation
```bash
# Remove all node_modules
rm -rf node_modules collector/node_modules manager/node_modules ui/node_modules

# Clean install
npm install
```

### Step 4: Start Services Manually
```bash
# Terminal 1 - Start fallback services
npm run start:fallback

# Wait 10 seconds, then in separate terminals:

# Terminal 2 - Generate test data
npm run generate-test-data

# Check http://localhost:3000
```

## 🐛 Common Error Solutions

### Error: `ERR_CONNECTION_REFUSED` on port 3002

**Cause**: Manager service isn't running
**Solution**:
```bash
# Check if manager is running
curl http://localhost:3002/health

# If not, restart manager
cd manager
npm run dev
```

### Error: `Failed to load resource: 404 (Not Found)` for vite.svg

**Cause**: Missing UI assets
**Solution**:
```bash
# Create missing vite.svg
mkdir -p ui/public
echo '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#646cff"/></svg>' > ui/public/vite.svg

# Restart UI service
cd ui  
npm run dev
```

### Error: Services start but no data shows

**Cause**: Test data not generated or services not connected
**Solution**:
```bash
# Generate test data
npm run generate-test-data

# Check service health
npm run system:health

# Verify manager can connect to Redis/Kafka
curl http://localhost:3002/status
```

### Error: `npm install` fails

**Cause**: Corrupted cache or permissions
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Fix permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Try again
npm install
```

## 🔍 Diagnostic Commands

### Check Service Health
```bash
# Quick validation
npm run validate

# Detailed health check
npm run system:health

# Individual service checks
curl http://localhost:3001/health  # Collector
curl http://localhost:3002/health  # Manager
curl http://localhost:3002/status  # Manager detailed
```

### View Logs
```bash
# All logs (if using system-manager)
npm run system:logs

# Individual logs
tail -f .logs/collector.log
tail -f .logs/manager.log
tail -f .logs/ui.log
```

### Test Data Flow
```bash
# Generate single test frame
curl -X POST http://localhost:3001/generate-test-frame \
  -H "Content-Type: application/json" \
  -d '{"camera_id": "cam-001", "object_count": 3}'

# Check if data reaches manager
curl "http://localhost:3002/heatmap?collector_id=collector-01&camera_id=cam-001"
```

## 🚀 Platform-Specific Solutions

### Windows Issues
```bat
REM Use the Windows batch file
start.bat

REM Or force fallback mode
start.bat --fallback

REM Check processes
netstat -an | findstr ":300"
tasklist | findstr "node"
```

### macOS Issues
```bash
# If ports are blocked by other services
sudo lsof -i :3000 :3001 :3002
sudo kill -9 [PID]

# Permission issues
sudo chown -R $(whoami) ~/.npm
```

### Linux Issues
```bash
# If systemd is blocking ports
sudo systemctl status
sudo netstat -tulpn | grep 300

# Firewall issues
sudo ufw allow 3000:3002/tcp
```

## ⚡ Emergency Reset

If nothing works, try the complete reset:

```bash
# 1. Stop everything
npm run system:stop 2>/dev/null || true
killall node 2>/dev/null || true

# 2. Clean everything
rm -rf node_modules collector/node_modules manager/node_modules ui/node_modules
rm -rf .logs .pids
npm cache clean --force

# 3. Fresh start
git clean -fdx  # WARNING: This removes all untracked files
npm install

# 4. Use the fix script
npm run fix-and-start
```

## 📞 Getting Help

### Information to Include When Reporting Issues

1. **Platform**: macOS/Linux/Windows + version
2. **Node.js version**: `node --version`
3. **Error output**: Copy the complete error message
4. **System validation**: `npm run validate` output
5. **Service status**: `npm run system:status` output
6. **Logs**: Relevant logs from `.logs/` directory

### Quick Diagnostic Report
```bash
# Run this and share the output
echo "=== System Info ==="
uname -a
node --version
npm --version

echo "=== Port Status ==="
lsof -i :3000 :3001 :3002 2>/dev/null || netstat -an | grep -E ':300[0-2]'

echo "=== Validation ==="
npm run validate

echo "=== Service Health ==="
npm run system:health
```

## ✅ Success Indicators

When everything is working correctly:

1. ✅ **All ports respond**:
   - http://localhost:3000 - UI loads
   - http://localhost:3001/health - Returns `{"status":"healthy"}`
   - http://localhost:3002/health - Returns `{"status":"healthy"}`

2. ✅ **Test data generates successfully**:
   ```bash
   npm run generate-test-data
   # Should show "✓ Sent frame..." messages
   ```

3. ✅ **UI shows data**:
   - Heatmap displays colored cells
   - Statistics table shows dwell times
   - System status shows all services healthy

4. ✅ **No console errors**:
   - No "ERR_CONNECTION_REFUSED" errors
   - No 404 errors for assets
   - Services log successful operations

## 💡 Pro Tips

### Development Workflow
```bash
# Best practice startup sequence
npm run fix-and-start         # Start everything cleanly
# Wait for "System is ready!" message
npm run generate-test-data    # Generate realistic data
# Open http://localhost:3000
```

### Performance Monitoring
```bash
# Monitor resource usage
npm run system:health

# Watch logs in real-time
npm run system:logs | grep -E "(ERROR|WARN|✓|❌)"

# Check data flow
curl -s http://localhost:3002/status | jq .
```

### Quick Recovery
```bash
# If a single service dies
cd manager && npm run dev      # Restart manager
cd collector && npm run dev    # Restart collector  
cd ui && npm run dev          # Restart UI
```

Remember: When in doubt, try `npm run fix-and-start` - it handles most common issues automatically! 🚀

---

## 🎬 **Animation and Demo Troubleshooting**

### **Animation Not Visible**

**Symptoms:**
- Heatmap shows static data only
- No movement patterns visible
- Objects stay in same positions

**Diagnosis:**
```bash
# Check if mock API is serving dynamic data
curl http://localhost:3002/heatmap | jq '.timestamp'
# Should return current timestamp that changes

# Check animation patterns
curl http://localhost:3002/objects/active | jq '.objects[].current_cell'
# Should show different positions when called multiple times
```

**Solutions:**
```bash
# Restart mock API for fresh animation
pkill -f "mock-api"
node mock-api.js

# Verify animation timing (15-second cycles)
# Wait 15-30 seconds between requests to see changes

# Force browser cache refresh
# Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
```

### **Demo Data vs Test Data Confusion**

**Important:** The system uses two different data sources:

1. **Mock API (for demos)**: `mock-api.js` - provides animated demonstration data
2. **Real pipeline**: collector → manager → UI (for actual use)

**If using `npm run generate-test-data` doesn't show results:**
- This is expected! Test data goes to the real pipeline
- The demo UI uses mock API data for animations
- To see test data, you need the manager service working properly

**Solutions:**
```bash
# For animated demos (recommended):
node mock-api.js
# Browse to http://localhost:3000

# For real data pipeline:
# Fix Redis compatibility first (see Redis section above)
cd manager && npm run dev
npm run generate-test-data
```

## 🔧 **Advanced Troubleshooting**

### **Redis Client Compatibility Issues**

**Error Message:**
```
TypeError: Cannot destructure property 'resolve' of 'undefined' or null
```

**Root Cause:** Redis client version 4.6.8+ incompatible with Node.js v22

**Solution:**
```bash
cd manager
npm install redis@4.0.0
npm run dev
```

### **Memory and Performance Issues**

**High Memory Usage:**
```bash
# Monitor Node.js processes
ps aux | grep node
top -p $(pgrep node)

# If memory is high, restart services
npm run system:stop
npm start
```

**Slow API Responses:**
```bash
# Test response times
time curl http://localhost:3002/heatmap
time curl http://localhost:3002/stats/cells

# If slow (>2 seconds), check Redis
redis-cli ping
redis-cli info memory
```

### **TypeScript and Build Errors**

**Missing Type Definitions:**
```bash
cd ui
npm install @types/node @types/react @types/react-dom
npm run type-check
```

**Vite Build Issues:**
```bash
cd ui
rm -rf node_modules/.vite dist
npm install
npm run build
```

### **Network and Security Issues**

**Firewall Blocking Ports:**
```bash
# macOS
sudo pfctl -d  # Disable firewall temporarily

# Linux (Ubuntu)
sudo ufw allow 3000:3002/tcp

# Windows
# Add firewall rule in Windows Defender
```

**CORS Issues in Browser:**
```bash
# Check browser console for CORS errors
# Start browser with disabled security (development only):

# Chrome
open -a "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome_dev

# Firefox
firefox --new-instance --profile /tmp/firefox_dev
```

## 📊 **Monitoring and Debugging**

### **Real-time Monitoring**

**Monitor All Services:**
```bash
# Terminal 1: Watch API responses
watch -n 2 'curl -s http://localhost:3002/health | jq .'

# Terminal 2: Monitor heatmap changes
watch -n 5 'curl -s http://localhost:3002/heatmap | jq .timestamp'

# Terminal 3: Watch active objects
watch -n 3 'curl -s http://localhost:3002/objects/active | jq ".objects[].current_cell"'
```

**Log Analysis:**
```bash
# Search for specific errors
grep -r "ERROR" .logs/
grep -r "Redis" .logs/
grep -r "connection" .logs/

# Monitor logs in real-time
tail -f .logs/*.log | grep -E "(ERROR|WARN|animation|heatmap)"
```

### **Browser Developer Tools**

**Essential Checks:**
1. **Console Tab**: Look for JavaScript errors
2. **Network Tab**: Check for failed API requests
3. **Performance Tab**: Monitor memory usage and rendering
4. **Application Tab**: Check localStorage/sessionStorage

**Common Browser Errors:**
- `ERR_CONNECTION_REFUSED`: Service not running
- `404 Not Found`: Missing assets or endpoints
- `CORS error`: Cross-origin policy issues
- `Memory leak warnings`: React component issues

## 🔬 **Deep Debugging**

### **Database State Inspection**

**Redis Debugging:**
```bash
# Connect to Redis
redis-cli

# Inspect keys and data
KEYS *
HGETALL object:obj-123
SCAN 0 MATCH cell:*
INFO memory
MONITOR  # Watch all commands (exit with Ctrl+C)
```

**Data Flow Validation:**
```bash
# 1. Generate test frame
curl -X POST http://localhost:3001/generate-test-frame \
  -H "Content-Type: application/json" \
  -d '{"camera_id": "debug", "object_count": 1}'

# 2. Check if it reaches Redis
redis-cli KEYS frame:*

# 3. Check if manager processes it
curl http://localhost:3002/status

# 4. Verify UI receives it
curl http://localhost:3002/heatmap | jq .cells
```

### **Component-Level Debugging**

**React DevTools:**
1. Install React Developer Tools browser extension
2. Open to Components tab
3. Look for state updates and re-renders
4. Monitor hooks like `useHeatmap`, `useActiveObjects`

**Manual Component Testing:**
```javascript
// In browser console, test API directly
fetch('http://localhost:3002/heatmap')
  .then(r => r.json())
  .then(data => console.log('Heatmap data:', data));

fetch('http://localhost:3002/objects/active')
  .then(r => r.json())
  .then(data => console.log('Active objects:', data));
```

## 🆘 **Emergency Recovery Procedures**

### **Complete System Recovery**

**When Everything is Broken:**
```bash
#!/bin/bash
echo "🚨 EMERGENCY RECOVERY STARTING..."

# 1. Kill all processes
sudo pkill -f node
sudo pkill -f redis
sudo pkill -f vite

# 2. Clean all caches
rm -rf node_modules collector/node_modules manager/node_modules ui/node_modules
rm -rf .logs .pids
npm cache clean --force

# 3. Reset Redis
brew services stop redis
rm -rf /usr/local/var/db/redis/
brew services start redis

# 4. Fresh install
npm install

# 5. Create missing assets
mkdir -p ui/public
echo '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#646cff"/></svg>' > ui/public/vite.svg

# 6. Start with fallback
npm run fix-and-start

echo "✅ EMERGENCY RECOVERY COMPLETE"
```

### **Service-Specific Recovery**

**Manager Service Issues:**
```bash
# Check manager dependencies
cd manager
npm install redis@4.0.0
npm audit fix

# Test manager independently
REDIS_URL=redis://localhost:6380 npm run dev

# If still failing, use mock API
pkill -f manager
node mock-api.js
```

**UI Service Issues:**
```bash
cd ui
rm -rf node_modules dist .vite
npm install
npm run build
npm run preview  # Test built version
```

## 📋 **Maintenance and Prevention**

### **Regular Health Checks**

**Daily Checks:**
```bash
# Morning routine
npm run system:health
curl http://localhost:3002/heatmap > /dev/null && echo "✅ API working"
ls -la .logs/ | tail -5  # Check log sizes

# Clean up old logs (weekly)
find .logs -name "*.log" -mtime +7 -delete
```

**Performance Monitoring:**
```bash
# Check memory usage trends
ps aux | grep node | awk '{print $4}' | awk '{sum+=$1} END {print "Total memory: " sum "%"}'

# Monitor disk space
df -h .
du -sh node_modules
```

### **Backup and Restore**

**Configuration Backup:**
```bash
# Backup important configs
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  package.json \
  collector/package.json \
  manager/package.json \
  ui/package.json \
  *.md \
  mock-api.js

# Restore from backup
tar -xzf config-backup-20240115.tar.gz
npm install
```

## 📚 **Reference Information**

### **Port and Service Map**

| Port | Service | Health Check | Purpose |
|------|---------|--------------|---------|
| 3000 | UI (Vite) | `curl http://localhost:3000` | React frontend |
| 3001 | Collector | `curl http://localhost:3001/health` | Data collection |
| 3002 | Manager/Mock API | `curl http://localhost:3002/health` | Data processing |
| 6379 | Redis | `redis-cli ping` | Data storage |

### **Environment Variables**

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `COLLECTOR_PORT` | `3001` | Collector service port |
| `PORT` | `3000` | UI service port |
| `NODE_ENV` | `development` | Environment mode |

### **Critical File Locations**

- **Logs**: `.logs/*.log`
- **Process IDs**: `.pids/*.pid`
- **Mock API**: `mock-api.js`
- **UI Assets**: `ui/public/`
- **Configuration**: `*/package.json`

---

**🛠️ Comprehensive troubleshooting complete! This guide covers everything from quick fixes to deep debugging.**