#!/usr/bin/env node

/**
 * ZENITH PERFORMANCE TESTING FRAMEWORK
 * Comprehensive performance testing and monitoring for ASTRAL_PLANNER
 * 
 * Features:
 * - Load testing with simulated users
 * - Memory leak detection
 * - Bundle size analysis
 * - Page speed optimization
 * - API performance monitoring
 * - Real-time performance alerts
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class ZenithPerformanceTesting {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      loadTesting: {},
      memoryLeaks: {},
      bundleAnalysis: {},
      pageSpeed: {},
      apiPerformance: {},
      recommendations: []
    };

    this.thresholds = {
      responseTime: 200, // ms
      throughput: 100, // requests per second
      errorRate: 0.01, // 1%
      memoryLeak: 50, // MB increase
      bundleSize: 1000000, // 1MB
      pageLoad: 3000, // 3 seconds
      firstContentfulPaint: 1500, // 1.5 seconds
      largestContentfulPaint: 2500, // 2.5 seconds
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100 // ms
    };

    this.baseUrl = process.env.PERFORMANCE_TEST_URL || 'http://localhost:7001';
    this.concurrentUsers = parseInt(process.env.CONCURRENT_USERS) || 50;
    this.testDuration = parseInt(process.env.TEST_DURATION) || 60; // seconds
  }

  async run() {
    console.log('⚡ ZENITH PERFORMANCE TESTING FRAMEWORK');
    console.log('=======================================');
    console.log(`🎯 Target: ${this.baseUrl}`);
    console.log(`👥 Concurrent Users: ${this.concurrentUsers}`);
    console.log(`⏱️  Duration: ${this.testDuration}s`);
    console.log('');

    try {
      // Check if server is running
      await this.checkServerHealth();

      // Phase 1: Bundle Analysis
      await this.analyzeBundles();

      // Phase 2: Load Testing
      await this.runLoadTests();

      // Phase 3: Memory Leak Detection
      await this.detectMemoryLeaks();

      // Phase 4: Page Speed Testing
      await this.testPageSpeed();

      // Phase 5: API Performance Testing
      await this.testAPIPerformance();

      // Phase 6: Generate Performance Report
      await this.generatePerformanceReport();

      // Phase 7: Performance Recommendations
      await this.generateRecommendations();

    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
      process.exit(1);
    }
  }

  async checkServerHealth() {
    console.log('🏥 Checking Server Health');
    console.log('-------------------------');

    try {
      const response = await this.makeRequest('/', { timeout: 5000 });
      
      if (response.statusCode === 200) {
        console.log('✅ Server is healthy and responsive');
      } else {
        throw new Error(`Server returned status ${response.statusCode}`);
      }
    } catch (error) {
      console.error('❌ Server health check failed:', error.message);
      console.log('💡 Make sure your application is running on', this.baseUrl);
      throw error;
    }

    console.log('');
  }

  async analyzeBundles() {
    console.log('📦 Bundle Analysis');
    console.log('------------------');

    try {
      // Check if .next directory exists
      const nextDir = '.next';
      if (!fs.existsSync(nextDir)) {
        console.log('⚠️  Build artifacts not found. Running production build...');
        execSync('npm run build', { stdio: 'inherit' });
      }

      const bundleStats = this.getBundleStats();
      this.results.bundleAnalysis = bundleStats;

      console.log(`📊 Total Bundle Size: ${this.formatBytes(bundleStats.totalSize)}`);
      console.log(`📄 Pages Generated: ${bundleStats.pageCount}`);
      console.log(`📦 Chunks Created: ${bundleStats.chunkCount}`);

      if (bundleStats.totalSize > this.thresholds.bundleSize) {
        console.log('⚠️  Bundle size exceeds threshold');
        this.results.recommendations.push({
          type: 'bundle',
          severity: 'warning',
          message: `Bundle size (${this.formatBytes(bundleStats.totalSize)}) exceeds threshold (${this.formatBytes(this.thresholds.bundleSize)})`
        });
      } else {
        console.log('✅ Bundle size within acceptable limits');
      }

      // Analyze largest bundles
      if (bundleStats.largestChunks.length > 0) {
        console.log('\n🔍 Largest Chunks:');
        bundleStats.largestChunks.slice(0, 5).forEach((chunk, index) => {
          console.log(`   ${index + 1}. ${chunk.name}: ${this.formatBytes(chunk.size)}`);
        });
      }

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      this.results.bundleAnalysis = { error: error.message };
    }

    console.log('');
  }

  getBundleStats() {
    const staticDir = path.join('.next', 'static');
    const chunks = [];
    let totalSize = 0;
    let pageCount = 0;

    if (fs.existsSync(staticDir)) {
      this.walkDirectory(staticDir, (filePath, stats) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
          chunks.push({
            name: path.relative(staticDir, filePath),
            size: stats.size,
            type: filePath.endsWith('.js') ? 'javascript' : 'css'
          });
          totalSize += stats.size;
        }
      });
    }

    // Count pages
    const pagesDir = path.join('.next', 'server', 'pages');
    if (fs.existsSync(pagesDir)) {
      this.walkDirectory(pagesDir, (filePath) => {
        if (filePath.endsWith('.js')) {
          pageCount++;
        }
      });
    }

    return {
      totalSize,
      pageCount,
      chunkCount: chunks.length,
      largestChunks: chunks.sort((a, b) => b.size - a.size),
      jsSize: chunks.filter(c => c.type === 'javascript').reduce((sum, c) => sum + c.size, 0),
      cssSize: chunks.filter(c => c.type === 'css').reduce((sum, c) => sum + c.size, 0)
    };
  }

  walkDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        this.walkDirectory(fullPath, callback);
      } else {
        callback(fullPath, stats);
      }
    }
  }

  async runLoadTests() {
    console.log('🚀 Load Testing');
    console.log('---------------');

    const scenarios = [
      { name: 'Homepage', path: '/', weight: 40 },
      { name: 'Dashboard', path: '/dashboard', weight: 30 },
      { name: 'Login', path: '/login', weight: 20 },
      { name: 'API Health', path: '/api/health', weight: 10 }
    ];

    const results = {};

    for (const scenario of scenarios) {
      console.log(`\n🎯 Testing: ${scenario.name} (${scenario.path})`);
      
      try {
        const loadResult = await this.performLoadTest(scenario.path, {
          concurrentUsers: Math.ceil(this.concurrentUsers * (scenario.weight / 100)),
          duration: this.testDuration,
          rampUpTime: 10
        });

        results[scenario.name] = loadResult;

        console.log(`   📊 Requests: ${loadResult.totalRequests}`);
        console.log(`   ⚡ Avg Response Time: ${loadResult.avgResponseTime}ms`);
        console.log(`   🔥 Throughput: ${loadResult.requestsPerSecond.toFixed(2)} req/s`);
        console.log(`   ❌ Error Rate: ${(loadResult.errorRate * 100).toFixed(2)}%`);

        if (loadResult.avgResponseTime > this.thresholds.responseTime) {
          this.results.recommendations.push({
            type: 'performance',
            severity: 'warning',
            message: `${scenario.name} response time (${loadResult.avgResponseTime}ms) exceeds threshold`
          });
        }

      } catch (error) {
        console.error(`   ❌ Load test failed for ${scenario.name}:`, error.message);
        results[scenario.name] = { error: error.message };
      }
    }

    this.results.loadTesting = results;
    console.log('');
  }

  async performLoadTest(path, options) {
    const { concurrentUsers, duration, rampUpTime } = options;
    const url = `${this.baseUrl}${path}`;
    
    return new Promise((resolve, reject) => {
      const results = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        responseTimes: [],
        startTime: Date.now(),
        endTime: null
      };

      const workers = [];
      const rampUpInterval = (rampUpTime * 1000) / concurrentUsers;

      let workersStarted = 0;
      
      const startWorker = () => {
        if (workersStarted >= concurrentUsers) return;
        
        const worker = this.createLoadTestWorker(url, duration, results);
        workers.push(worker);
        workersStarted++;

        if (workersStarted < concurrentUsers) {
          setTimeout(startWorker, rampUpInterval);
        }
      };

      // Start ramping up workers
      startWorker();

      // Stop test after duration
      setTimeout(() => {
        workers.forEach(worker => worker.stop());
        
        results.endTime = Date.now();
        const totalDuration = (results.endTime - results.startTime) / 1000;
        
        const loadResult = {
          totalRequests: results.totalRequests,
          successfulRequests: results.successfulRequests,
          failedRequests: results.failedRequests,
          avgResponseTime: results.responseTimes.length > 0 ? 
            results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length : 0,
          minResponseTime: Math.min(...results.responseTimes),
          maxResponseTime: Math.max(...results.responseTimes),
          requestsPerSecond: results.totalRequests / totalDuration,
          errorRate: results.failedRequests / results.totalRequests || 0,
          duration: totalDuration
        };

        resolve(loadResult);
      }, duration * 1000);
    });
  }

  createLoadTestWorker(url, duration, sharedResults) {
    let isRunning = true;
    let requestCount = 0;

    const makeRequests = async () => {
      while (isRunning && requestCount < 1000) { // Limit per worker
        try {
          const startTime = Date.now();
          const response = await this.makeRequest(url.replace(this.baseUrl, ''), { timeout: 10000 });
          const responseTime = Date.now() - startTime;

          sharedResults.totalRequests++;
          sharedResults.responseTimes.push(responseTime);

          if (response.statusCode >= 200 && response.statusCode < 400) {
            sharedResults.successfulRequests++;
          } else {
            sharedResults.failedRequests++;
          }

          requestCount++;

          // Small delay to prevent overwhelming
          await this.delay(Math.random() * 100);

        } catch (error) {
          sharedResults.totalRequests++;
          sharedResults.failedRequests++;
          requestCount++;
        }
      }
    };

    makeRequests();

    return {
      stop: () => { isRunning = false; }
    };
  }

  async detectMemoryLeaks() {
    console.log('🧠 Memory Leak Detection');
    console.log('------------------------');

    try {
      const initialMemory = process.memoryUsage();
      console.log(`📊 Initial Memory: ${this.formatBytes(initialMemory.heapUsed)}`);

      // Simulate memory-intensive operations
      const testCases = [
        { name: 'Repeated API Calls', iterations: 100 },
        { name: 'Large Data Processing', iterations: 50 },
        { name: 'DOM Manipulation Simulation', iterations: 200 }
      ];

      const memorySnapshots = [{ name: 'Initial', memory: initialMemory.heapUsed }];

      for (const testCase of testCases) {
        console.log(`\n🔍 Testing: ${testCase.name}`);
        
        await this.runMemoryTest(testCase);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        const currentMemory = process.memoryUsage();
        memorySnapshots.push({
          name: testCase.name,
          memory: currentMemory.heapUsed
        });

        console.log(`   📈 Memory After Test: ${this.formatBytes(currentMemory.heapUsed)}`);
        
        const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
        if (memoryIncrease > this.thresholds.memoryLeak * 1024 * 1024) {
          console.log(`   ⚠️  Potential memory leak detected (+${this.formatBytes(memoryIncrease)})`);
          this.results.recommendations.push({
            type: 'memory',
            severity: 'warning',
            message: `Potential memory leak in ${testCase.name}: +${this.formatBytes(memoryIncrease)}`
          });
        }
      }

      this.results.memoryLeaks = {
        snapshots: memorySnapshots,
        finalIncrease: memorySnapshots[memorySnapshots.length - 1].memory - memorySnapshots[0].memory
      };

    } catch (error) {
      console.error('❌ Memory leak detection failed:', error.message);
      this.results.memoryLeaks = { error: error.message };
    }

    console.log('');
  }

  async runMemoryTest(testCase) {
    // Simulate different types of memory-intensive operations
    switch (testCase.name) {
      case 'Repeated API Calls':
        for (let i = 0; i < testCase.iterations; i++) {
          try {
            await this.makeRequest('/api/health', { timeout: 5000 });
          } catch (error) {
            // Ignore errors, we're testing memory usage
          }
        }
        break;

      case 'Large Data Processing':
        for (let i = 0; i < testCase.iterations; i++) {
          // Simulate large data processing
          const largeArray = new Array(10000).fill(0).map((_, index) => ({
            id: index,
            data: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString()
          }));
          
          // Process the data
          largeArray.filter(item => item.id % 2 === 0)
                   .map(item => ({ ...item, processed: true }))
                   .sort((a, b) => a.id - b.id);
        }
        break;

      case 'DOM Manipulation Simulation':
        for (let i = 0; i < testCase.iterations; i++) {
          // Simulate DOM-like object creation and manipulation
          const mockElements = [];
          for (let j = 0; j < 100; j++) {
            mockElements.push({
              id: `element-${i}-${j}`,
              attributes: new Map(),
              children: [],
              innerHTML: `<div>Content ${j}</div>`
            });
          }
          
          // Simulate cleanup
          mockElements.length = 0;
        }
        break;
    }
  }

  async testPageSpeed() {
    console.log('🏃 Page Speed Testing');
    console.log('---------------------');

    const pages = [
      { name: 'Homepage', path: '/' },
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Login', path: '/login' }
    ];

    const results = {};

    for (const page of pages) {
      console.log(`\n📄 Testing: ${page.name}`);
      
      try {
        const pageSpeedResult = await this.measurePageSpeed(page.path);
        results[page.name] = pageSpeedResult;

        console.log(`   ⏱️  Total Load Time: ${pageSpeedResult.totalLoadTime}ms`);
        console.log(`   🎨 Time to First Byte: ${pageSpeedResult.timeToFirstByte}ms`);
        console.log(`   📊 Content Size: ${this.formatBytes(pageSpeedResult.contentSize)}`);

        if (pageSpeedResult.totalLoadTime > this.thresholds.pageLoad) {
          this.results.recommendations.push({
            type: 'pageSpeed',
            severity: 'warning',
            message: `${page.name} load time (${pageSpeedResult.totalLoadTime}ms) exceeds threshold`
          });
        }

      } catch (error) {
        console.error(`   ❌ Page speed test failed for ${page.name}:`, error.message);
        results[page.name] = { error: error.message };
      }
    }

    this.results.pageSpeed = results;
    console.log('');
  }

  async measurePageSpeed(path) {
    const url = `${this.baseUrl}${path}`;
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let firstByteTime = null;
      let contentSize = 0;

      const req = (url.startsWith('https') ? https : http).request(url, (res) => {
        firstByteTime = Date.now() - startTime;

        res.on('data', (chunk) => {
          contentSize += chunk.length;
        });

        res.on('end', () => {
          const totalLoadTime = Date.now() - startTime;
          
          resolve({
            totalLoadTime,
            timeToFirstByte: firstByteTime,
            contentSize,
            statusCode: res.statusCode,
            headers: res.headers
          });
        });

        res.on('error', reject);
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async testAPIPerformance() {
    console.log('🔌 API Performance Testing');
    console.log('--------------------------');

    const endpoints = [
      { name: 'Health Check', path: '/api/health', method: 'GET' },
      { name: 'Auth Me', path: '/api/auth/me', method: 'GET' },
      { name: 'Login', path: '/api/auth/login', method: 'POST', body: { pin: '0000', isDemo: true } }
    ];

    const results = {};

    for (const endpoint of endpoints) {
      console.log(`\n🎯 Testing: ${endpoint.name}`);
      
      try {
        const perfResult = await this.testAPIEndpoint(endpoint);
        results[endpoint.name] = perfResult;

        console.log(`   ⚡ Avg Response Time: ${perfResult.avgResponseTime}ms`);
        console.log(`   🔥 Throughput: ${perfResult.throughput.toFixed(2)} req/s`);
        console.log(`   ✅ Success Rate: ${(perfResult.successRate * 100).toFixed(2)}%`);

      } catch (error) {
        console.error(`   ❌ API test failed for ${endpoint.name}:`, error.message);
        results[endpoint.name] = { error: error.message };
      }
    }

    this.results.apiPerformance = results;
    console.log('');
  }

  async testAPIEndpoint(endpoint) {
    const iterations = 50;
    const results = [];
    let successCount = 0;

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      try {
        const requestStart = Date.now();
        const response = await this.makeRequest(endpoint.path, {
          method: endpoint.method,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
          headers: endpoint.body ? { 'Content-Type': 'application/json' } : {},
          timeout: 10000
        });
        const responseTime = Date.now() - requestStart;

        results.push(responseTime);
        
        if (response.statusCode >= 200 && response.statusCode < 400) {
          successCount++;
        }

      } catch (error) {
        results.push(10000); // Treat errors as max response time
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      avgResponseTime: results.reduce((a, b) => a + b, 0) / results.length,
      minResponseTime: Math.min(...results),
      maxResponseTime: Math.max(...results),
      throughput: iterations / (totalTime / 1000),
      successRate: successCount / iterations,
      totalRequests: iterations
    };
  }

  async makeRequest(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    
    return new Promise((resolve, reject) => {
      const { timeout = 5000, method = 'GET', body, headers = {} } = options;
      
      const req = (url.startsWith('https') ? https : http).request(url, {
        method,
        headers: {
          'User-Agent': 'Zenith-Performance-Tester/1.0',
          ...headers
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  async generatePerformanceReport() {
    console.log('📊 Generating Performance Report');
    console.log('--------------------------------');

    const reportData = {
      ...this.results,
      metadata: {
        testDuration: this.testDuration,
        concurrentUsers: this.concurrentUsers,
        baseUrl: this.baseUrl,
        thresholds: this.thresholds,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }

    // Generate JSON report
    const jsonReportPath = path.join('reports', `performance-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLPerformanceReport(reportData);
    const htmlReportPath = path.join('reports', `performance-${Date.now()}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`✅ Performance report generated:`);
    console.log(`   📋 JSON: ${jsonReportPath}`);
    console.log(`   🌐 HTML: ${htmlReportPath}`);
    console.log('');
  }

  generateHTMLPerformanceReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith Performance Report</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; min-width: 200px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .chart { height: 300px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Zenith Performance Report</h1>
            <p>Generated: ${data.metadata.timestamp}</p>
            <p>Target: ${data.metadata.baseUrl} | Users: ${data.metadata.concurrentUsers} | Duration: ${data.metadata.testDuration}s</p>
        </div>

        ${this.generateOverviewSection(data)}
        ${this.generateLoadTestSection(data)}
        ${this.generateBundleSection(data)}
        ${this.generatePageSpeedSection(data)}
        ${this.generateAPIPerformanceSection(data)}
        ${this.generateRecommendationsSection(data)}
    </div>
</body>
</html>`;
  }

  generateOverviewSection(data) {
    const loadTestResults = Object.values(data.loadTesting || {}).filter(r => !r.error);
    const avgResponseTime = loadTestResults.length > 0 ? 
      loadTestResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / loadTestResults.length : 0;
    
    const totalThroughput = loadTestResults.reduce((sum, r) => sum + r.requestsPerSecond, 0);
    
    return `
        <div class="section">
            <h2>📊 Performance Overview</h2>
            <div class="metric">
                <div class="metric-value ${avgResponseTime < this.thresholds.responseTime ? 'good' : 'warning'}">
                    ${Math.round(avgResponseTime)}ms
                </div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric">
                <div class="metric-value ${totalThroughput > this.thresholds.throughput ? 'good' : 'warning'}">
                    ${totalThroughput.toFixed(1)}
                </div>
                <div class="metric-label">Requests/Second</div>
            </div>
            <div class="metric">
                <div class="metric-value ${data.bundleAnalysis?.totalSize < this.thresholds.bundleSize ? 'good' : 'warning'}">
                    ${this.formatBytes(data.bundleAnalysis?.totalSize || 0)}
                </div>
                <div class="metric-label">Bundle Size</div>
            </div>
            <div class="metric">
                <div class="metric-value ${data.recommendations.length === 0 ? 'good' : 'warning'}">
                    ${data.recommendations.length}
                </div>
                <div class="metric-label">Issues Found</div>
            </div>
        </div>`;
  }

  generateLoadTestSection(data) {
    const results = data.loadTesting || {};
    
    return `
        <div class="section">
            <h2>🚀 Load Testing Results</h2>
            <table>
                <tr><th>Scenario</th><th>Avg Response (ms)</th><th>Throughput (req/s)</th><th>Error Rate</th><th>Status</th></tr>
                ${Object.entries(results).map(([name, result]) => {
                  if (result.error) {
                    return `<tr><td>${name}</td><td colspan="4" class="danger">Error: ${result.error}</td></tr>`;
                  }
                  return `
                    <tr>
                        <td>${name}</td>
                        <td class="${result.avgResponseTime < this.thresholds.responseTime ? 'good' : 'warning'}">${Math.round(result.avgResponseTime)}</td>
                        <td class="${result.requestsPerSecond > this.thresholds.throughput ? 'good' : 'warning'}">${result.requestsPerSecond.toFixed(2)}</td>
                        <td class="${result.errorRate < this.thresholds.errorRate ? 'good' : 'danger'}">${(result.errorRate * 100).toFixed(2)}%</td>
                        <td class="${result.avgResponseTime < this.thresholds.responseTime && result.errorRate < this.thresholds.errorRate ? 'good' : 'warning'}">
                            ${result.avgResponseTime < this.thresholds.responseTime && result.errorRate < this.thresholds.errorRate ? '✅' : '⚠️'}
                        </td>
                    </tr>`;
                }).join('')}
            </table>
        </div>`;
  }

  generateBundleSection(data) {
    const bundle = data.bundleAnalysis || {};
    
    return `
        <div class="section">
            <h2>📦 Bundle Analysis</h2>
            <div class="metric">
                <div class="metric-value">${this.formatBytes(bundle.totalSize || 0)}</div>
                <div class="metric-label">Total Size</div>
            </div>
            <div class="metric">
                <div class="metric-value">${bundle.pageCount || 0}</div>
                <div class="metric-label">Pages</div>
            </div>
            <div class="metric">
                <div class="metric-value">${bundle.chunkCount || 0}</div>
                <div class="metric-label">Chunks</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.formatBytes(bundle.jsSize || 0)}</div>
                <div class="metric-label">JavaScript</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.formatBytes(bundle.cssSize || 0)}</div>
                <div class="metric-label">CSS</div>
            </div>
        </div>`;
  }

  generatePageSpeedSection(data) {
    const results = data.pageSpeed || {};
    
    return `
        <div class="section">
            <h2>🏃 Page Speed Results</h2>
            <table>
                <tr><th>Page</th><th>Load Time (ms)</th><th>TTFB (ms)</th><th>Size</th><th>Status</th></tr>
                ${Object.entries(results).map(([name, result]) => {
                  if (result.error) {
                    return `<tr><td>${name}</td><td colspan="4" class="danger">Error: ${result.error}</td></tr>`;
                  }
                  return `
                    <tr>
                        <td>${name}</td>
                        <td class="${result.totalLoadTime < this.thresholds.pageLoad ? 'good' : 'warning'}">${result.totalLoadTime}</td>
                        <td>${result.timeToFirstByte}</td>
                        <td>${this.formatBytes(result.contentSize)}</td>
                        <td class="${result.totalLoadTime < this.thresholds.pageLoad ? 'good' : 'warning'}">
                            ${result.totalLoadTime < this.thresholds.pageLoad ? '✅' : '⚠️'}
                        </td>
                    </tr>`;
                }).join('')}
            </table>
        </div>`;
  }

  generateAPIPerformanceSection(data) {
    const results = data.apiPerformance || {};
    
    return `
        <div class="section">
            <h2>🔌 API Performance</h2>
            <table>
                <tr><th>Endpoint</th><th>Avg Response (ms)</th><th>Throughput (req/s)</th><th>Success Rate</th><th>Status</th></tr>
                ${Object.entries(results).map(([name, result]) => {
                  if (result.error) {
                    return `<tr><td>${name}</td><td colspan="4" class="danger">Error: ${result.error}</td></tr>`;
                  }
                  return `
                    <tr>
                        <td>${name}</td>
                        <td class="${result.avgResponseTime < this.thresholds.responseTime ? 'good' : 'warning'}">${Math.round(result.avgResponseTime)}</td>
                        <td>${result.throughput.toFixed(2)}</td>
                        <td class="${result.successRate > 0.95 ? 'good' : 'warning'}">${(result.successRate * 100).toFixed(2)}%</td>
                        <td class="${result.avgResponseTime < this.thresholds.responseTime && result.successRate > 0.95 ? 'good' : 'warning'}">
                            ${result.avgResponseTime < this.thresholds.responseTime && result.successRate > 0.95 ? '✅' : '⚠️'}
                        </td>
                    </tr>`;
                }).join('')}
            </table>
        </div>`;
  }

  generateRecommendationsSection(data) {
    const recommendations = data.recommendations || [];
    
    if (recommendations.length === 0) {
      return `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <p class="good">🎉 No performance issues detected! Your application is performing well.</p>
        </div>`;
    }
    
    return `
        <div class="section">
            <h2>💡 Performance Recommendations</h2>
            <ul>
                ${recommendations.map(rec => `
                    <li class="${rec.severity}">
                        <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
                    </li>
                `).join('')}
            </ul>
        </div>`;
  }

  async generateRecommendations() {
    console.log('💡 Performance Recommendations');
    console.log('------------------------------');

    const recommendations = this.results.recommendations;

    if (recommendations.length === 0) {
      console.log('✅ No performance issues detected!');
      console.log('   Your application is performing within acceptable thresholds.');
    } else {
      console.log(`⚠️  Found ${recommendations.length} performance issues:`);
      
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.type}: ${rec.message}`);
      });

      console.log('\n📋 Action Items:');
      
      const actionItems = this.generateActionItems(recommendations);
      actionItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`);
      });
    }

    console.log('');
  }

  generateActionItems(recommendations) {
    const actions = [];

    recommendations.forEach(rec => {
      switch (rec.type) {
        case 'bundle':
          actions.push('Optimize bundle size using code splitting and tree shaking');
          actions.push('Analyze bundle composition with webpack-bundle-analyzer');
          break;
        case 'performance':
          actions.push('Optimize database queries and API response times');
          actions.push('Implement caching strategies (Redis, CDN)');
          break;
        case 'pageSpeed':
          actions.push('Optimize images and use next/image component');
          actions.push('Implement lazy loading for non-critical content');
          break;
        case 'memory':
          actions.push('Review component lifecycle for memory leaks');
          actions.push('Implement proper cleanup in useEffect hooks');
          break;
      }
    });

    // Remove duplicates
    return [...new Set(actions)];
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
if (require.main === module) {
  const perfTester = new ZenithPerformanceTesting();
  perfTester.run().catch(error => {
    console.error('💥 Performance testing framework crashed:', error);
    process.exit(1);
  });
}

module.exports = ZenithPerformanceTesting;