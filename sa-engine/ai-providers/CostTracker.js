import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * CostTracker - Comprehensive cost tracking and token usage monitoring for AI providers
 * Tracks usage, calculates costs, manages budgets, and provides analytics
 */
export default class CostTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Storage settings
      persistData: options.persistData !== false,
      dataFile: options.dataFile || '.super-agents/cost-tracker.json',
      
      // Budget settings
      enableBudgetAlerts: options.enableBudgetAlerts !== false,
      dailyBudgetLimit: options.dailyBudgetLimit || null,
      monthlyBudgetLimit: options.monthlyBudgetLimit || null,
      budgetAlertThresholds: options.budgetAlertThresholds || [0.5, 0.8, 0.9, 1.0],
      
      // Reporting settings
      enableReporting: options.enableReporting !== false,
      reportingInterval: options.reportingInterval || 24 * 60 * 60 * 1000, // 24 hours
      
      // Currency settings
      currency: options.currency || 'USD',
      currencySymbol: options.currencySymbol || '$',
      
      // Logging
      enableLogging: options.enableLogging !== false,
      logLevel: options.logLevel || 'info',
      
      ...options
    };

    // Usage tracking data
    this.usage = {
      providers: new Map(), // provider -> usage data
      daily: new Map(),     // date -> daily totals
      monthly: new Map(),   // month -> monthly totals
      operations: new Map(), // operation type -> usage data
      models: new Map()     // model -> usage data
    };

    // Budget tracking
    this.budgets = {
      daily: {
        limit: this.options.dailyBudgetLimit,
        spent: 0,
        remaining: this.options.dailyBudgetLimit || 0,
        alertsSent: new Set()
      },
      monthly: {
        limit: this.options.monthlyBudgetLimit,
        spent: 0,
        remaining: this.options.monthlyBudgetLimit || 0,
        alertsSent: new Set()
      }
    };

    // Reporting
    this.reportingTimer = null;
    this.lastReportTime = null;

    this.log('CostTracker initialized', { options: this.options });
    this.initialize();
  }

  /**
   * Initialize cost tracker
   */
  async initialize() {
    try {
      // Load persisted data
      if (this.options.persistData) {
        await this.loadData();
      }

      // Start reporting timer
      if (this.options.enableReporting) {
        this.startReporting();
      }

      this.log('CostTracker initialization complete');

    } catch (error) {
      this.log('Failed to initialize CostTracker', { error: error.message }, 'error');
      throw error;
    }
  }

  /**
   * Track usage for an operation
   * @param {Object} usage - Usage information
   */
  async trackUsage(usage) {
    try {
      const {
        provider,
        model,
        operation = 'unknown',
        promptTokens = 0,
        completionTokens = 0,
        totalTokens = 0,
        cost = 0,
        duration = 0,
        success = true,
        metadata = {}
      } = usage;

      const timestamp = new Date();
      const dateKey = this.getDateKey(timestamp);
      const monthKey = this.getMonthKey(timestamp);

      // Create usage record
      const usageRecord = {
        timestamp: timestamp.toISOString(),
        provider,
        model,
        operation,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        duration,
        success,
        metadata
      };

      // Track by provider
      this.updateProviderUsage(provider, usageRecord);

      // Track by model
      this.updateModelUsage(model, usageRecord);

      // Track by operation
      this.updateOperationUsage(operation, usageRecord);

      // Track daily totals
      this.updateDailyUsage(dateKey, usageRecord);

      // Track monthly totals
      this.updateMonthlyUsage(monthKey, usageRecord);

      // Update budget tracking
      this.updateBudgetUsage(cost, timestamp);

      // Check budget alerts
      if (this.options.enableBudgetAlerts && cost > 0) {
        await this.checkBudgetAlerts();
      }

      // Emit usage event
      this.emit('usageTracked', usageRecord);

      // Persist data if enabled
      if (this.options.persistData) {
        await this.saveData();
      }

      this.log('Usage tracked', {
        provider,
        model,
        operation,
        cost: this.formatCurrency(cost),
        tokens: totalTokens
      }, 'debug');

    } catch (error) {
      this.log('Failed to track usage', { error: error.message, usage }, 'error');
      this.emit('trackingError', { error, usage });
    }
  }

  /**
   * Update provider usage statistics
   * @param {string} provider - Provider name
   * @param {Object} record - Usage record
   */
  updateProviderUsage(provider, record) {
    if (!this.usage.providers.has(provider)) {
      this.usage.providers.set(provider, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalCost: 0,
        totalDuration: 0,
        avgTokensPerRequest: 0,
        avgCostPerRequest: 0,
        avgDuration: 0,
        successRate: 0,
        firstUsed: record.timestamp,
        lastUsed: record.timestamp,
        operations: new Map()
      });
    }

    const providerData = this.usage.providers.get(provider);
    
    providerData.totalRequests++;
    if (record.success) {
      providerData.successfulRequests++;
    } else {
      providerData.failedRequests++;
    }
    
    providerData.totalTokens += record.totalTokens;
    providerData.promptTokens += record.promptTokens;
    providerData.completionTokens += record.completionTokens;
    providerData.totalCost += record.cost;
    providerData.totalDuration += record.duration;
    providerData.lastUsed = record.timestamp;

    // Update averages
    providerData.avgTokensPerRequest = providerData.totalTokens / providerData.totalRequests;
    providerData.avgCostPerRequest = providerData.totalCost / providerData.totalRequests;
    providerData.avgDuration = providerData.totalDuration / providerData.totalRequests;
    providerData.successRate = providerData.successfulRequests / providerData.totalRequests;

    // Track operations within provider
    if (!providerData.operations.has(record.operation)) {
      providerData.operations.set(record.operation, {
        count: 0,
        totalTokens: 0,
        totalCost: 0,
        avgCost: 0
      });
    }
    
    const opData = providerData.operations.get(record.operation);
    opData.count++;
    opData.totalTokens += record.totalTokens;
    opData.totalCost += record.cost;
    opData.avgCost = opData.totalCost / opData.count;
  }

  /**
   * Update model usage statistics
   * @param {string} model - Model name
   * @param {Object} record - Usage record
   */
  updateModelUsage(model, record) {
    if (!model) return;

    if (!this.usage.models.has(model)) {
      this.usage.models.set(model, {
        provider: record.provider,
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgTokensPerRequest: 0,
        avgCostPerRequest: 0,
        firstUsed: record.timestamp,
        lastUsed: record.timestamp
      });
    }

    const modelData = this.usage.models.get(model);
    
    modelData.totalRequests++;
    modelData.totalTokens += record.totalTokens;
    modelData.totalCost += record.cost;
    modelData.lastUsed = record.timestamp;

    // Update averages
    modelData.avgTokensPerRequest = modelData.totalTokens / modelData.totalRequests;
    modelData.avgCostPerRequest = modelData.totalCost / modelData.totalRequests;
  }

  /**
   * Update operation usage statistics
   * @param {string} operation - Operation type
   * @param {Object} record - Usage record
   */
  updateOperationUsage(operation, record) {
    if (!this.usage.operations.has(operation)) {
      this.usage.operations.set(operation, {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        providers: new Map()
      });
    }

    const opData = this.usage.operations.get(operation);
    
    opData.totalRequests++;
    opData.totalTokens += record.totalTokens;
    opData.totalCost += record.cost;

    // Track by provider within operation
    if (!opData.providers.has(record.provider)) {
      opData.providers.set(record.provider, {
        count: 0,
        totalCost: 0
      });
    }
    
    const providerOpData = opData.providers.get(record.provider);
    providerOpData.count++;
    providerOpData.totalCost += record.cost;
  }

  /**
   * Update daily usage totals
   * @param {string} dateKey - Date key (YYYY-MM-DD)
   * @param {Object} record - Usage record
   */
  updateDailyUsage(dateKey, record) {
    if (!this.usage.daily.has(dateKey)) {
      this.usage.daily.set(dateKey, {
        date: dateKey,
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        providers: new Map()
      });
    }

    const dailyData = this.usage.daily.get(dateKey);
    
    dailyData.totalRequests++;
    dailyData.totalTokens += record.totalTokens;
    dailyData.totalCost += record.cost;

    // Track by provider within day
    if (!dailyData.providers.has(record.provider)) {
      dailyData.providers.set(record.provider, {
        requests: 0,
        tokens: 0,
        cost: 0
      });
    }
    
    const providerDailyData = dailyData.providers.get(record.provider);
    providerDailyData.requests++;
    providerDailyData.tokens += record.totalTokens;
    providerDailyData.cost += record.cost;
  }

  /**
   * Update monthly usage totals
   * @param {string} monthKey - Month key (YYYY-MM)
   * @param {Object} record - Usage record
   */
  updateMonthlyUsage(monthKey, record) {
    if (!this.usage.monthly.has(monthKey)) {
      this.usage.monthly.set(monthKey, {
        month: monthKey,
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        providers: new Map()
      });
    }

    const monthlyData = this.usage.monthly.get(monthKey);
    
    monthlyData.totalRequests++;
    monthlyData.totalTokens += record.totalTokens;
    monthlyData.totalCost += record.cost;

    // Track by provider within month
    if (!monthlyData.providers.has(record.provider)) {
      monthlyData.providers.set(record.provider, {
        requests: 0,
        tokens: 0,
        cost: 0
      });
    }
    
    const providerMonthlyData = monthlyData.providers.get(record.provider);
    providerMonthlyData.requests++;
    providerMonthlyData.tokens += record.totalTokens;
    providerMonthlyData.cost += record.cost;
  }

  /**
   * Update budget usage
   * @param {number} cost - Cost to add
   * @param {Date} timestamp - Timestamp of usage
   */
  updateBudgetUsage(cost, timestamp) {
    if (cost <= 0) return;

    const dateKey = this.getDateKey(timestamp);
    const monthKey = this.getMonthKey(timestamp);
    const today = this.getDateKey(new Date());
    const thisMonth = this.getMonthKey(new Date());

    // Update daily budget if it's today
    if (dateKey === today && this.budgets.daily.limit) {
      this.budgets.daily.spent += cost;
      this.budgets.daily.remaining = Math.max(0, this.budgets.daily.limit - this.budgets.daily.spent);
    }

    // Update monthly budget if it's this month
    if (monthKey === thisMonth && this.budgets.monthly.limit) {
      this.budgets.monthly.spent += cost;
      this.budgets.monthly.remaining = Math.max(0, this.budgets.monthly.limit - this.budgets.monthly.spent);
    }
  }

  /**
   * Check budget alerts
   */
  async checkBudgetAlerts() {
    // Check daily budget alerts
    if (this.budgets.daily.limit && this.budgets.daily.limit > 0) {
      const dailyUsageRatio = this.budgets.daily.spent / this.budgets.daily.limit;
      
      for (const threshold of this.options.budgetAlertThresholds) {
        const alertKey = `daily-${threshold}`;
        
        if (dailyUsageRatio >= threshold && !this.budgets.daily.alertsSent.has(alertKey)) {
          this.budgets.daily.alertsSent.add(alertKey);
          
          await this.sendBudgetAlert('daily', threshold, {
            spent: this.budgets.daily.spent,
            limit: this.budgets.daily.limit,
            remaining: this.budgets.daily.remaining,
            percentage: Math.round(dailyUsageRatio * 100)
          });
        }
      }
    }

    // Check monthly budget alerts
    if (this.budgets.monthly.limit && this.budgets.monthly.limit > 0) {
      const monthlyUsageRatio = this.budgets.monthly.spent / this.budgets.monthly.limit;
      
      for (const threshold of this.options.budgetAlertThresholds) {
        const alertKey = `monthly-${threshold}`;
        
        if (monthlyUsageRatio >= threshold && !this.budgets.monthly.alertsSent.has(alertKey)) {
          this.budgets.monthly.alertsSent.add(alertKey);
          
          await this.sendBudgetAlert('monthly', threshold, {
            spent: this.budgets.monthly.spent,
            limit: this.budgets.monthly.limit,
            remaining: this.budgets.monthly.remaining,
            percentage: Math.round(monthlyUsageRatio * 100)
          });
        }
      }
    }
  }

  /**
   * Send budget alert
   * @param {string} period - Budget period (daily/monthly)
   * @param {number} threshold - Alert threshold
   * @param {Object} data - Budget data
   */
  async sendBudgetAlert(period, threshold, data) {
    const alert = {
      type: 'budget_alert',
      period,
      threshold,
      timestamp: new Date().toISOString(),
      ...data
    };

    this.log(`Budget alert: ${period} budget ${data.percentage}% used`, {
      spent: this.formatCurrency(data.spent),
      limit: this.formatCurrency(data.limit),
      remaining: this.formatCurrency(data.remaining)
    }, 'warn');

    this.emit('budgetAlert', alert);
  }

  /**
   * Get usage statistics
   * @param {Object} options - Query options
   * @returns {Object} Usage statistics
   */
  getUsageStats(options = {}) {
    const {
      provider = null,
      dateRange = null,
      operation = null,
      model = null
    } = options;

    let stats = {
      summary: {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgCostPerRequest: 0,
        avgTokensPerRequest: 0
      },
      providers: {},
      models: {},
      operations: {},
      daily: {},
      monthly: {},
      budgets: this.getBudgetStatus()
    };

    // Filter and aggregate provider stats
    for (const [providerName, data] of this.usage.providers) {
      if (provider && provider !== providerName) continue;
      
      stats.providers[providerName] = {
        ...data,
        operations: Object.fromEntries(data.operations)
      };
      
      stats.summary.totalRequests += data.totalRequests;
      stats.summary.totalTokens += data.totalTokens;
      stats.summary.totalCost += data.totalCost;
    }

    // Model stats
    for (const [modelName, data] of this.usage.models) {
      if (model && model !== modelName) continue;
      stats.models[modelName] = data;
    }

    // Operation stats
    for (const [operationName, data] of this.usage.operations) {
      if (operation && operation !== operationName) continue;
      stats.operations[operationName] = {
        ...data,
        providers: Object.fromEntries(data.providers)
      };
    }

    // Daily stats (filtered by date range if provided)
    for (const [date, data] of this.usage.daily) {
      if (dateRange && !this.isDateInRange(date, dateRange)) continue;
      stats.daily[date] = {
        ...data,
        providers: Object.fromEntries(data.providers)
      };
    }

    // Monthly stats
    for (const [month, data] of this.usage.monthly) {
      stats.monthly[month] = {
        ...data,
        providers: Object.fromEntries(data.providers)
      };
    }

    // Calculate summary averages
    if (stats.summary.totalRequests > 0) {
      stats.summary.avgCostPerRequest = stats.summary.totalCost / stats.summary.totalRequests;
      stats.summary.avgTokensPerRequest = stats.summary.totalTokens / stats.summary.totalRequests;
    }

    return stats;
  }

  /**
   * Get budget status
   * @returns {Object} Budget status
   */
  getBudgetStatus() {
    const today = this.getDateKey(new Date());
    const thisMonth = this.getMonthKey(new Date());

    // Reset daily budget if it's a new day
    if (this.lastBudgetResetDate !== today) {
      this.budgets.daily.spent = this.usage.daily.get(today)?.totalCost || 0;
      this.budgets.daily.remaining = this.budgets.daily.limit ? 
        Math.max(0, this.budgets.daily.limit - this.budgets.daily.spent) : 0;
      this.budgets.daily.alertsSent.clear();
      this.lastBudgetResetDate = today;
    }

    // Reset monthly budget if it's a new month
    if (this.lastBudgetResetMonth !== thisMonth) {
      this.budgets.monthly.spent = this.usage.monthly.get(thisMonth)?.totalCost || 0;
      this.budgets.monthly.remaining = this.budgets.monthly.limit ? 
        Math.max(0, this.budgets.monthly.limit - this.budgets.monthly.spent) : 0;
      this.budgets.monthly.alertsSent.clear();
      this.lastBudgetResetMonth = thisMonth;
    }

    return {
      daily: {
        ...this.budgets.daily,
        alertsSent: Array.from(this.budgets.daily.alertsSent)
      },
      monthly: {
        ...this.budgets.monthly,
        alertsSent: Array.from(this.budgets.monthly.alertsSent)
      }
    };
  }

  /**
   * Set budget limits
   * @param {Object} budgets - Budget configuration
   */
  setBudgets(budgets) {
    if (budgets.daily !== undefined) {
      this.budgets.daily.limit = budgets.daily;
      this.options.dailyBudgetLimit = budgets.daily;
    }
    
    if (budgets.monthly !== undefined) {
      this.budgets.monthly.limit = budgets.monthly;
      this.options.monthlyBudgetLimit = budgets.monthly;
    }

    this.log('Budget limits updated', {
      daily: this.formatCurrency(this.budgets.daily.limit),
      monthly: this.formatCurrency(this.budgets.monthly.limit)
    });

    this.emit('budgetsUpdated', {
      daily: this.budgets.daily.limit,
      monthly: this.budgets.monthly.limit
    });
  }

  /**
   * Generate cost report
   * @param {Object} options - Report options
   * @returns {Object} Cost report
   */
  generateReport(options = {}) {
    const {
      period = 'monthly',
      format = 'summary'
    } = options;

    const stats = this.getUsageStats();
    const report = {
      generatedAt: new Date().toISOString(),
      period,
      format,
      ...stats
    };

    // Add period-specific insights
    if (period === 'daily') {
      report.insights = this.generateDailyInsights(stats);
    } else if (period === 'monthly') {
      report.insights = this.generateMonthlyInsights(stats);
    }

    this.emit('reportGenerated', report);
    return report;
  }

  /**
   * Generate daily insights
   * @param {Object} stats - Usage statistics
   * @returns {Object} Daily insights
   */
  generateDailyInsights(stats) {
    const today = this.getDateKey(new Date());
    const todayStats = stats.daily[today];
    
    if (!todayStats) {
      return { message: 'No usage data for today' };
    }

    const mostUsedProvider = Object.entries(todayStats.providers)
      .reduce((max, [provider, data]) => 
        data.cost > (max.data?.cost || 0) ? { provider, data } : max, {});

    return {
      todaySpent: this.formatCurrency(todayStats.totalCost),
      todayTokens: todayStats.totalTokens,
      todayRequests: todayStats.totalRequests,
      mostUsedProvider: mostUsedProvider.provider,
      budgetUtilization: this.budgets.daily.limit ? 
        Math.round((this.budgets.daily.spent / this.budgets.daily.limit) * 100) : null
    };
  }

  /**
   * Generate monthly insights
   * @param {Object} stats - Usage statistics
   * @returns {Object} Monthly insights
   */
  generateMonthlyInsights(stats) {
    const thisMonth = this.getMonthKey(new Date());
    const monthStats = stats.monthly[thisMonth];
    
    if (!monthStats) {
      return { message: 'No usage data for this month' };
    }

    const mostCostEffectiveProvider = Object.entries(stats.providers)
      .reduce((min, [provider, data]) => 
        data.avgCostPerRequest < (min.data?.avgCostPerRequest || Infinity) ? 
          { provider, data } : min, {});

    return {
      monthSpent: this.formatCurrency(monthStats.totalCost),
      monthTokens: monthStats.totalTokens,
      monthRequests: monthStats.totalRequests,
      mostCostEffectiveProvider: mostCostEffectiveProvider.provider,
      avgCostPerRequest: this.formatCurrency(stats.summary.avgCostPerRequest),
      budgetUtilization: this.budgets.monthly.limit ? 
        Math.round((this.budgets.monthly.spent / this.budgets.monthly.limit) * 100) : null
    };
  }

  /**
   * Start automated reporting
   */
  startReporting() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }

    this.reportingTimer = setInterval(() => {
      const report = this.generateReport();
      this.emit('scheduledReport', report);
    }, this.options.reportingInterval);

    this.log('Automated reporting started', {
      interval: this.options.reportingInterval
    });
  }

  /**
   * Stop automated reporting
   */
  stopReporting() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
      this.log('Automated reporting stopped');
    }
  }

  /**
   * Save data to file
   */
  async saveData() {
    try {
      const dataDir = path.dirname(this.options.dataFile);
      await fs.mkdir(dataDir, { recursive: true });

      const data = {
        version: '1.0.0',
        savedAt: new Date().toISOString(),
        usage: {
          providers: Object.fromEntries(
            Array.from(this.usage.providers.entries()).map(([key, value]) => [
              key,
              {
                ...value,
                operations: Object.fromEntries(value.operations)
              }
            ])
          ),
          models: Object.fromEntries(this.usage.models),
          operations: Object.fromEntries(
            Array.from(this.usage.operations.entries()).map(([key, value]) => [
              key,
              {
                ...value,
                providers: Object.fromEntries(value.providers)
              }
            ])
          ),
          daily: Object.fromEntries(
            Array.from(this.usage.daily.entries()).map(([key, value]) => [
              key,
              {
                ...value,
                providers: Object.fromEntries(value.providers)
              }
            ])
          ),
          monthly: Object.fromEntries(
            Array.from(this.usage.monthly.entries()).map(([key, value]) => [
              key,
              {
                ...value,
                providers: Object.fromEntries(value.providers)
              }
            ])
          )
        },
        budgets: {
          daily: {
            ...this.budgets.daily,
            alertsSent: Array.from(this.budgets.daily.alertsSent)
          },
          monthly: {
            ...this.budgets.monthly,
            alertsSent: Array.from(this.budgets.monthly.alertsSent)
          }
        }
      };

      await fs.writeFile(this.options.dataFile, JSON.stringify(data, null, 2), 'utf8');
      
    } catch (error) {
      this.log('Failed to save cost tracking data', { error: error.message }, 'error');
    }
  }

  /**
   * Load data from file
   */
  async loadData() {
    try {
      const data = JSON.parse(await fs.readFile(this.options.dataFile, 'utf8'));
      
      // Restore usage data
      if (data.usage) {
        // Restore providers
        if (data.usage.providers) {
          for (const [key, value] of Object.entries(data.usage.providers)) {
            this.usage.providers.set(key, {
              ...value,
              operations: new Map(Object.entries(value.operations || {}))
            });
          }
        }

        // Restore models
        if (data.usage.models) {
          for (const [key, value] of Object.entries(data.usage.models)) {
            this.usage.models.set(key, value);
          }
        }

        // Restore operations
        if (data.usage.operations) {
          for (const [key, value] of Object.entries(data.usage.operations)) {
            this.usage.operations.set(key, {
              ...value,
              providers: new Map(Object.entries(value.providers || {}))
            });
          }
        }

        // Restore daily data
        if (data.usage.daily) {
          for (const [key, value] of Object.entries(data.usage.daily)) {
            this.usage.daily.set(key, {
              ...value,
              providers: new Map(Object.entries(value.providers || {}))
            });
          }
        }

        // Restore monthly data
        if (data.usage.monthly) {
          for (const [key, value] of Object.entries(data.usage.monthly)) {
            this.usage.monthly.set(key, {
              ...value,
              providers: new Map(Object.entries(value.providers || {}))
            });
          }
        }
      }

      // Restore budget data
      if (data.budgets) {
        if (data.budgets.daily) {
          this.budgets.daily = {
            ...this.budgets.daily,
            ...data.budgets.daily,
            alertsSent: new Set(data.budgets.daily.alertsSent || [])
          };
        }
        
        if (data.budgets.monthly) {
          this.budgets.monthly = {
            ...this.budgets.monthly,
            ...data.budgets.monthly,
            alertsSent: new Set(data.budgets.monthly.alertsSent || [])
          };
        }
      }

      this.log('Cost tracking data loaded successfully');
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.log('Failed to load cost tracking data', { error: error.message }, 'warn');
      }
    }
  }

  /**
   * Utility functions
   */
  getDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  getMonthKey(date) {
    return date.toISOString().substring(0, 7);
  }

  isDateInRange(date, range) {
    const { start, end } = range;
    return (!start || date >= start) && (!end || date <= end);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.options.currency,
      minimumFractionDigits: 4
    }).format(amount);
  }

  /**
   * Logging utility
   */
  log(message, data = {}, level = 'info') {
    if (!this.options.enableLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: 'CostTracker',
      level,
      message,
      ...data
    };
    
    this.emit('log', logEntry);
    
    if (level === 'error') {
      console.error(`[CostTracker] ERROR: ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[CostTracker] WARN: ${message}`, data);
    } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
      console.debug(`[CostTracker] DEBUG: ${message}`, data);
    } else if (level === 'info') {
      console.log(`[CostTracker] INFO: ${message}`, data);
    }
  }

  /**
   * Shutdown cost tracker
   */
  async shutdown() {
    this.log('Shutting down CostTracker');
    
    this.stopReporting();
    
    if (this.options.persistData) {
      await this.saveData();
    }
    
    this.emit('shutdown');
  }
}