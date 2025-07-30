import fs from 'fs/promises';
import path from 'path';

export class Logger {
  constructor(context = 'SuperAgents', options = {}) {
    this.context = context;
    this.level = options.level || process.env.SA_LOG_LEVEL || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[this.level] || this.levels.info;
    
    // Performance metrics storage
    this.metrics = {
      toolExecutions: new Map(),
      errorCounts: new Map(),
      performanceData: []
    };
    
    this.initializeLogDirectory();
  }

  async initializeLogDirectory() {
    if (this.enableFile) {
      try {
        await fs.mkdir(this.logDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create log directory:', error.message);
        this.enableFile = false;
      }
    }
  }

  log(level, message, data = {}) {
    if (this.levels[level] > this.currentLevel) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: this.context,
      message,
      data: this.sanitizeData(data),
      pid: process.pid
    };

    if (this.enableConsole) {
      this.logToConsole(logEntry);
    }

    if (this.enableFile) {
      this.logToFile(logEntry);
    }

    // Update metrics
    this.updateMetrics(level, message, data);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  logToConsole(logEntry) {
    const colorCodes = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m'  // Gray
    };
    
    const resetCode = '\x1b[0m';
    const color = colorCodes[logEntry.level] || '';
    
    const timestamp = logEntry.timestamp.substring(11, 19);
    const contextStr = `[${logEntry.context}]`;
    const levelStr = `${color}${logEntry.level}${resetCode}`;
    
    let output = `${timestamp} ${levelStr} ${contextStr} ${logEntry.message}`;
    
    if (Object.keys(logEntry.data).length > 0) {
      output += `\n${JSON.stringify(logEntry.data, null, 2)}`;
    }
    
    console.log(output);
  }

