# Integration Testing Troubleshooting Guide

This comprehensive troubleshooting guide helps resolve common issues encountered during Super Agents integration testing.

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Installation Issues](#installation-issues)
3. [Configuration Problems](#configuration-problems)
4. [Runtime Errors](#runtime-errors)
5. [Performance Issues](#performance-issues)
6. [IDE Integration Problems](#ide-integration-problems)
7. [Network and Connectivity](#network-and-connectivity)
8. [Error Recovery Testing](#error-recovery-testing)
9. [Automation and CI/CD](#automation-and-cicd)
10. [Advanced Debugging](#advanced-debugging)

## Quick Diagnosis

### Health Check Script

Run this diagnostic script to quickly identify common issues:

```bash
#!/bin/bash
# Save as: diagnose-integration-tests.sh

echo "🔍 Super Agents Integration Testing Diagnostic"
echo "============================================="

# Check Node.js version
echo "\n📋 System Information:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "OS: $(uname -s) $(uname -m)"
echo "Memory: $(free -h 2>/dev/null | grep '^Mem:' | awk '{print $2}' || echo 'N/A')"

# Check project structure
echo "\n📁 Project Structure:"
[ -f "package.json" ] && echo "✅ package.json found" || echo "❌ package.json missing"
[ -d "sa-engine/tests" ] && echo "✅ Test directory found" || echo "❌ Test directory missing"
[ -f "sa-engine/tests/e2e/integration-test-runner.js" ] && echo "✅ Test runner found" || echo "❌ Test runner missing"

# Check dependencies
echo "\n📦 Dependencies:"
[ -d "node_modules" ] && echo "✅ Dependencies installed" || echo "❌ Run 'npm install'"
[ -d "sa-engine/tests/node_modules" ] && echo "✅ Test dependencies installed" || echo "❌ Run 'cd sa-engine/tests && npm install'"

# Check MCP server
echo "\n🔌 MCP Server:"
if lsof -i :3001 >/dev/null 2>&1; then
    echo "✅ MCP server running on port 3001"
else
    echo "❌ MCP server not running - start with 'cd sa-engine/mcp-server && npm start'"
fi

# Check environment variables
echo "\n🌍 Environment:"
[ -n "$MCP_SERVER_URL" ] && echo "✅ MCP_SERVER_URL: $MCP_SERVER_URL" || echo "⚠️ MCP_SERVER_URL not set"
[ -n "$TEST_TIMEOUT" ] && echo "✅ TEST_TIMEOUT: $TEST_TIMEOUT" || echo "⚠️ TEST_TIMEOUT not set (using default)"

# Check disk space
echo "\n💾 Disk Space:"
df -h . | tail -1 | awk '{print "Available: " $4 " (" $5 " used)"}

# Test basic functionality
echo "\n🧪 Basic Test:"
if timeout 30 node -e "console.log('Node.js working')" 2>/dev/null; then
    echo "✅ Node.js execution working"
else
    echo "❌ Node.js execution failed"
fi

echo "\n🎯 Quick Fix Suggestions:"
echo "1. Ensure Node.js 18+ is installed"
echo "2. Run 'npm install' in project root"
echo "3. Run 'cd sa-engine/tests && npm install'"
echo "4. Start MCP server: 'cd sa-engine/mcp-server && npm start'"
echo "5. Set environment: 'export MCP_SERVER_URL=ws://localhost:3001'"
```

Make executable and run:

```bash
chmod +x diagnose-integration-tests.sh
./diagnose-integration-tests.sh
```

### Quick Status Check

```bash
# One-liner health check
node -e "console.log('✅ Node.js:', process.version); console.log('✅ Memory:', Math.round(process.memoryUsage().heapUsed/1024/1024) + 'MB'); console.log('✅ Platform:', process.platform);" 2>/dev/null && echo "✅ Basic environment OK" || echo "❌ Basic environment issues"
```

## Installation Issues

### Node.js Version Problems

**Issue**: Incompatible Node.js version
```
Error: This package requires Node.js >= 18.0
```

**Solutions**:

1. **Update Node.js**:
   ```bash
   # Using Node Version Manager (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   nvm alias default 18
   
   # Verify
   node --version
   ```

2. **Using Package Managers**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # macOS
   brew install node@18
   
   # Windows (using Chocolatey)
   choco install nodejs --version=18.17.0
   ```

### Dependency Installation Failures

**Issue**: NPM install failures
```
Error: EACCES: permission denied
Error: Cannot resolve dependency tree
```

**Solutions**:

1. **Permission Issues**:
   ```bash
   # Fix NPM permissions
   sudo chown -R $(whoami) ~/.npm
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   
   # Alternative: use NPM prefix
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Dependency Conflicts**:
   ```bash
   # Clear NPM cache
   npm cache clean --force
   
   # Remove node_modules and package-lock.json
   rm -rf node_modules package-lock.json
   rm -rf sa-engine/tests/node_modules sa-engine/tests/package-lock.json
   
   # Reinstall
   npm install
   cd sa-engine/tests && npm install
   ```

3. **Network Issues**:
   ```bash
   # Use different registry
   npm config set registry https://registry.npmjs.org/
   
   # Or use Yarn
   npm install -g yarn
   yarn install
   cd sa-engine/tests && yarn install
   ```

### Missing Test Files

**Issue**: Test runner not found
```
Error: Cannot find module './integration-test-runner.js'
```

**Solutions**:

1. **Verify File Structure**:
   ```bash
   ls -la sa-engine/tests/e2e/
   # Should show integration-test-runner.js
   ```

2. **Check File Permissions**:
   ```bash
   chmod +x sa-engine/tests/e2e/integration-test-runner.js
   ```

3. **Reinstall from Git**:
   ```bash
   git pull origin main
   git status
   # Ensure all files are present
   ```

## Configuration Problems

### Environment Variable Issues

**Issue**: Missing or incorrect environment variables
```
Error: MCP_SERVER_URL is not defined
```

**Solutions**:

1. **Create Environment File**:
   ```bash
   # Create .env.test
   cat > .env.test << EOF
   MCP_SERVER_URL=ws://localhost:3001
   TEST_TIMEOUT=300000
   TEST_RETRIES=2
   TEST_PARALLEL=true
   DEBUG=false
   EOF
   ```

2. **Load Environment Variables**:
   ```bash
   # Option 1: Export manually
   export MCP_SERVER_URL=ws://localhost:3001
   export TEST_TIMEOUT=300000
   
   # Option 2: Use dotenv
   npm install -g dotenv-cli
   dotenv -e .env.test -- node sa-engine/tests/e2e/integration-test-runner.js
   ```

3. **Verify Environment**:
   ```bash
   node -e "console.log('MCP_SERVER_URL:', process.env.MCP_SERVER_URL)"
   ```

### Configuration File Problems

**Issue**: Invalid configuration format
```
Error: Invalid JSON in configuration file
```

**Solutions**:

1. **Validate JSON Configuration**:
   ```bash
   # Check JSON syntax
   node -e "console.log(JSON.parse(require('fs').readFileSync('.config/test-config.json', 'utf8')))"
   
   # Use JSON validator
   npm install -g jsonlint
   jsonlint .config/test-config.json
   ```

2. **Reset to Default Configuration**:
   ```bash
   # Backup existing config
   cp .config/test-config.json .config/test-config.json.backup
   
   # Copy default config
   cp .config/test-config.json.template .config/test-config.json
   ```

### IDE Path Configuration

**Issue**: IDE executables not found
```
Error: Claude Code not found at specified path
```

**Solutions**:

1. **Find IDE Executables**:
   ```bash
   # Find Claude Code
   which claude-code
   find /Applications -name "*claude*" 2>/dev/null  # macOS
   find /usr -name "*claude*" 2>/dev/null           # Linux
   
   # Find Cursor
   which cursor
   find /Applications -name "*cursor*" 2>/dev/null  # macOS
   
   # Find VS Code
   which code
   find /Applications -name "Visual Studio Code.app" 2>/dev/null  # macOS
   ```

2. **Update Configuration**:
   ```bash
   # Set IDE paths in environment
   export CLAUDE_CODE_PATH=/usr/local/bin/claude-code
   export CURSOR_PATH=/usr/local/bin/cursor
   export VSCODE_PATH=/usr/local/bin/code
   ```

## Runtime Errors

### MCP Server Connection Issues

**Issue**: Cannot connect to MCP server
```
Error: WebSocket connection failed to ws://localhost:3001
```

**Solutions**:

1. **Check Server Status**:
   ```bash
   # Check if server is running
   lsof -i :3001
   netstat -an | grep 3001
   
   # Check server process
   ps aux | grep mcp-server
   ```

2. **Start MCP Server**:
   ```bash
   cd sa-engine/mcp-server
   
   # Start in foreground (for debugging)
   npm start
   
   # Start in background
   nohup npm start > server.log 2>&1 &
   
   # Check logs
   tail -f server.log
   ```

3. **Verify Server Configuration**:
   ```bash
   # Check server config
   cat sa-engine/mcp-server/package.json
   
   # Test server health
   curl -v http://localhost:3001/health
   ```

4. **Alternative Port**:
   ```bash
   # Use different port if 3001 is busy
   PORT=3002 npm start
   export MCP_SERVER_URL=ws://localhost:3002
   ```

### Memory and Resource Issues

**Issue**: Out of memory errors
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions**:

1. **Increase Memory Limit**:
   ```bash
   # Increase Node.js heap size
   node --max-old-space-size=4096 sa-engine/tests/e2e/integration-test-runner.js
   
   # Set as environment variable
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. **Reduce Test Parallelism**:
   ```bash
   TEST_PARALLEL=false node sa-engine/tests/e2e/integration-test-runner.js
   ```

3. **Run Tests in Batches**:
   ```bash
   # Run one suite at a time
   node sa-engine/tests/e2e/integration-test-runner.js --workflow-only
   node sa-engine/tests/e2e/integration-test-runner.js --ide-only
   node sa-engine/tests/e2e/integration-test-runner.js --performance-only
   ```

4. **Monitor Memory Usage**:
   ```bash
   # Real-time monitoring
   watch -n 2 'ps aux | grep node | grep -v grep'
   
   # Memory profiling
   node --inspect sa-engine/tests/e2e/integration-test-runner.js
   # Open chrome://inspect in Chrome
   ```

### Test Timeout Issues

**Issue**: Tests timing out
```
Error: Test "Complete Workflow Test" timed out after 300000ms
```

**Solutions**:

1. **Increase Timeout**:
   ```bash
   # Increase global timeout
   TEST_TIMEOUT=600000 node sa-engine/tests/e2e/integration-test-runner.js
   
   # Or per-suite timeout
   WORKFLOW_TIMEOUT=900000 node sa-engine/tests/e2e/integration-test-runner.js --workflow-only
   ```

2. **Identify Slow Tests**:
   ```bash
   # Run with timing information
   DEBUG=sa:timing node sa-engine/tests/e2e/integration-test-runner.js
   
   # Profile individual tests
   node --prof sa-engine/tests/e2e/integration-test-runner.js --workflow-only
   ```

3. **Optimize Test Environment**:
   ```bash
   # Close unnecessary applications
   # Use SSD storage
   # Ensure sufficient RAM
   
   # Check system load
   uptime
   top
   ```

### Import/Module Errors

**Issue**: ES Module import errors
```
SyntaxError: Cannot use import statement outside a module
```

**Solutions**:

1. **Check Package.json Type**:
   ```bash
   grep '"type"' package.json sa-engine/tests/package.json
   # Should show "type": "module"
   ```

2. **Use Correct File Extensions**:
   ```bash
   # Ensure .js files use ES modules
   # Or rename to .mjs
   mv integration-test-runner.js integration-test-runner.mjs
   ```

3. **Node.js Version**:
   ```bash
   # ES modules require Node.js 14+
   node --version
   ```

## Performance Issues

### Slow Test Execution

**Issue**: Tests running very slowly

**Diagnosis**:
```bash
# Time test execution
time node sa-engine/tests/e2e/integration-test-runner.js --workflow-only

# Profile performance
node --prof sa-engine/tests/e2e/integration-test-runner.js --workflow-only
node --prof-process isolate-*.log > performance-profile.txt
```

**Solutions**:

1. **Enable Parallelism**:
   ```bash
   TEST_PARALLEL=true node sa-engine/tests/e2e/integration-test-runner.js
   ```

2. **Optimize System**:
   ```bash
   # Close unnecessary applications
   # Use faster storage (SSD)
   # Increase RAM
   
   # Check disk I/O
   iotop  # Linux
   sudo fs_usage | grep node  # macOS
   ```

3. **Reduce Test Scope**:
   ```bash
   # Skip performance tests during development
   node sa-engine/tests/e2e/integration-test-runner.js --workflow-only --ide-only
   ```

### High CPU Usage

**Issue**: Tests consuming excessive CPU

**Solutions**:

1. **Limit Concurrency**:
   ```bash
   MAX_CONCURRENT_TESTS=5 node sa-engine/tests/e2e/integration-test-runner.js
   ```

2. **Use Process Isolation**:
   ```bash
   # Run tests in separate processes
   TEST_ISOLATION=true node sa-engine/tests/e2e/integration-test-runner.js
   ```

3. **Monitor CPU Usage**:
   ```bash
   # Real-time CPU monitoring
   htop
   
   # Per-process monitoring
   top -p $(pgrep -f integration-test-runner)
   ```

## IDE Integration Problems

### Claude Code Integration

**Issue**: Claude Code MCP integration not working
```
Error: MCP tools not available in Claude Code
```

**Solutions**:

1. **Verify MCP Configuration**:
   ```bash
   # Check Claude Code config
   cat ~/.config/claude/claude_desktop_config.json
   
   # Should contain MCP server configuration
   ```

2. **Test MCP Connection**:
   ```bash
   # Test WebSocket connection
   npx wscat -c ws://localhost:3001
   
   # Should connect without errors
   ```

3. **Check Claude Code Version**:
   ```bash
   claude-code --version
   # Ensure MCP support is available
   ```

4. **Restart Claude Code**:
   ```bash
   # Kill all Claude Code processes
   pkill -f claude-code
   
   # Restart Claude Code
   claude-code
   ```

### Cursor Integration

**Issue**: Cursor rules not loading
```
Error: Super Agents rules not active in Cursor
```

**Solutions**:

1. **Check Rules File Location**:
   ```bash
   ls -la .cursorrules
   # Should be in project root
   ```

2. **Verify Rules Content**:
   ```bash
   head -20 .cursorrules
   # Should contain Super Agents rules
   ```

3. **Restart Cursor**:
   ```bash
   # Close Cursor completely
   pkill -f cursor
   
   # Reopen project
   cursor .
   ```

### VS Code Extension

**Issue**: Super Agents VS Code extension not working
```
Error: Command 'superagents.initialize' not found
```

**Solutions**:

1. **Check Extension Installation**:
   ```bash
   code --list-extensions | grep super-agents
   ```

2. **Reinstall Extension**:
   ```bash
   # Build extension
   cd super-agents-vscode
   npm run build
   
   # Install locally
   code --install-extension super-agents-*.vsix
   ```

3. **Check Extension Logs**:
   ```bash
   # Open VS Code
   # Go to View > Output > Super Agents
   # Check for error messages
   ```

## Network and Connectivity

### Firewall Issues

**Issue**: Connection blocked by firewall
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solutions**:

1. **Check Firewall Rules**:
   ```bash
   # Linux (iptables)
   sudo iptables -L | grep 3001
   
   # macOS
   sudo pfctl -sr | grep 3001
   
   # Windows
   netsh advfirewall firewall show rule name="Super Agents"
   ```

2. **Add Firewall Exceptions**:
   ```bash
   # Linux (ufw)
   sudo ufw allow 3001
   
   # macOS
   # System Preferences > Security & Privacy > Firewall > Options
   # Add Node.js to allowed applications
   
   # Windows
   netsh advfirewall firewall add rule name="Super Agents MCP" dir=in action=allow port=3001 protocol=TCP
   ```

### Proxy Configuration

**Issue**: Corporate proxy blocking connections
```
Error: Proxy authentication required
```

**Solutions**:

1. **Configure NPM Proxy**:
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

2. **Configure Node.js Proxy**:
   ```bash
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   export NO_PROXY=localhost,127.0.0.1
   ```

3. **Test Proxy Settings**:
   ```bash
   curl -v http://registry.npmjs.org/
   ```

### DNS Resolution Issues

**Issue**: Cannot resolve hostnames
```
Error: getaddrinfo ENOTFOUND registry.npmjs.org
```

**Solutions**:

1. **Check DNS Configuration**:
   ```bash
   nslookup registry.npmjs.org
   dig registry.npmjs.org
   ```

2. **Use Alternative DNS**:
   ```bash
   # Temporarily use Google DNS
   echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf.tmp
   ```

3. **Use IP Addresses**:
   ```bash
   # Use IP instead of hostname
   export MCP_SERVER_URL=ws://127.0.0.1:3001
   ```

## Error Recovery Testing

### Error Injection Not Working

**Issue**: Error scenarios not being triggered
```
Warning: Error injection had no effect
```

**Solutions**:

1. **Verify Error Injection Configuration**:
   ```bash
   # Check error injection settings
   DEBUG=sa:error-injection node sa-engine/tests/e2e/integration-test-runner.js --error-recovery-only
   ```

2. **Test Individual Error Scenarios**:
   ```bash
   # Test specific error type
   ERROR_TYPE=network_timeout node sa-engine/tests/e2e/error-recovery/network-tests.js
   ```

3. **Manual Error Testing**:
   ```bash
   # Manually stop MCP server during test
   pkill -f mcp-server
   ```

### Recovery Mechanisms Failing

**Issue**: Error recovery not working as expected
```
Error: Recovery timeout - no fallback executed
```

**Solutions**:

1. **Check Recovery Configuration**:
   ```bash
   # Verify recovery settings
   grep -r "recovery" sa-engine/tests/e2e/framework/
   ```

2. **Test Recovery Manually**:
   ```bash
   # Stop service and test recovery
   pkill -f mcp-server
   sleep 5
   # Service should auto-restart
   ```

3. **Enable Recovery Debugging**:
   ```bash
   DEBUG=sa:recovery node sa-engine/tests/e2e/integration-test-runner.js --error-recovery-only
   ```

## Automation and CI/CD

### GitHub Actions Failures

**Issue**: Tests failing in GitHub Actions but passing locally

**Solutions**:

1. **Check Action Logs**:
   ```yaml
   # Add debugging to workflow
   - name: Debug Environment
     run: |
       echo "Node version: $(node --version)"
       echo "NPM version: $(npm --version)"
       echo "Working directory: $(pwd)"
       ls -la
       env | sort
   ```

2. **Use Act for Local Testing**:
   ```bash
   # Install act
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   
   # Run GitHub Actions locally
   act -j integration-tests
   ```

3. **Check Action Secrets**:
   ```bash
   # Ensure secrets are properly set
   # GitHub repository > Settings > Secrets and variables > Actions
   ```

### Docker Container Issues

**Issue**: Tests failing in Docker containers
```
Error: Cannot connect to display
```

**Solutions**:

1. **Use Headless Mode**:
   ```dockerfile
   # Add to Dockerfile
   ENV DISPLAY=:99
   ENV HEADLESS=true
   RUN apt-get update && apt-get install -y xvfb
   ```

2. **Fix Container Networking**:
   ```bash
   # Run with network access
   docker run --network host super-agents-tests
   ```

3. **Mount Volumes Correctly**:
   ```bash
   docker run -v $(pwd):/app -w /app super-agents-tests
   ```

### Jenkins Pipeline Issues

**Issue**: Pipeline hanging or failing

**Solutions**:

1. **Add Timeouts**:
   ```groovy
   timeout(time: 30, unit: 'MINUTES') {
       sh 'node sa-engine/tests/e2e/integration-test-runner.js --ci'
   }
   ```

2. **Use Proper Workspace**:
   ```groovy
   ws("workspace-${env.BUILD_NUMBER}") {
       // Test execution
   }
   ```

3. **Clean Up Resources**:
   ```groovy
   post {
       always {
           sh 'pkill -f mcp-server || true'
           sh 'docker system prune -f || true'
       }
   }
   ```

## Advanced Debugging

### Enable Comprehensive Logging

```bash
# Enable all debug categories
DEBUG=sa:*,mcp:*,test:* node sa-engine/tests/e2e/integration-test-runner.js

# Save logs to file
DEBUG=sa:* node sa-engine/tests/e2e/integration-test-runner.js 2>&1 | tee debug.log

# Enable Node.js debugging
node --inspect-brk sa-engine/tests/e2e/integration-test-runner.js
# Open chrome://inspect in Chrome
```

### Memory Leak Detection

```bash
# Use Node.js memory profiling
node --heapdump sa-engine/tests/e2e/integration-test-runner.js

# Analyze heap dumps
npm install -g heapdump
node -e "require('heapdump').writeSnapshot('before.heapsnapshot')"
# Run tests
node -e "require('heapdump').writeSnapshot('after.heapsnapshot')"
# Compare snapshots in Chrome DevTools
```

### Performance Profiling

```bash
# CPU profiling
node --prof sa-engine/tests/e2e/integration-test-runner.js
node --prof-process isolate-*.log > cpu-profile.txt

# Memory profiling
node --inspect sa-engine/tests/e2e/integration-test-runner.js
# Use Chrome DevTools Memory tab
```

### Network Debugging

```bash
# Monitor network traffic
sudo tcpdump -i lo port 3001

# WebSocket debugging
npx wscat -c ws://localhost:3001 -x '{"method":"ping"}'

# HTTP debugging
curl -v http://localhost:3001/health
```

### Creating Minimal Reproduction

```javascript
// Create minimal-test.js
import { TestRunner } from './sa-engine/tests/e2e/framework/TestRunner.js';

const runner = new TestRunner();

runner.registerSuite('minimal-test', {
  tests: [
    {
      name: 'Basic functionality',
      fn: async () => {
        console.log('Testing basic functionality...');
        // Your minimal test case here
      }
    }
  ]
});

runner.runAll().then(report => {
  console.log('Test completed:', report.summary);
}).catch(error => {
  console.error('Test failed:', error);
});
```

Run with:
```bash
node minimal-test.js
```

### System Resource Monitoring

```bash
# Create monitoring script
cat > monitor-tests.sh << 'EOF'
#!/bin/bash
echo "Starting test monitoring..."

# Start resource monitoring in background
{
  while true; do
    echo "$(date): $(ps aux | grep node | grep -v grep | wc -l) Node processes"
    echo "$(date): Memory: $(free -h | grep '^Mem:' | awk '{print $3}')"
    echo "$(date): Load: $(uptime | awk -F'load average:' '{print $2}')"
    sleep 10
  done
} > resource-monitor.log &

MONITOR_PID=$!

# Run tests
node sa-engine/tests/e2e/integration-test-runner.js

# Stop monitoring
kill $MONITOR_PID
echo "Test monitoring completed. Check resource-monitor.log"
EOF

chmod +x monitor-tests.sh
./monitor-tests.sh
```

## Getting Expert Help

### Information to Gather

Before seeking help, gather this information:

```bash
# Create diagnostic report
cat > diagnostic-report.txt << EOF
# Super Agents Integration Testing Diagnostic Report
# Generated: $(date)

## System Information
Node.js Version: $(node --version)
NPM Version: $(npm --version)
Operating System: $(uname -a)
Memory: $(free -h 2>/dev/null | grep '^Mem:' || echo 'N/A')
Disk Space: $(df -h . | tail -1)

## Environment Variables
$(env | grep -E '^(MCP|TEST|DEBUG|NODE)' | sort)

## Process Information
$(ps aux | grep -E '(node|mcp)' | grep -v grep)

## Network Status
$(lsof -i :3001 2>/dev/null || echo 'Port 3001 not in use')

## Recent Logs
$(tail -50 sa-engine/tests/e2e/test-results/test-*.log 2>/dev/null || echo 'No recent test logs')

## Error Messages
# Add specific error messages here

EOF

echo "Diagnostic report created: diagnostic-report.txt"
```

### Community Support

1. **GitHub Issues**: Create an issue with:
   - Diagnostic report
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

2. **Stack Overflow**: Tag questions with:
   - `super-agents`
   - `integration-testing`
   - `node.js`
   - Specific technology (e.g., `claude-code`, `cursor`)

3. **Discord Community**: Join for real-time help
   - Quick questions and troubleshooting
   - Community best practices
   - Beta testing coordination

### Professional Support

For enterprise users:

- **Priority Support**: Guaranteed response times
- **Custom Integration**: Help with specific IDE setups
- **Performance Optimization**: System tuning and optimization
- **Training**: Team training on testing best practices

Contact: support@super-agents.dev

---

**Remember**: Most issues can be resolved by:
1. Ensuring Node.js 18+ is installed
2. Running `npm install` in both root and test directories
3. Starting the MCP server before running tests
4. Setting proper environment variables
5. Checking system resources (memory, disk, CPU)

For persistent issues, create a minimal reproduction case and gather the diagnostic information above before seeking help.
