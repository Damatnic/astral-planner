/**
 * ZENITH PERFORMANCE TESTING - Lighthouse Automated Audits
 * Comprehensive performance testing with Core Web Vitals
 */
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 90,
  'first-contentful-paint': 1.8,
  'largest-contentful-paint': 2.5,
  'cumulative-layout-shift': 0.1,
  'total-blocking-time': 300,
  'speed-index': 3.4,
};

// Test URLs
const TEST_URLS = [
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Goals', url: '/goals' },
  { name: 'Habits', url: '/habits' },
  { name: 'Settings', url: '/settings' },
  { name: 'Analytics', url: '/analytics' },
];

class ZenithPerformanceTester {
  constructor(baseUrl = 'http://localhost:3099') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.chrome = null;
  }

  async initialize() {
    console.log('🚀 Initializing Zenith Performance Testing Suite...');
    
    this.chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    console.log(`✅ Chrome launched on port ${this.chrome.port}`);
  }

  async runLighthouseAudit(url, pageName) {
    console.log(`🔍 Running Lighthouse audit for ${pageName} (${url})`);

    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: this.chrome.port,
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
    };

    try {
      const runnerResult = await lighthouse(url, options);
      const report = runnerResult.report;
      const results = JSON.parse(report);

      return this.processLighthouseResults(results, pageName);
    } catch (error) {
      console.error(`❌ Error running audit for ${pageName}:`, error.message);
      return null;
    }
  }

  processLighthouseResults(results, pageName) {
    const { categories, audits } = results;
    
    const processedResults = {
      pageName,
      url: results.requestedUrl,
      timestamp: new Date().toISOString(),
      scores: {
        performance: Math.round(categories.performance.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        bestPractices: Math.round(categories['best-practices'].score * 100),
        seo: Math.round(categories.seo.score * 100),
      },
      metrics: {
        firstContentfulPaint: audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: audits['largest-contentful-paint'].numericValue,
        cumulativeLayoutShift: audits['cumulative-layout-shift'].numericValue,
        totalBlockingTime: audits['total-blocking-time'].numericValue,
        speedIndex: audits['speed-index'].numericValue,
        timeToInteractive: audits['interactive'].numericValue,
      },
      opportunities: this.extractOpportunities(audits),
      diagnostics: this.extractDiagnostics(audits),
    };

    return processedResults;
  }

  extractOpportunities(audits) {
    const opportunityAudits = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'offscreen-images',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'duplicated-javascript',
    ];

    return opportunityAudits
      .filter(auditId => audits[auditId] && audits[auditId].score < 1)
      .map(auditId => ({
        id: auditId,
        title: audits[auditId].title,
        description: audits[auditId].description,
        score: audits[auditId].score,
        numericValue: audits[auditId].numericValue,
        displayValue: audits[auditId].displayValue,
      }));
  }

  extractDiagnostics(audits) {
    const diagnosticAudits = [
      'server-response-time',
      'dom-size',
      'critical-request-chains',
      'main-thread-tasks',
      'bootup-time',
      'uses-rel-preconnect',
      'font-display',
    ];

    return diagnosticAudits
      .filter(auditId => audits[auditId])
      .map(auditId => ({
        id: auditId,
        title: audits[auditId].title,
        description: audits[auditId].description,
        score: audits[auditId].score,
        numericValue: audits[auditId].numericValue,
        displayValue: audits[auditId].displayValue,
      }));
  }

  async runAllAudits() {
    console.log('📊 Running comprehensive performance audits...');
    
    for (const testCase of TEST_URLS) {
      const fullUrl = `${this.baseUrl}${testCase.url}`;
      const result = await this.runLighthouseAudit(fullUrl, testCase.name);
      
      if (result) {
        this.results.push(result);
        this.logResults(result);
      }
    }
  }

  logResults(result) {
    console.log(`\n📈 Performance Results for ${result.pageName}:`);
    console.log(`   Performance Score: ${result.scores.performance}/100`);
    console.log(`   Accessibility Score: ${result.scores.accessibility}/100`);
    console.log(`   Best Practices Score: ${result.scores.bestPractices}/100`);
    console.log(`   SEO Score: ${result.scores.seo}/100`);
    console.log(`   First Contentful Paint: ${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`   Largest Contentful Paint: ${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`   Cumulative Layout Shift: ${result.metrics.cumulativeLayoutShift.toFixed(3)}`);
    console.log(`   Total Blocking Time: ${result.metrics.totalBlockingTime.toFixed(0)}ms`);
    
    // Check against thresholds
    this.checkThresholds(result);
  }

  checkThresholds(result) {
    const failures = [];

    if (result.scores.performance < PERFORMANCE_THRESHOLDS.performance) {
      failures.push(`Performance score ${result.scores.performance} below threshold ${PERFORMANCE_THRESHOLDS.performance}`);
    }

    if (result.scores.accessibility < PERFORMANCE_THRESHOLDS.accessibility) {
      failures.push(`Accessibility score ${result.scores.accessibility} below threshold ${PERFORMANCE_THRESHOLDS.accessibility}`);
    }

    if (result.metrics.firstContentfulPaint / 1000 > PERFORMANCE_THRESHOLDS['first-contentful-paint']) {
      failures.push(`FCP ${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s exceeds threshold ${PERFORMANCE_THRESHOLDS['first-contentful-paint']}s`);
    }

    if (result.metrics.largestContentfulPaint / 1000 > PERFORMANCE_THRESHOLDS['largest-contentful-paint']) {
      failures.push(`LCP ${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s exceeds threshold ${PERFORMANCE_THRESHOLDS['largest-contentful-paint']}s`);
    }

    if (result.metrics.cumulativeLayoutShift > PERFORMANCE_THRESHOLDS['cumulative-layout-shift']) {
      failures.push(`CLS ${result.metrics.cumulativeLayoutShift.toFixed(3)} exceeds threshold ${PERFORMANCE_THRESHOLDS['cumulative-layout-shift']}`);
    }

    if (failures.length > 0) {
      console.log(`\n⚠️  Performance Issues for ${result.pageName}:`);
      failures.forEach(failure => console.log(`   ❌ ${failure}`));
    } else {
      console.log(`\n✅ All performance thresholds met for ${result.pageName}`);
    }
  }

  async generateReport() {
    console.log('\n📝 Generating comprehensive performance report...');

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        baseUrl: this.baseUrl,
        testCount: this.results.length,
        thresholds: PERFORMANCE_THRESHOLDS,
      },
      summary: this.generateSummary(),
      results: this.results,
      recommendations: this.generateRecommendations(),
    };

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'reports');
    try {
      await fs.access(reportsDir);
    } catch {
      await fs.mkdir(reportsDir, { recursive: true });
    }

    // Save detailed JSON report
    const jsonReportPath = path.join(reportsDir, `lighthouse-performance-${Date.now()}.json`);
    await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReportPath = path.join(reportsDir, `lighthouse-performance-${Date.now()}.html`);
    await this.generateHtmlReport(report, htmlReportPath);

    console.log(`📄 Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);

    return report;
  }

  generateSummary() {
    const summary = {
      averageScores: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
      },
      averageMetrics: {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        totalBlockingTime: 0,
        speedIndex: 0,
      },
      passedThresholds: 0,
      totalThresholds: 0,
    };

    if (this.results.length === 0) return summary;

    // Calculate averages
    this.results.forEach(result => {
      summary.averageScores.performance += result.scores.performance;
      summary.averageScores.accessibility += result.scores.accessibility;
      summary.averageScores.bestPractices += result.scores.bestPractices;
      summary.averageScores.seo += result.scores.seo;

      summary.averageMetrics.firstContentfulPaint += result.metrics.firstContentfulPaint;
      summary.averageMetrics.largestContentfulPaint += result.metrics.largestContentfulPaint;
      summary.averageMetrics.cumulativeLayoutShift += result.metrics.cumulativeLayoutShift;
      summary.averageMetrics.totalBlockingTime += result.metrics.totalBlockingTime;
      summary.averageMetrics.speedIndex += result.metrics.speedIndex;
    });

    const count = this.results.length;
    Object.keys(summary.averageScores).forEach(key => {
      summary.averageScores[key] = Math.round(summary.averageScores[key] / count);
    });

    Object.keys(summary.averageMetrics).forEach(key => {
      summary.averageMetrics[key] = summary.averageMetrics[key] / count;
    });

    // Count threshold passes
    this.results.forEach(result => {
      summary.totalThresholds += 5; // 5 main thresholds per page
      
      if (result.scores.performance >= PERFORMANCE_THRESHOLDS.performance) summary.passedThresholds++;
      if (result.scores.accessibility >= PERFORMANCE_THRESHOLDS.accessibility) summary.passedThresholds++;
      if (result.metrics.firstContentfulPaint / 1000 <= PERFORMANCE_THRESHOLDS['first-contentful-paint']) summary.passedThresholds++;
      if (result.metrics.largestContentfulPaint / 1000 <= PERFORMANCE_THRESHOLDS['largest-contentful-paint']) summary.passedThresholds++;
      if (result.metrics.cumulativeLayoutShift <= PERFORMANCE_THRESHOLDS['cumulative-layout-shift']) summary.passedThresholds++;
    });

    summary.thresholdPassRate = summary.totalThresholds > 0 ? 
      Math.round((summary.passedThresholds / summary.totalThresholds) * 100) : 0;

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];
    const allOpportunities = this.results.flatMap(result => result.opportunities);
    
    // Count frequency of each optimization opportunity
    const opportunityCount = {};
    allOpportunities.forEach(opp => {
      opportunityCount[opp.id] = (opportunityCount[opp.id] || 0) + 1;
    });

    // Sort by frequency and impact
    const prioritizedOpportunities = Object.entries(opportunityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    prioritizedOpportunities.forEach(([opportunityId, count]) => {
      const example = allOpportunities.find(opp => opp.id === opportunityId);
      if (example) {
        recommendations.push({
          id: opportunityId,
          title: example.title,
          description: example.description,
          affectedPages: count,
          priority: count >= this.results.length * 0.5 ? 'High' : 'Medium',
        });
      }
    });

    return recommendations;
  }

  async generateHtmlReport(report, filePath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith Performance Report - ${new Date(report.metadata.timestamp).toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #3498db; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; font-size: 0.9em; }
        .score-good { color: #27ae60; }
        .score-average { color: #f39c12; }
        .score-poor { color: #e74c3c; }
        .page-results { margin: 20px 0; }
        .page-card { background: #fff; border: 1px solid #ecf0f1; border-radius: 6px; margin: 10px 0; padding: 20px; }
        .page-title { font-size: 1.2em; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .scores { display: flex; gap: 15px; flex-wrap: wrap; }
        .score { text-align: center; padding: 10px; border-radius: 4px; background: #f8f9fa; min-width: 80px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .priority-high { border-left: 4px solid #e74c3c; }
        .priority-medium { border-left: 4px solid #f39c12; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Zenith Performance Report</h1>
        <p><strong>Generated:</strong> ${new Date(report.metadata.timestamp).toLocaleString()}</p>
        <p><strong>Base URL:</strong> ${report.metadata.baseUrl}</p>
        <p><strong>Pages Tested:</strong> ${report.metadata.testCount}</p>
        
        <h2>📊 Performance Summary</h2>
        <div class="summary">
            <div class="metric-card">
                <div class="metric-value score-${this.getScoreClass(report.summary.averageScores.performance)}">${report.summary.averageScores.performance}</div>
                <div class="metric-label">Average Performance Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value score-${this.getScoreClass(report.summary.averageScores.accessibility)}">${report.summary.averageScores.accessibility}</div>
                <div class="metric-label">Average Accessibility Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(report.summary.averageMetrics.firstContentfulPaint / 1000).toFixed(2)}s</div>
                <div class="metric-label">Average First Contentful Paint</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.thresholdPassRate}%</div>
                <div class="metric-label">Threshold Pass Rate</div>
            </div>
        </div>

        <h2>📋 Page Results</h2>
        ${report.results.map(result => `
            <div class="page-card">
                <div class="page-title">${result.pageName}</div>
                <div class="scores">
                    <div class="score">
                        <div class="metric-value score-${this.getScoreClass(result.scores.performance)}">${result.scores.performance}</div>
                        <div class="metric-label">Performance</div>
                    </div>
                    <div class="score">
                        <div class="metric-value score-${this.getScoreClass(result.scores.accessibility)}">${result.scores.accessibility}</div>
                        <div class="metric-label">Accessibility</div>
                    </div>
                    <div class="score">
                        <div class="metric-value">${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s</div>
                        <div class="metric-label">FCP</div>
                    </div>
                    <div class="score">
                        <div class="metric-value">${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s</div>
                        <div class="metric-label">LCP</div>
                    </div>
                    <div class="score">
                        <div class="metric-value">${result.metrics.cumulativeLayoutShift.toFixed(3)}</div>
                        <div class="metric-label">CLS</div>
                    </div>
                </div>
            </div>
        `).join('')}

        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            ${report.recommendations.map(rec => `
                <div class="recommendation priority-${rec.priority.toLowerCase()}">
                    <strong>${rec.title}</strong> (${rec.priority} Priority)
                    <br><small>Affects ${rec.affectedPages} page(s)</small>
                    <p>${rec.description}</p>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(filePath, html);
  }

  getScoreClass(score) {
    if (score >= 90) return 'good';
    if (score >= 70) return 'average';
    return 'poor';
  }

  async cleanup() {
    if (this.chrome) {
      await this.chrome.kill();
      console.log('🧹 Chrome instance cleaned up');
    }
  }
}

// Main execution
async function runZenithPerformanceTests() {
  const tester = new ZenithPerformanceTester();
  
  try {
    await tester.initialize();
    await tester.runAllAudits();
    const report = await tester.generateReport();
    
    console.log('\n🎉 Zenith Performance Testing Complete!');
    console.log(`📈 Overall Performance: ${report.summary.averageScores.performance}/100`);
    console.log(`♿ Overall Accessibility: ${report.summary.averageScores.accessibility}/100`);
    console.log(`🎯 Threshold Pass Rate: ${report.summary.thresholdPassRate}%`);
    
    // Exit with appropriate code
    const success = report.summary.thresholdPassRate >= 80;
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runZenithPerformanceTests();
}

module.exports = { ZenithPerformanceTester, runZenithPerformanceTests };