  async logToFile(logEntry) {
    try {
      const logFileName = `super-agents-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDir, logFileName);
      
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Check file size and rotate if necessary
      try {
        const stats = await fs.stat(logFilePath);
        if (stats.size > this.maxFileSize) {
          await this.rotateLogFile(logFilePath);
        }
      } catch (error) {
        // File doesn't exist yet, which is fine
      }
      
      await fs.appendFile(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async rotateLogFile(currentLogPath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = currentLogPath.replace('.log', `-${timestamp}.log`);
      
      await fs.rename(currentLogPath, rotatedPath);
      
      // Clean up old log files
      await this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to rotate log file:', error.message);
    }
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file)
        }));
      
      if (logFiles.length > this.maxFiles) {
        // Sort by creation time and remove oldest files
        const fileStats = await Promise.all(
          logFiles.map(async file => ({
            ...file,
            stats: await fs.stat(file.path)
          }))
        );
        
        fileStats.sort((a, b) => a.stats.mtime - b.stats.mtime);
        
        const filesToDelete = fileStats.slice(0, fileStats.length - this.maxFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          this.debug(`Deleted old log file: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error.message);
    }
  }

  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'apiKey', 'token', 'secret', 'key', 'auth'];
    
    function sanitizeObject(obj) {
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        }
      }
    }
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  updateMetrics(level, message, data) {
    // Track error counts
    if (level === 'error') {
      const errorType = data.errorType || 'UNKNOWN';
      const count = this.metrics.errorCounts.get(errorType) || 0;
      this.metrics.errorCounts.set(errorType, count + 1);
    }

    // Track tool executions
    if (data.toolName && data.executionTime) {
      const toolStats = this.metrics.toolExecutions.get(data.toolName) || {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        errors: 0
      };
      
      toolStats.count++;
      toolStats.totalTime += data.executionTime;
      toolStats.avgTime = toolStats.totalTime / toolStats.count;
      
      if (level === 'error') {
        toolStats.errors++;
      }
      
      this.metrics.toolExecutions.set(data.toolName, toolStats);
    }

    // Store performance data (keep last 1000 entries)
    if (data.performance) {
      this.metrics.performanceData.push({
        timestamp: new Date().toISOString(),
        ...data.performance
      });
      
      if (this.metrics.performanceData.length > 1000) {
        this.metrics.performanceData.shift();
      }
    }
  }

  logToolExecution(toolName, params, result, startTime) {
    const executionTime = Date.now() - startTime;
    const success = result && result.success !== false;
    
    const logData = {
      toolName,
      executionTime,
      success,
      paramCount: Object.keys(params || {}).length,
      resultSize: result ? JSON.stringify(result).length : 0
    };

    if (success) {
      this.info(`Tool executed successfully: ${toolName}`, logData);
    } else {
      this.error(`Tool execution failed: ${toolName}`, {
        ...logData,
        error: result?.error || 'Unknown error'
      });
    }

    // Log performance warning for slow tools
    if (executionTime > 10000) { // 10 seconds
      this.warn(`Slow tool execution: ${toolName} took ${executionTime}ms`, logData);
    }
  }

  logAgentActivity(agentName, activity, data = {}) {
    this.info(`Agent activity: ${agentName} - ${activity}`, {
      agent: agentName,
      activity,
      ...data
    });
  }

  logWorkflowProgress(workflowName, phase, progress, data = {}) {
    this.info(`Workflow progress: ${workflowName} - ${phase} (${progress}%)`, {
      workflow: workflowName,
      phase,
      progress,
      ...data
    });
  }

  generateMetricsReport() {
    const report = {
      timestamp: new Date().toISOString(),
      toolExecutions: Object.fromEntries(this.metrics.toolExecutions),
      errorCounts: Object.fromEntries(this.metrics.errorCounts),
      performanceSummary: this.generatePerformanceSummary(),
      systemHealth: this.generateSystemHealthMetrics()
    };

    this.info('Metrics report generated', { metricsReport: report });
    return report;
  }

  generatePerformanceSummary() {
    if (this.metrics.performanceData.length === 0) {
      return { message: 'No performance data available' };
    }

    const recent = this.metrics.performanceData.slice(-100); // Last 100 entries
    const avgMemory = recent.reduce((sum, entry) => sum + (entry.memoryUsage || 0), 0) / recent.length;
    const avgCPU = recent.reduce((sum, entry) => sum + (entry.cpuUsage || 0), 0) / recent.length;
    
    return {
      averageMemoryUsage: Math.round(avgMemory),
      averageCPUUsage: Math.round(avgCPU * 100) / 100,
      dataPoints: recent.length
    };
  }

  generateSystemHealthMetrics() {
    const totalExecutions = Array.from(this.metrics.toolExecutions.values())
      .reduce((sum, stats) => sum + stats.count, 0);
    
    const totalErrors = Array.from(this.metrics.errorCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    const errorRate = totalExecutions > 0 ? (totalErrors / totalExecutions) * 100 : 0;
    
    return {
      totalToolExecutions: totalExecutions,
      totalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      healthStatus: errorRate < 5 ? 'HEALTHY' : errorRate < 15 ? 'WARNING' : 'CRITICAL'
    };
  }

  async exportLogs(format = 'json', timeRange = null) {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      let allLogs = [];
      
      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line);
            
            // Apply time range filter if specified
            if (timeRange) {
              const logTime = new Date(logEntry.timestamp);
              if (logTime < timeRange.start || logTime > timeRange.end) {
                continue;
              }
            }
            
            allLogs.push(logEntry);
          } catch (parseError) {
            // Skip invalid log entries
          }
        }
      }
      
      // Sort by timestamp
      allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      if (format === 'csv') {
        return this.convertLogsToCSV(allLogs);
      }
      
      return JSON.stringify(allLogs, null, 2);
    } catch (error) {
      this.error('Failed to export logs', { error: error.message });
      throw error;
    }
  }

  convertLogsToCSV(logs) {
    if (logs.length === 0) {
      return 'timestamp,level,context,message,data\n';
    }
    
    const headers = ['timestamp', 'level', 'context', 'message', 'data'];
    const csvLines = [headers.join(',')];
    
    for (const log of logs) {
      const row = [
        log.timestamp,
        log.level,
        log.context,
        `"${log.message.replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.data).replace(/"/g, '""')}"`
      ];
      csvLines.push(row.join(','));
    }
    
    return csvLines.join('\n');
  }

  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
      this.currentLevel = this.levels[level];
      this.info(`Log level changed to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}. Available levels: ${Object.keys(this.levels).join(', ')}`);
    }
  }

  getMetrics() {
    return {
      toolExecutions: Object.fromEntries(this.metrics.toolExecutions),
      errorCounts: Object.fromEntries(this.metrics.errorCounts),
      performanceData: this.metrics.performanceData.slice(-10) // Last 10 entries
    };
  }

  clearMetrics() {
    this.metrics.toolExecutions.clear();
    this.metrics.errorCounts.clear();
    this.metrics.performanceData = [];
    this.info('Metrics cleared');
  }
}