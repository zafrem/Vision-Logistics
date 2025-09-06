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