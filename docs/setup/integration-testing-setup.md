# Super Agents Integration Testing Setup Guide

This guide walks you through setting up and running the comprehensive integration testing suite for the Super Agents Framework.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running Tests](#running-tests)
5. [IDE Integration Testing](#ide-integration-testing)
6. [Performance Testing](#performance-testing)
7. [Error Recovery Testing](#error-recovery-testing)
8. [Automation Setup](#automation-setup)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18.0+ (LTS recommended)
- **NPM**: 8.0+
- **Operating System**: Linux, macOS, or Windows
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Disk Space**: 2GB free space for test artifacts

### Development Environment

```bash
# Check Node.js version
node --version
# Should be 18.0 or higher

# Check NPM version
npm --version
# Should be 8.0 or higher

# Verify system memory
free -h  # Linux
top -l 1 | grep PhysMem  # macOS
systeminfo | findstr "Total Physical Memory"  # Windows
```

### IDE Requirements (for IDE integration tests)

- **Claude Code**: Latest version with MCP support
- **Cursor**: Latest version with rules support
- **VS Code**: 1.80+ with extension development capabilities
- **Windsurf**: Latest version (optional)

## Installation

### 1. Clone and Setup Repository

```bash
# Navigate to Super Agents project
cd super-agents

# Install main dependencies
npm install

# Install test-specific dependencies
cd sa-engine/tests
npm install

# Return to project root
cd ../..
```

### 2. Verify Installation

```bash
# Check test framework installation
node sa-engine/tests/e2e/integration-test-runner.js --help

# Run basic verification
npm run test:verify
```

### 3. Setup Test Environment

```bash
# Create test configuration
cp .env.template .env.test

# Edit test configuration
vim .env.test
```

## Configuration

### Environment Configuration

Create `.env.test` with the following variables:

```bash
# MCP Server Configuration
MCP_SERVER_URL=ws://localhost:3001
MCP_SERVER_TIMEOUT=30000

# Test Configuration
TEST_TIMEOUT=300000
TEST_RETRIES=2
TEST_PARALLEL=true

# IDE Configuration
CLAUDE_CODE_PATH=/path/to/claude-code
CURSOR_PATH=/path/to/cursor
VSCODE_PATH=/path/to/code

# Performance Configuration
PERF_MEMORY_LIMIT=500
PERF_DURATION_LIMIT=5000

# Automation Configuration
CI_MODE=false
REPORTS_DIR=./test-results
```

### Test Data Configuration

Create test data directory:

```bash
mkdir -p sa-engine/tests/e2e/fixtures/test-data
```

Populate with test projects:

```bash
# Copy sample projects
cp -r examples/sample-projects/* sa-engine/tests/e2e/fixtures/test-data/
```

## Running Tests

### Basic Test Execution

```bash
# Run all integration tests
node sa-engine/tests/e2e/integration-test-runner.js

# Run specific test suite
node sa-engine/tests/e2e/integration-test-runner.js --workflow-only
node sa-engine/tests/e2e/integration-test-runner.js --ide-only
node sa-engine/tests/e2e/integration-test-runner.js --error-recovery-only
node sa-engine/tests/e2e/integration-test-runner.js --performance-only
```

### Advanced Test Options

```bash
# Run in CI mode (non-interactive)
node sa-engine/tests/e2e/integration-test-runner.js --ci

# Disable report generation
node sa-engine/tests/e2e/integration-test-runner.js --no-reports

# Run with custom timeout
TEST_TIMEOUT=600000 node sa-engine/tests/e2e/integration-test-runner.js

# Run with verbose output
DEBUG=sa:* node sa-engine/tests/e2e/integration-test-runner.js
```

### NPM Script Shortcuts

Add to your `package.json`:

```json
{
  "scripts": {
    "test:integration": "node sa-engine/tests/e2e/integration-test-runner.js",
    "test:integration:workflow": "node sa-engine/tests/e2e/integration-test-runner.js --workflow-only",
    "test:integration:ide": "node sa-engine/tests/e2e/integration-test-runner.js --ide-only",
    "test:integration:performance": "node sa-engine/tests/e2e/integration-test-runner.js --performance-only",
    "test:integration:ci": "node sa-engine/tests/e2e/integration-test-runner.js --ci"
  }
}
```

Then run with:

```bash
npm run test:integration
npm run test:integration:workflow
npm run test:integration:ide
```

## IDE Integration Testing

### Claude Code Setup

1. **Install Claude Code**:
   ```bash
   # Follow Claude Code installation instructions
   curl -sSL https://claude.ai/install | bash
   ```

2. **Configure MCP Integration**:
   ```bash
   # Copy MCP configuration
   cp integrations/mcp/claude-code/claude_desktop_config.json ~/.config/claude/
   ```

3. **Start MCP Server**:
   ```bash
   cd sa-engine/mcp-server
   npm start
   ```

4. **Run Claude Code Tests**:
   ```bash
   node sa-engine/tests/e2e/integration-test-runner.js --ide-only
   ```

### Cursor Setup

1. **Install Cursor**:
   - Download from [cursor.sh](https://cursor.sh)
   - Install according to your platform

2. **Configure Rules Integration**:
   ```bash
   # Copy rules files
   cp integrations/mcp/cursor/.cursorrules /path/to/test/project/
   ```

3. **Test Cursor Integration**:
   ```bash
   # Cursor-specific integration tests
   node sa-engine/tests/e2e/ide-compatibility/cursor-tests.js
   ```

### VS Code Setup

1. **Install VS Code Extension**:
   ```bash
   # Build and install extension
   cd super-agents-vscode
   npm run build
   code --install-extension super-agents-*.vsix
   ```

2. **Configure Workspace**:
   ```bash
   # Copy workspace settings
   cp integrations/mcp/vscode/templates/workspace-settings.json .vscode/settings.json
   ```

## Performance Testing

### System Monitoring Setup

```bash
# Install system monitoring tools (Linux)
sudo apt-get install htop iotop

# Install on macOS
brew install htop

# Monitor during tests
htop &
node sa-engine/tests/e2e/integration-test-runner.js --performance-only
```

### Performance Benchmarks

The performance testing suite validates:

- **Tool Execution Speed**: < 5 seconds per tool
- **Memory Usage**: < 500MB peak usage
- **Concurrent Operations**: 10+ simultaneous operations
- **Large Project Handling**: 1000+ tasks efficiently

### Custom Performance Tests

```javascript
// Add to sa-engine/tests/e2e/custom-performance.js
import { PerformanceMonitor } from './framework/PerformanceMonitor.js';

const monitor = new PerformanceMonitor();
monitor.start();

// Your custom performance test
const result = await monitor.benchmarkTool(
  'custom-tool',
  () => yourCustomOperation(),
  10 // iterations
);

console.log('Performance Results:', result);
```

## Error Recovery Testing

### Network Failure Simulation

```bash
# Test network resilience
node sa-engine/tests/e2e/error-recovery/network-tests.js

# Simulate specific failures
NETWORK_ERROR=connection_timeout node sa-engine/tests/e2e/integration-test-runner.js --error-recovery-only
```

### Service Interruption Testing

```bash
# Test MCP server crash recovery
SIMULATE_CRASH=mcp_server node sa-engine/tests/e2e/integration-test-runner.js --error-recovery-only

# Test database connection issues
SIMULATE_CRASH=database node sa-engine/tests/e2e/integration-test-runner.js --error-recovery-only
```

### Custom Error Scenarios

```javascript
// Add to sa-engine/tests/e2e/custom-errors.js
import { ErrorRecoveryTester } from './framework/ErrorRecoveryTester.js';

const errorTester = new ErrorRecoveryTester();

// Inject custom error
await errorTester.errorInjector.injectCustomError('my_error_type', {
  duration: 5000,
  recovery: 'retry_with_fallback'
});

// Test recovery
const result = await errorTester.testCustomRecovery('my_error_type');
console.log('Recovery Test:', result);
```

## Automation Setup

### GitHub Actions

1. **Copy Workflow File**:
   ```bash
   mkdir -p .github/workflows
   cp sa-engine/tests/e2e/automation/github-actions.yml .github/workflows/integration-tests.yml
   ```

2. **Configure Secrets**:
   - `MCP_SERVER_URL`: WebSocket URL for MCP server
   - `API_KEYS`: Required API keys for testing

3. **Trigger Tests**:
   - Push to main/develop branches
   - Create pull requests
   - Daily scheduled runs (2 AM UTC)

### GitLab CI

1. **Copy Configuration**:
   ```bash
   cp sa-engine/tests/e2e/automation/gitlab-ci.yml .gitlab-ci.yml
   ```

2. **Configure Variables**:
   - `MCP_SERVER_URL`
   - `NODE_VERSION`
   - `TEST_TIMEOUT`

### Jenkins

1. **Copy Pipeline**:
   ```bash
   cp sa-engine/tests/e2e/automation/Jenkinsfile ./Jenkinsfile
   ```

2. **Configure Parameters**:
   - Test suite selection
   - Environment variables
   - Notification settings

### Local Automation

```bash
# Generate automation configs
node -e "
const { TestAutomation } = require('./sa-engine/tests/e2e/automation/TestAutomation.js');
const automation = new TestAutomation();
automation.generateConfigFiles('./automation-configs');
"

# Setup scheduled tests (cron)
crontab -e
# Add: 0 2 * * * cd /path/to/super-agents && npm run test:integration:ci
```

## Troubleshooting

### Common Issues

#### 1. MCP Server Connection Failed

**Symptoms**:
```
Error: MCP server not accessible at ws://localhost:3001
```

**Solutions**:
```bash
# Check if MCP server is running
lsof -i :3001

# Start MCP server
cd sa-engine/mcp-server
npm start

# Check server logs
tail -f sa-engine/mcp-server/logs/server.log

# Verify configuration
node -e "console.log(process.env.MCP_SERVER_URL)"
```

#### 2. Test Timeout Issues

**Symptoms**:
```
Error: Test timeout after 300000ms
```

**Solutions**:
```bash
# Increase timeout
TEST_TIMEOUT=600000 node sa-engine/tests/e2e/integration-test-runner.js

# Run single test for debugging
node sa-engine/tests/e2e/integration-test-runner.js --workflow-only

# Check system resources
top
df -h
```

#### 3. Memory Issues

**Symptoms**:
```
Error: JavaScript heap out of memory
```

**Solutions**:
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 sa-engine/tests/e2e/integration-test-runner.js

# Run tests sequentially
TEST_PARALLEL=false node sa-engine/tests/e2e/integration-test-runner.js

# Monitor memory usage
node --inspect sa-engine/tests/e2e/integration-test-runner.js
```

#### 4. IDE Integration Failures

**Symptoms**:
```
Error: Claude Code not found or not responding
```

**Solutions**:
```bash
# Verify IDE installation
which claude-code
which cursor
which code

# Check IDE paths in configuration
cat .env.test | grep _PATH

# Test IDE manually
claude-code --version
cursor --version
code --version
```

#### 5. Permission Errors

**Symptoms**:
```
Error: EACCES: permission denied
```

**Solutions**:
```bash
# Fix file permissions
chmod +x sa-engine/tests/e2e/integration-test-runner.js

# Fix directory permissions
chmod -R 755 sa-engine/tests/

# Create missing directories
mkdir -p sa-engine/tests/e2e/test-results
mkdir -p sa-engine/tests/e2e/temp
```

### Performance Issues

#### Slow Test Execution

1. **Enable Parallel Execution**:
   ```bash
   TEST_PARALLEL=true node sa-engine/tests/e2e/integration-test-runner.js
   ```

2. **Reduce Test Scope**:
   ```bash
   # Run only critical tests
   node sa-engine/tests/e2e/integration-test-runner.js --workflow-only
   ```

3. **Optimize System Resources**:
   ```bash
   # Close unnecessary applications
   # Ensure sufficient RAM available
   # Use SSD storage for better I/O
   ```

#### High Memory Usage

1. **Monitor Memory**:
   ```bash
   # Real-time monitoring
   watch -n 1 'ps aux | grep node'
   ```

2. **Enable Garbage Collection**:
   ```bash
   node --expose-gc sa-engine/tests/e2e/integration-test-runner.js
   ```

3. **Reduce Concurrency**:
   ```bash
   TEST_CONCURRENCY=5 node sa-engine/tests/e2e/integration-test-runner.js
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=sa:* node sa-engine/tests/e2e/integration-test-runner.js

# Enable specific debug categories
DEBUG=sa:test,sa:mcp node sa-engine/tests/e2e/integration-test-runner.js

# Save debug output
DEBUG=sa:* node sa-engine/tests/e2e/integration-test-runner.js 2>&1 | tee debug.log
```

### Getting Help

1. **Check Logs**:
   ```bash
   ls -la sa-engine/tests/e2e/test-results/
   cat sa-engine/tests/e2e/test-results/test-summary.md
   ```

2. **Generate Diagnostic Report**:
   ```bash
   node sa-engine/tests/e2e/diagnostics.js > diagnostic-report.txt
   ```

3. **Community Support**:
   - Create issue on GitHub with diagnostic report
   - Include system information and error logs
   - Specify steps to reproduce the issue

4. **Professional Support**:
   - Enterprise support available for critical deployments
   - Contact: support@super-agents.dev

## Best Practices

### Test Organization

- Run workflow tests first to validate core functionality
- Run IDE integration tests in isolated environments
- Schedule performance tests during low-usage periods
- Run error recovery tests in staging environments

### Continuous Integration

- Use matrix builds for multiple Node.js versions
- Separate test suites for faster feedback
- Cache dependencies for faster builds
- Archive test artifacts for debugging

### Monitoring

- Set up alerts for test failures
- Monitor performance trends over time
- Track error recovery effectiveness
- Measure IDE integration reliability

### Maintenance

- Regularly update test dependencies
- Review and update performance benchmarks
- Maintain test data and fixtures
- Update automation configurations

For more detailed troubleshooting, see [Troubleshooting Guide](./troubleshooting.md).
