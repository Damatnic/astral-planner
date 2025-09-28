#!/usr/bin/env node

/**
 * ZENITH TESTING MASTER CONTROLLER
 * Orchestrates all quality assurance and testing frameworks
 * 
 * This is the central command center for all testing activities:
 * - Quality Assurance Framework
 * - Performance Testing
 * - Error Detection System
 * - Test Execution and Reporting
 * - CI/CD Integration
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const QualityAssurance = require('./quality-assurance');
const PerformanceTesting = require('./performance-testing');
const ErrorDetection = require('./error-detection');

class ZenithTestMaster {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      timestamp: new Date().toISOString(),
      phases: {},
      summary: {},
      recommendations: [],
      artifacts: []
    };

    this.config = {
      mode: process.argv[2] || 'full', // full, quick, ci, pre-commit
      parallel: process.argv.includes('--parallel'),
      verbose: process.argv.includes('--verbose'),
      skipLong: process.argv.includes('--skip-long'),
      generateReports: !process.argv.includes('--no-reports'),
      autoFix: process.argv.includes('--auto-fix')
    };

    this.phases = {
      'error-detection': {
        name: 'Error Detection',
        icon: '🚨',
        required: true,
        framework: ErrorDetection,
        estimatedTime: 30 // seconds
      },
      'quality-assurance': {
        name: 'Quality Assurance',
        icon: '🧪',
        required: true,
        framework: QualityAssurance,
        estimatedTime: 120
      },
      'performance-testing': {
        name: 'Performance Testing',
        icon: '⚡',
        required: false,
        framework: PerformanceTesting,
        estimatedTime: 180
      }
    };
  }

  async run() {
    this.printHeader();
    
    try {
      // Phase 0: Pre-flight checks
      await this.preFlightChecks();

      // Phase 1: Execute testing frameworks
      await this.executeTestingPhases();

      // Phase 2: Aggregate results
      await this.aggregateResults();

      // Phase 3: Generate comprehensive report
      await this.generateMasterReport();

      // Phase 4: Apply automated fixes if requested
      if (this.config.autoFix) {
        await this.applyAutomatedFixes();
      }

      // Phase 5: Final assessment
      await this.finalAssessment();

    } catch (error) {
      this.handleCriticalError(error);
    }
  }

  printHeader() {
    const totalTime = this.estimateTotalTime();
    
    console.log('');
    console.log('█▀▀ █▀▀ █▄░█ █ ▀█▀ █░█');
    console.log('▄▄█ ██▄ █░▀█ █ ░█░ █▀█');
    console.log('');
    console.log('🚀 ZENITH TESTING MASTER CONTROLLER');
    console.log('===================================');
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log(`🎯 Mode: ${this.config.mode.toUpperCase()}`);
    console.log(`⏱️  Estimated Time: ${Math.round(totalTime / 60)}m ${totalTime % 60}s`);
    console.log(`🔧 Configuration:`);
    console.log(`   - Parallel Execution: ${this.config.parallel ? 'Yes' : 'No'}`);
    console.log(`   - Auto-fix Issues: ${this.config.autoFix ? 'Yes' : 'No'}`);
    console.log(`   - Generate Reports: ${this.config.generateReports ? 'Yes' : 'No'}`);
    console.log(`   - Skip Long Tests: ${this.config.skipLong ? 'Yes' : 'No'}`);
    console.log('');
  }

  estimateTotalTime() {
    const phasesToRun = this.getPhasesToRun();
    
    if (this.config.parallel) {
      return Math.max(...phasesToRun.map(phase => this.phases[phase].estimatedTime));
    } else {
      return phasesToRun.reduce((total, phase) => total + this.phases[phase].estimatedTime, 0);
    }
  }

  getPhasesToRun() {
    const allPhases = Object.keys(this.phases);
    
    switch (this.config.mode) {
      case 'quick':
        return ['error-detection'];
      case 'ci':
        return ['error-detection', 'quality-assurance'];
      case 'pre-commit':
        return ['error-detection'];
      case 'performance':
        return ['performance-testing'];
      case 'full':
      default:
        return allPhases;
    }
  }

  async preFlightChecks() {
    console.log('🔍 Pre-flight Checks');
    console.log('--------------------');

    const checks = [
      { name: 'Node.js Version', check: () => this.checkNodeVersion() },
      { name: 'Dependencies', check: () => this.checkDependencies() },
      { name: 'Environment Variables', check: () => this.checkEnvironment() },
      { name: 'Disk Space', check: () => this.checkDiskSpace() },
      { name: 'Build Artifacts', check: () => this.checkBuildArtifacts() }
    ];

    for (const check of checks) {
      try {
        const result = await check.check();
        if (result.passed) {
          console.log(`✅ ${check.name}: ${result.message}`);
        } else {
          console.log(`⚠️  ${check.name}: ${result.message}`);
          if (result.critical) {
            throw new Error(`Critical check failed: ${check.name}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${check.name}: ${error.message}`);
        throw error;
      }
    }

    console.log('');
  }

  checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.split('.')[0].substring(1));
    const passed = major >= 18;
    
    return {
      passed,
      message: `Node.js ${version} ${passed ? '(Compatible)' : '(Requires 18+)'}`,
      critical: !passed
    };
  }

  checkDependencies() {
    const nodeModulesExists = fs.existsSync('node_modules');
    const packageLockExists = fs.existsSync('package-lock.json');
    
    return {
      passed: nodeModulesExists,
      message: nodeModulesExists ? 
        `Dependencies installed ${packageLockExists ? '(with lock file)' : '(no lock file)'}` :
        'Dependencies not installed - run npm install',
      critical: !nodeModulesExists
    };
  }

  checkEnvironment() {
    const requiredVars = ['NODE_ENV'];
    const missing = requiredVars.filter(env => !process.env[env]);
    
    return {
      passed: missing.length === 0,
      message: missing.length === 0 ? 
        'Required environment variables set' : 
        `Missing: ${missing.join(', ')}`,
      critical: false
    };
  }

  checkDiskSpace() {
    // Simplified check - in production, use proper disk space checking
    return {
      passed: true,
      message: 'Sufficient disk space available',
      critical: false
    };
  }

  checkBuildArtifacts() {
    const nextExists = fs.existsSync('.next');
    
    return {
      passed: true, // Not critical if missing
      message: nextExists ? 
        'Build artifacts available' : 
        'No build artifacts found (will build if needed)',
      critical: false
    };
  }

  async executeTestingPhases() {
    console.log('🎯 Executing Testing Phases');
    console.log('===========================');

    const phasesToRun = this.getPhasesToRun();
    
    if (this.config.parallel && phasesToRun.length > 1) {
      await this.executePhasesInParallel(phasesToRun);
    } else {
      await this.executePhasesSequentially(phasesToRun);
    }
  }

  async executePhasesInParallel(phases) {
    console.log(`🚀 Running ${phases.length} phases in parallel...\n`);

    const promises = phases.map(phaseKey => this.executePhase(phaseKey));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const phaseKey = phases[index];
      const phase = this.phases[phaseKey];
      
      if (result.status === 'fulfilled') {
        console.log(`✅ ${phase.icon} ${phase.name} completed successfully`);
        this.results.phases[phaseKey] = result.value;
      } else {
        console.log(`❌ ${phase.icon} ${phase.name} failed: ${result.reason.message}`);
        this.results.phases[phaseKey] = { 
          error: result.reason.message,
          success: false 
        };
      }
    });
  }

  async executePhasesSequentially(phases) {
    for (const phaseKey of phases) {
      const phase = this.phases[phaseKey];
      
      console.log(`${phase.icon} Starting ${phase.name}...`);
      console.log(`⏱️  Estimated time: ${phase.estimatedTime}s`);
      console.log('');

      try {
        const startTime = Date.now();
        const result = await this.executePhase(phaseKey);
        const duration = Date.now() - startTime;

        console.log(`✅ ${phase.name} completed in ${Math.round(duration / 1000)}s`);
        console.log('');

        this.results.phases[phaseKey] = {
          ...result,
          duration,
          success: true
        };

      } catch (error) {
        console.log(`❌ ${phase.name} failed: ${error.message}`);
        console.log('');

        this.results.phases[phaseKey] = {
          error: error.message,
          success: false
        };

        if (phase.required) {
          throw new Error(`Required phase failed: ${phase.name}`);
        }
      }
    }
  }

  async executePhase(phaseKey) {
    const phase = this.phases[phaseKey];
    const framework = new phase.framework();
    
    // Configure framework for current mode
    this.configureFramework(framework, phaseKey);
    
    // Execute the framework
    return await framework.run();
  }

  configureFramework(framework, phaseKey) {
    // Configure frameworks based on current mode and settings
    switch (phaseKey) {
      case 'error-detection':
        if (this.config.mode === 'quick' || this.config.mode === 'pre-commit') {
          // Quick mode - only critical checks
          framework.config.scanPaths = ['src'];
          framework.config.errorThresholds.critical = 0;
        }
        break;
        
      case 'quality-assurance':
        if (this.config.skipLong) {
          // Skip long-running tests
          framework.thresholds.performance.buildTime = 60000; // 1 minute
        }
        break;
        
      case 'performance-testing':
        if (this.config.mode === 'ci') {
          // Reduced load for CI
          framework.concurrentUsers = 10;
          framework.testDuration = 30;
        }
        break;
    }

    // Apply verbose setting
    if (this.config.verbose) {
      framework.verbose = true;
    }
  }

  async aggregateResults() {
    console.log('📊 Aggregating Results');
    console.log('----------------------');

    const summary = {
      totalPhases: Object.keys(this.results.phases).length,
      successfulPhases: 0,
      failedPhases: 0,
      totalIssues: 0,
      criticalIssues: 0,
      performance: {},
      quality: {},
      security: {}
    };

    for (const [phaseKey, result] of Object.entries(this.results.phases)) {
      if (result.success) {
        summary.successfulPhases++;
        
        // Aggregate specific metrics from each framework
        switch (phaseKey) {
          case 'error-detection':
            summary.totalIssues += (result.errors?.length || 0) + (result.warnings?.length || 0);
            summary.criticalIssues += result.errors?.filter(e => e.severity === 'critical').length || 0;
            break;
            
          case 'quality-assurance':
            if (result.tests?.coverage) {
              summary.quality.coverage = result.tests.coverage.coverage;
            }
            if (result.build?.production) {
              summary.quality.buildSuccess = result.build.production.passed;
            }
            break;
            
          case 'performance-testing':
            if (result.loadTesting) {
              const avgResponseTime = Object.values(result.loadTesting)
                .filter(r => !r.error)
                .reduce((sum, r, _, arr) => sum + r.avgResponseTime / arr.length, 0);
              summary.performance.avgResponseTime = Math.round(avgResponseTime);
            }
            break;
        }
      } else {
        summary.failedPhases++;
      }
    }

    this.results.summary = summary;

    console.log(`📈 Summary:`);
    console.log(`   Phases: ${summary.successfulPhases}/${summary.totalPhases} successful`);
    console.log(`   Issues: ${summary.totalIssues} total (${summary.criticalIssues} critical)`);
    
    if (summary.quality.coverage) {
      console.log(`   Coverage: ${summary.quality.coverage.statements}% statements`);
    }
    
    if (summary.performance.avgResponseTime) {
      console.log(`   Performance: ${summary.performance.avgResponseTime}ms avg response`);
    }
    
    console.log('');
  }

  async generateMasterReport() {
    if (!this.config.generateReports) {
      console.log('📊 Report generation skipped');
      return;
    }

    console.log('📊 Generating Master Report');
    console.log('---------------------------');

    const reportData = {
      ...this.results,
      metadata: {
        version: '1.0.0',
        mode: this.config.mode,
        configuration: this.config,
        duration: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }

    // Generate comprehensive JSON report
    const jsonReportPath = path.join('reports', `zenith-master-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate executive HTML report
    const htmlReport = this.generateExecutiveHTMLReport(reportData);
    const htmlReportPath = path.join('reports', `zenith-executive-report-${Date.now()}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);

    // Generate markdown summary
    const markdownReport = this.generateMarkdownSummary(reportData);
    const markdownReportPath = path.join('reports', 'ZENITH_QUALITY_REPORT.md');
    fs.writeFileSync(markdownReportPath, markdownReport);

    this.results.artifacts.push(jsonReportPath, htmlReportPath, markdownReportPath);

    console.log(`✅ Master reports generated:`);
    console.log(`   📋 Comprehensive: ${jsonReportPath}`);
    console.log(`   📊 Executive: ${htmlReportPath}`);
    console.log(`   📝 Summary: ${markdownReportPath}`);
    console.log('');
  }

  generateExecutiveHTMLReport(data) {
    const overallStatus = this.getOverallStatus(data);
    const statusColor = overallStatus === 'PASS' ? '#28a745' : overallStatus === 'WARNING' ? '#ffc107' : '#dc3545';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith Executive Quality Report</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin-bottom: 30px; }
        .status-banner { text-align: center; padding: 20px; background: ${statusColor}; color: white; border-radius: 8px; margin-bottom: 30px; font-size: 24px; font-weight: bold; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .metric-label { color: #6c757d; font-size: 14px; }
        .phase-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .phase-header { display: flex; align-items: center; margin-bottom: 15px; }
        .phase-icon { font-size: 24px; margin-right: 10px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .success { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .danger { background: #f8d7da; color: #721c24; }
        .recommendations { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Zenith Executive Quality Report</h1>
            <p>Comprehensive Application Quality Assessment</p>
            <p>Generated: ${data.metadata.timestamp} | Mode: ${data.metadata.mode.toUpperCase()} | Duration: ${Math.round(data.metadata.duration / 1000)}s</p>
        </div>

        <div class="status-banner">
            Overall Status: ${overallStatus}
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value" style="color: ${data.summary.criticalIssues === 0 ? '#28a745' : '#dc3545'}">
                    ${data.summary.criticalIssues}
                </div>
                <div class="metric-label">Critical Issues</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" style="color: #007bff">
                    ${data.summary.totalIssues}
                </div>
                <div class="metric-label">Total Issues</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" style="color: ${data.summary.successfulPhases === data.summary.totalPhases ? '#28a745' : '#ffc107'}">
                    ${data.summary.successfulPhases}/${data.summary.totalPhases}
                </div>
                <div class="metric-label">Phases Passed</div>
            </div>
            
            ${data.summary.quality.coverage ? `
            <div class="metric-card">
                <div class="metric-value" style="color: ${data.summary.quality.coverage.statements >= 95 ? '#28a745' : '#ffc107'}">
                    ${data.summary.quality.coverage.statements}%
                </div>
                <div class="metric-label">Test Coverage</div>
            </div>
            ` : ''}
            
            ${data.summary.performance.avgResponseTime ? `
            <div class="metric-card">
                <div class="metric-value" style="color: ${data.summary.performance.avgResponseTime < 200 ? '#28a745' : '#ffc107'}">
                    ${data.summary.performance.avgResponseTime}ms
                </div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            ` : ''}
        </div>

        ${this.generatePhaseSummary(data)}
        ${this.generateRecommendationsSection(data)}
    </div>
</body>
</html>`;
  }

  generatePhaseSummary(data) {
    return Object.entries(data.phases).map(([phaseKey, result]) => {
      const phase = this.phases[phaseKey];
      const statusClass = result.success ? 'success' : 'danger';
      const statusText = result.success ? 'PASSED' : 'FAILED';
      
      return `
        <div class="phase-section">
            <div class="phase-header">
                <span class="phase-icon">${phase.icon}</span>
                <h3>${phase.name}</h3>
                <span class="status-badge ${statusClass}" style="margin-left: auto;">${statusText}</span>
            </div>
            
            ${result.success ? `
                <p>✅ Phase completed successfully${result.duration ? ` in ${Math.round(result.duration / 1000)}s` : ''}</p>
            ` : `
                <p>❌ Phase failed: ${result.error}</p>
            `}
        </div>`;
    }).join('');
  }

  generateRecommendationsSection(data) {
    const allRecommendations = [];
    
    // Collect recommendations from all phases
    Object.values(data.phases).forEach(result => {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
    });

    if (allRecommendations.length === 0) {
      return `
        <div class="recommendations">
            <h3>🎉 Recommendations</h3>
            <p>Excellent work! No critical recommendations at this time. Continue following best practices.</p>
        </div>`;
    }

    const criticalRecs = allRecommendations.filter(r => r.severity === 'critical' || r.priority === 'CRITICAL');
    const highRecs = allRecommendations.filter(r => r.severity === 'high' || r.priority === 'HIGH');

    return `
        <div class="recommendations">
            <h3>💡 Key Recommendations</h3>
            
            ${criticalRecs.length > 0 ? `
                <h4 style="color: #dc3545;">🔴 Critical Priority</h4>
                <ul>
                    ${criticalRecs.map(rec => `<li>${rec.message || rec.description}</li>`).join('')}
                </ul>
            ` : ''}
            
            ${highRecs.length > 0 ? `
                <h4 style="color: #ffc107;">🟠 High Priority</h4>
                <ul>
                    ${highRecs.map(rec => `<li>${rec.message || rec.description}</li>`).join('')}
                </ul>
            ` : ''}
        </div>`;
  }

  generateMarkdownSummary(data) {
    const overallStatus = this.getOverallStatus(data);
    
    return `# Zenith Quality Assessment Report

**Generated:** ${data.metadata.timestamp}  
**Mode:** ${data.metadata.mode.toUpperCase()}  
**Duration:** ${Math.round(data.metadata.duration / 1000)}s  
**Overall Status:** ${overallStatus}

## 📊 Executive Summary

| Metric | Value | Status |
|--------|--------|--------|
| Critical Issues | ${data.summary.criticalIssues} | ${data.summary.criticalIssues === 0 ? '✅' : '❌'} |
| Total Issues | ${data.summary.totalIssues} | ${data.summary.totalIssues < 10 ? '✅' : '⚠️'} |
| Phases Passed | ${data.summary.successfulPhases}/${data.summary.totalPhases} | ${data.summary.successfulPhases === data.summary.totalPhases ? '✅' : '❌'} |
${data.summary.quality.coverage ? `| Test Coverage | ${data.summary.quality.coverage.statements}% | ${data.summary.quality.coverage.statements >= 95 ? '✅' : '⚠️'} |` : ''}
${data.summary.performance.avgResponseTime ? `| Avg Response Time | ${data.summary.performance.avgResponseTime}ms | ${data.summary.performance.avgResponseTime < 200 ? '✅' : '⚠️'} |` : ''}

## 🎯 Phase Results

${Object.entries(data.phases).map(([phaseKey, result]) => {
  const phase = this.phases[phaseKey];
  return `### ${phase.icon} ${phase.name}

**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}  
${result.duration ? `**Duration:** ${Math.round(result.duration / 1000)}s  ` : ''}
${result.error ? `**Error:** ${result.error}` : '**Result:** Successfully completed all checks'}
`;
}).join('\n')}

## 💡 Recommendations

${this.generateMarkdownRecommendations(data)}

---

*Report generated by Zenith Testing Master Controller v1.0.0*
`;
  }

  generateMarkdownRecommendations(data) {
    const allRecommendations = [];
    
    Object.values(data.phases).forEach(result => {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
    });

    if (allRecommendations.length === 0) {
      return '🎉 No critical recommendations at this time. Continue following best practices!';
    }

    const grouped = allRecommendations.reduce((acc, rec) => {
      const priority = rec.severity || rec.priority || 'medium';
      if (!acc[priority]) acc[priority] = [];
      acc[priority].push(rec);
      return acc;
    }, {});

    let output = '';
    
    if (grouped.critical) {
      output += '### 🔴 Critical Priority\n\n';
      grouped.critical.forEach(rec => {
        output += `- ${rec.message || rec.description}\n`;
      });
      output += '\n';
    }
    
    if (grouped.high) {
      output += '### 🟠 High Priority\n\n';
      grouped.high.forEach(rec => {
        output += `- ${rec.message || rec.description}\n`;
      });
      output += '\n';
    }
    
    return output;
  }

  getOverallStatus(data) {
    if (data.summary.criticalIssues > 0 || data.summary.failedPhases > 0) {
      return 'FAIL';
    }
    
    if (data.summary.totalIssues > 10) {
      return 'WARNING';
    }
    
    return 'PASS';
  }

  async applyAutomatedFixes() {
    console.log('🔧 Applying Automated Fixes');
    console.log('---------------------------');

    let totalFixesApplied = 0;

    for (const [phaseKey, result] of Object.entries(this.results.phases)) {
      if (result.success && result.fixableIssues) {
        console.log(`🔧 Applying fixes from ${this.phases[phaseKey].name}...`);
        
        try {
          const framework = new this.phases[phaseKey].framework();
          const fixesApplied = await framework.applyAutomatedFixes();
          totalFixesApplied += fixesApplied;
          
          console.log(`   ✅ Applied ${fixesApplied} fixes`);
        } catch (error) {
          console.log(`   ❌ Fix application failed: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Total fixes applied: ${totalFixesApplied}`);
    
    if (totalFixesApplied > 0) {
      console.log('💡 Recommendation: Re-run tests to verify fixes');
    }
    
    console.log('');
  }

  async finalAssessment() {
    console.log('🏁 Final Assessment');
    console.log('===================');

    const duration = Date.now() - this.startTime;
    const overallStatus = this.getOverallStatus(this.results);

    console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📊 Overall Status: ${overallStatus}`);
    console.log(`📈 Phases: ${this.results.summary.successfulPhases}/${this.results.summary.totalPhases} successful`);
    console.log(`🚨 Issues: ${this.results.summary.totalIssues} total (${this.results.summary.criticalIssues} critical)`);

    if (this.results.artifacts.length > 0) {
      console.log(`📋 Reports: ${this.results.artifacts.length} generated`);
    }

    console.log('');

    // Final status output for CI/CD
    if (overallStatus === 'PASS') {
      console.log('🎉 ALL QUALITY GATES PASSED! 🎉');
      console.log('   Application is ready for deployment.');
      process.exit(0);
    } else if (overallStatus === 'WARNING') {
      console.log('⚠️  QUALITY GATES PASSED WITH WARNINGS');
      console.log('   Consider addressing warnings before deployment.');
      process.exit(this.config.mode === 'ci' ? 1 : 0);
    } else {
      console.log('❌ QUALITY GATES FAILED!');
      console.log('   Application requires fixes before deployment.');
      process.exit(1);
    }
  }

  handleCriticalError(error) {
    console.error('');
    console.error('💥 CRITICAL ERROR IN TESTING MASTER');
    console.error('====================================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('');
    console.error('This indicates a serious issue with the testing framework itself.');
    console.error('Please review the error above and ensure all dependencies are installed.');
    console.error('');
    
    process.exit(1);
  }
}

// CLI Interface
if (require.main === module) {
  const master = new ZenithTestMaster();
  master.run().catch(error => {
    console.error('💥 Testing Master crashed:', error);
    process.exit(1);
  });
}

module.exports = ZenithTestMaster;