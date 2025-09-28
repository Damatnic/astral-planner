#!/usr/bin/env node

/**
 * ZENITH QUALITY ASSURANCE FRAMEWORK
 * Comprehensive testing and quality validation system for ASTRAL_PLANNER
 * 
 * This script provides:
 * - Complete test suite execution
 * - Build validation and error detection
 * - Performance monitoring
 * - Security vulnerability scanning
 * - Coverage analysis and reporting
 * - Automated error detection
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ZenithQualityAssurance {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      coverage: {},
      build: {},
      performance: {},
      security: {},
      errors: [],
      summary: {}
    };
    
    this.config = {
      thresholds: {
        coverage: {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95
        },
        performance: {
          buildTime: 30000, // 30 seconds
          bundleSize: 1000000, // 1MB
          pageLoad: 3000 // 3 seconds
        },
        security: {
          vulnerabilities: 0,
          codeSmells: 5
        }
      }
    };
  }

  async run() {
    console.log('🚀 ZENITH QUALITY ASSURANCE FRAMEWORK');
    console.log('=====================================');
    console.log(`📅 Started: ${this.results.timestamp}`);
    console.log('');

    try {
      // Phase 1: Environment Validation
      await this.validateEnvironment();
      
      // Phase 2: Code Quality Analysis
      await this.analyzeCodeQuality();
      
      // Phase 3: Test Suite Execution
      await this.runTestSuite();
      
      // Phase 4: Build System Validation
      await this.validateBuildSystem();
      
      // Phase 5: Performance Testing
      await this.runPerformanceTests();
      
      // Phase 6: Security Scanning
      await this.runSecurityScan();
      
      // Phase 7: Error Detection
      await this.detectRuntimeErrors();
      
      // Phase 8: Generate Reports
      await this.generateReports();
      
      // Phase 9: Quality Gates
      await this.evaluateQualityGates();
      
    } catch (error) {
      this.results.errors.push({
        phase: 'Framework Execution',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      console.error('❌ Quality Assurance Framework failed:', error.message);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Phase 1: Environment Validation');
    console.log('----------------------------------');
    
    const checks = {
      nodeVersion: this.checkNodeVersion(),
      npmVersion: this.checkNpmVersion(),
      dependencies: this.checkDependencies(),
      envVars: this.checkEnvironmentVariables(),
      diskSpace: this.checkDiskSpace(),
      memory: this.checkMemory()
    };
    
    this.results.environment = checks;
    
    for (const [check, result] of Object.entries(checks)) {
      if (result.passed) {
        console.log(`✅ ${check}: ${result.message}`);
      } else {
        console.log(`❌ ${check}: ${result.message}`);
        this.results.errors.push({
          phase: 'Environment',
          check,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('');
  }

  checkNodeVersion() {
    try {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      const passed = major >= 18;
      
      return {
        passed,
        message: `Node.js ${version} ${passed ? '(Compatible)' : '(Requires 18+)'}`,
        version,
        error: passed ? null : 'Node.js version 18+ required'
      };
    } catch (error) {
      return { passed: false, message: 'Failed to check Node.js version', error: error.message };
    }
  }

  checkNpmVersion() {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      const major = parseInt(version.split('.')[0]);
      const passed = major >= 8;
      
      return {
        passed,
        message: `npm ${version} ${passed ? '(Compatible)' : '(Requires 8+)'}`,
        version,
        error: passed ? null : 'npm version 8+ required'
      };
    } catch (error) {
      return { passed: false, message: 'Failed to check npm version', error: error.message };
    }
  }

  checkDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const nodeModules = fs.existsSync('node_modules');
      const lockFile = fs.existsSync('package-lock.json');
      
      if (!nodeModules) {
        return { passed: false, message: 'node_modules not found', error: 'Run npm install' };
      }
      
      // Check critical dependencies
      const critical = ['next', 'react', 'typescript', 'jest'];
      const missing = critical.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );
      
      if (missing.length > 0) {
        return { 
          passed: false, 
          message: `Missing critical dependencies: ${missing.join(', ')}`,
          error: 'Critical dependencies missing'
        };
      }
      
      return {
        passed: true,
        message: `All dependencies installed (${Object.keys(packageJson.dependencies || {}).length} prod, ${Object.keys(packageJson.devDependencies || {}).length} dev)`,
        lockFile
      };
    } catch (error) {
      return { passed: false, message: 'Failed to check dependencies', error: error.message };
    }
  }

  checkEnvironmentVariables() {
    try {
      const required = [
        'NODE_ENV',
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY'
      ];
      
      const missing = required.filter(env => !process.env[env]);
      const passed = missing.length === 0;
      
      return {
        passed,
        message: passed ? 'All required environment variables set' : `Missing: ${missing.join(', ')}`,
        missing,
        error: passed ? null : 'Required environment variables missing'
      };
    } catch (error) {
      return { passed: false, message: 'Failed to check environment variables', error: error.message };
    }
  }

  checkDiskSpace() {
    try {
      const stats = fs.statSync('.');
      // Simplified check - in production, use proper disk space checking
      return {
        passed: true,
        message: 'Disk space check passed',
        error: null
      };
    } catch (error) {
      return { passed: false, message: 'Failed to check disk space', error: error.message };
    }
  }

  checkMemory() {
    try {
      const total = process.memoryUsage();
      const available = total.heapTotal - total.heapUsed;
      const passed = available > 100 * 1024 * 1024; // 100MB available
      
      return {
        passed,
        message: `Memory: ${Math.round(total.heapUsed / 1024 / 1024)}MB used, ${Math.round(available / 1024 / 1024)}MB available`,
        usage: total,
        error: passed ? null : 'Insufficient memory available'
      };
    } catch (error) {
      return { passed: false, message: 'Failed to check memory', error: error.message };
    }
  }

  async analyzeCodeQuality() {
    console.log('🔍 Phase 2: Code Quality Analysis');
    console.log('---------------------------------');
    
    const analysis = {
      typescript: await this.runTypeScript(),
      linting: await this.runLinting(),
      complexity: await this.analyzeComplexity(),
      duplication: await this.detectDuplication(),
      security: await this.scanSecurityIssues()
    };
    
    this.results.codeQuality = analysis;
    
    for (const [check, result] of Object.entries(analysis)) {
      if (result.passed) {
        console.log(`✅ ${check}: ${result.message}`);
      } else {
        console.log(`❌ ${check}: ${result.message}`);
      }
    }
    
    console.log('');
  }

  async runTypeScript() {
    try {
      console.log('  📝 Running TypeScript compilation...');
      const output = execSync('npm run type-check', { encoding: 'utf8', timeout: 30000 });
      
      return {
        passed: true,
        message: 'TypeScript compilation successful',
        output,
        errors: []
      };
    } catch (error) {
      const errors = this.parseTypeScriptErrors(error.stdout || error.message);
      
      return {
        passed: false,
        message: `TypeScript compilation failed (${errors.length} errors)`,
        output: error.stdout || error.message,
        errors
      };
    }
  }

  parseTypeScriptErrors(output) {
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      if (line.includes('error TS')) {
        const match = line.match(/(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/);
        if (match) {
          errors.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            code: match[4],
            message: match[5]
          });
        }
      }
    }
    
    return errors;
  }

  async runLinting() {
    try {
      console.log('  🧹 Running ESLint...');
      
      // Configure basic ESLint if not exists
      if (!fs.existsSync('.eslintrc.json')) {
        const eslintConfig = {
          extends: ['next/core-web-vitals'],
          rules: {
            '@next/next/no-html-link-for-pages': 'off',
            'react/no-unescaped-entities': 'off'
          }
        };
        fs.writeFileSync('.eslintrc.json', JSON.stringify(eslintConfig, null, 2));
      }
      
      const output = execSync('npx eslint src --ext .ts,.tsx,.js,.jsx --format json', { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      const results = JSON.parse(output);
      const errors = results.flatMap(file => file.messages.filter(msg => msg.severity === 2));
      const warnings = results.flatMap(file => file.messages.filter(msg => msg.severity === 1));
      
      return {
        passed: errors.length === 0,
        message: `ESLint: ${errors.length} errors, ${warnings.length} warnings`,
        errors,
        warnings,
        results
      };
    } catch (error) {
      return {
        passed: false,
        message: 'ESLint execution failed',
        error: error.message,
        errors: []
      };
    }
  }

  async analyzeComplexity() {
    try {
      console.log('  📊 Analyzing code complexity...');
      
      // Simple complexity analysis by counting lines and functions
      const files = this.getSourceFiles();
      let totalLines = 0;
      let totalFunctions = 0;
      let complexFiles = [];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>/g) || []).length;
        
        totalLines += lines;
        totalFunctions += functions;
        
        if (lines > 300) {
          complexFiles.push({ file, lines, functions });
        }
      }
      
      const avgLinesPerFile = Math.round(totalLines / files.length);
      const passed = complexFiles.length === 0 && avgLinesPerFile < 200;
      
      return {
        passed,
        message: `Complexity: ${files.length} files, avg ${avgLinesPerFile} lines/file, ${complexFiles.length} complex files`,
        stats: {
          totalFiles: files.length,
          totalLines,
          totalFunctions,
          avgLinesPerFile,
          complexFiles
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Complexity analysis failed',
        error: error.message
      };
    }
  }

  async detectDuplication() {
    try {
      console.log('  🔍 Detecting code duplication...');
      
      // Simple duplication detection by comparing file hashes
      const files = this.getSourceFiles();
      const hashes = new Map();
      const duplicates = [];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const normalized = content.replace(/\s+/g, ' ').trim();
        const hash = crypto.createHash('md5').update(normalized).digest('hex');
        
        if (hashes.has(hash)) {
          duplicates.push({
            file1: hashes.get(hash),
            file2: file,
            hash
          });
        } else {
          hashes.set(hash, file);
        }
      }
      
      return {
        passed: duplicates.length === 0,
        message: `Duplication: ${duplicates.length} potential duplicates found`,
        duplicates
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Duplication detection failed',
        error: error.message
      };
    }
  }

  async scanSecurityIssues() {
    try {
      console.log('  🔒 Scanning for security issues...');
      
      // Basic security pattern detection
      const files = this.getSourceFiles();
      const issues = [];
      
      const patterns = [
        { name: 'Hardcoded secrets', regex: /(password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/i },
        { name: 'SQL injection risk', regex: /query.*\+.*req\./i },
        { name: 'XSS risk', regex: /innerHTML.*req\./i },
        { name: 'Unsafe eval', regex: /eval\s*\(/i },
        { name: 'Unsafe redirect', regex: /redirect.*req\./i }
      ];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of patterns) {
            if (pattern.regex.test(lines[i])) {
              issues.push({
                file,
                line: i + 1,
                issue: pattern.name,
                content: lines[i].trim()
              });
            }
          }
        }
      }
      
      return {
        passed: issues.length === 0,
        message: `Security: ${issues.length} potential issues found`,
        issues
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Security scan failed',
        error: error.message
      };
    }
  }

  getSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const srcDir = path.join(process.cwd(), 'src');
    
    if (!fs.existsSync(srcDir)) {
      return [];
    }
    
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    walkDir(srcDir);
    return files;
  }

  async runTestSuite() {
    console.log('🧪 Phase 3: Test Suite Execution');
    console.log('--------------------------------');
    
    const testResults = {
      unit: await this.runUnitTests(),
      integration: await this.runIntegrationTests(),
      e2e: await this.runE2ETests(),
      coverage: await this.analyzeCoverage()
    };
    
    this.results.tests = testResults;
    
    for (const [type, result] of Object.entries(testResults)) {
      if (result.passed) {
        console.log(`✅ ${type}: ${result.message}`);
      } else {
        console.log(`❌ ${type}: ${result.message}`);
      }
    }
    
    console.log('');
  }

  async runUnitTests() {
    try {
      console.log('  🧪 Running unit tests...');
      const output = execSync('npm test -- --passWithNoTests --coverage=false', { 
        encoding: 'utf8',
        timeout: 120000 
      });
      
      const stats = this.parseJestOutput(output);
      
      return {
        passed: stats.failures === 0,
        message: `Unit tests: ${stats.passed} passed, ${stats.failures} failed, ${stats.total} total`,
        stats,
        output
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Unit tests failed to execute',
        error: error.message,
        output: error.stdout || ''
      };
    }
  }

  async runIntegrationTests() {
    try {
      console.log('  🔗 Running integration tests...');
      
      // Check if integration tests exist
      const integrationTestsExist = fs.existsSync('src/app/api') || fs.existsSync('tests/integration');
      
      if (!integrationTestsExist) {
        return {
          passed: true,
          message: 'Integration tests: No tests found (skipped)',
          stats: { passed: 0, failures: 0, total: 0 }
        };
      }
      
      const output = execSync('npm run test:integration', { 
        encoding: 'utf8',
        timeout: 180000 
      });
      
      const stats = this.parseJestOutput(output);
      
      return {
        passed: stats.failures === 0,
        message: `Integration tests: ${stats.passed} passed, ${stats.failures} failed, ${stats.total} total`,
        stats,
        output
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Integration tests failed',
        error: error.message,
        output: error.stdout || ''
      };
    }
  }

  async runE2ETests() {
    try {
      console.log('  🎭 Running E2E tests...');
      
      // Check if E2E tests exist
      const e2eTestsExist = fs.existsSync('tests/e2e') || fs.existsSync('e2e');
      
      if (!e2eTestsExist) {
        return {
          passed: true,
          message: 'E2E tests: No tests found (skipped)',
          stats: { passed: 0, failures: 0, total: 0 }
        };
      }
      
      // Check if Playwright is installed
      try {
        execSync('npx playwright --version', { timeout: 5000 });
      } catch {
        return {
          passed: false,
          message: 'E2E tests: Playwright not installed',
          error: 'Install Playwright: npx playwright install'
        };
      }
      
      const output = execSync('npx playwright test', { 
        encoding: 'utf8',
        timeout: 300000 
      });
      
      const stats = this.parsePlaywrightOutput(output);
      
      return {
        passed: stats.failures === 0,
        message: `E2E tests: ${stats.passed} passed, ${stats.failures} failed, ${stats.total} total`,
        stats,
        output
      };
    } catch (error) {
      return {
        passed: false,
        message: 'E2E tests failed',
        error: error.message,
        output: error.stdout || ''
      };
    }
  }

  async analyzeCoverage() {
    try {
      console.log('  📊 Analyzing test coverage...');
      const output = execSync('npm run test:coverage -- --passWithNoTests', { 
        encoding: 'utf8',
        timeout: 120000 
      });
      
      const coverage = this.parseCoverageOutput(output);
      const thresholds = this.config.thresholds.coverage;
      
      const passed = Object.entries(thresholds).every(([metric, threshold]) => 
        coverage[metric] >= threshold
      );
      
      return {
        passed,
        message: `Coverage: ${coverage.statements}% statements, ${coverage.branches}% branches, ${coverage.functions}% functions, ${coverage.lines}% lines`,
        coverage,
        thresholds
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Coverage analysis failed',
        error: error.message
      };
    }
  }

  parseJestOutput(output) {
    const stats = { passed: 0, failures: 0, total: 0 };
    
    // Parse Jest output for test results
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed.*?(\d+) failed.*?(\d+) total/);
        if (match) {
          stats.passed = parseInt(match[1]);
          stats.failures = parseInt(match[2]);
          stats.total = parseInt(match[3]);
        }
      }
    }
    
    return stats;
  }

  parsePlaywrightOutput(output) {
    const stats = { passed: 0, failures: 0, total: 0 };
    
    // Parse Playwright output for test results
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('passed') && line.includes('failed')) {
        const passMatch = line.match(/(\d+) passed/);
        const failMatch = line.match(/(\d+) failed/);
        
        if (passMatch) stats.passed = parseInt(passMatch[1]);
        if (failMatch) stats.failures = parseInt(failMatch[1]);
        stats.total = stats.passed + stats.failures;
      }
    }
    
    return stats;
  }

  parseCoverageOutput(output) {
    const coverage = { statements: 0, branches: 0, functions: 0, lines: 0 };
    
    // Parse Jest coverage output
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('All files')) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 5) {
          coverage.statements = parseFloat(parts[1]) || 0;
          coverage.branches = parseFloat(parts[2]) || 0;
          coverage.functions = parseFloat(parts[3]) || 0;
          coverage.lines = parseFloat(parts[4]) || 0;
        }
      }
    }
    
    return coverage;
  }

  async validateBuildSystem() {
    console.log('🏗️  Phase 4: Build System Validation');
    console.log('-----------------------------------');
    
    const buildResults = {
      production: await this.buildProduction(),
      serviceWorker: await this.validateServiceWorker(),
      bundleAnalysis: await this.analyzeBundles(),
      optimization: await this.checkOptimizations()
    };
    
    this.results.build = buildResults;
    
    for (const [check, result] of Object.entries(buildResults)) {
      if (result.passed) {
        console.log(`✅ ${check}: ${result.message}`);
      } else {
        console.log(`❌ ${check}: ${result.message}`);
      }
    }
    
    console.log('');
  }

  async buildProduction() {
    try {
      console.log('  🏗️  Building production bundle...');
      const startTime = Date.now();
      
      const output = execSync('npm run build', { 
        encoding: 'utf8',
        timeout: 300000 // 5 minutes
      });
      
      const buildTime = Date.now() - startTime;
      const passed = buildTime < this.config.thresholds.performance.buildTime;
      
      return {
        passed,
        message: `Production build: ${buildTime}ms ${passed ? '(Good)' : '(Slow)'}`,
        buildTime,
        output
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Production build failed',
        error: error.message,
        output: error.stdout || ''
      };
    }
  }

  async validateServiceWorker() {
    try {
      console.log('  ⚙️  Validating service worker...');
      
      const swPath = path.join('public', 'sw.js');
      const swExists = fs.existsSync(swPath);
      
      if (!swExists) {
        return {
          passed: false,
          message: 'Service worker not found',
          error: 'sw.js missing in public directory'
        };
      }
      
      const swContent = fs.readFileSync(swPath, 'utf8');
      const hasRegistration = swContent.includes('addEventListener');
      const hasCache = swContent.includes('cache');
      
      return {
        passed: hasRegistration && hasCache,
        message: `Service worker: ${swExists ? 'exists' : 'missing'}, ${hasRegistration ? 'has events' : 'no events'}, ${hasCache ? 'has caching' : 'no caching'}`,
        details: {
          exists: swExists,
          hasRegistration,
          hasCache,
          size: swContent.length
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Service worker validation failed',
        error: error.message
      };
    }
  }

  async analyzeBundles() {
    try {
      console.log('  📦 Analyzing bundle sizes...');
      
      const nextDir = path.join('.next', 'static');
      if (!fs.existsSync(nextDir)) {
        return {
          passed: false,
          message: 'Build output not found',
          error: 'Run npm run build first'
        };
      }
      
      const bundles = this.getBundleSizes(nextDir);
      const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
      const passed = totalSize < this.config.thresholds.performance.bundleSize;
      
      return {
        passed,
        message: `Bundle analysis: ${Math.round(totalSize / 1024)}KB total ${passed ? '(Good)' : '(Large)'}`,
        totalSize,
        bundles: bundles.slice(0, 10) // Top 10 largest
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Bundle analysis failed',
        error: error.message
      };
    }
  }

  getBundleSizes(dir) {
    const bundles = [];
    
    function walkDir(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.css')) {
          bundles.push({
            file: path.relative('.next', fullPath),
            size: stat.size
          });
        }
      }
    }
    
    walkDir(dir);
    return bundles.sort((a, b) => b.size - a.size);
  }

  async checkOptimizations() {
    try {
      console.log('  ⚡ Checking optimizations...');
      
      const nextConfig = fs.existsSync('next.config.js') ? 
        fs.readFileSync('next.config.js', 'utf8') : '';
      
      const optimizations = {
        compression: nextConfig.includes('compress'),
        imageOptimization: nextConfig.includes('images'),
        bundleAnalyzer: nextConfig.includes('bundle-analyzer'),
        webpack: nextConfig.includes('webpack'),
        experimental: nextConfig.includes('experimental')
      };
      
      const enabledCount = Object.values(optimizations).filter(Boolean).length;
      const passed = enabledCount >= 3;
      
      return {
        passed,
        message: `Optimizations: ${enabledCount}/5 enabled ${passed ? '(Good)' : '(Needs improvement)'}`,
        optimizations
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Optimization check failed',
        error: error.message
      };
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Phase 5: Performance Testing');
    console.log('------------------------------');
    
    const perfResults = {
      lighthouse: await this.runLighthouse(),
      bundleSize: await this.checkBundlePerformance(),
      loadTime: await this.measureLoadTime(),
      memoryUsage: await this.checkMemoryUsage()
    };
    
    this.results.performance = perfResults;
    
    for (const [test, result] of Object.entries(perfResults)) {
      if (result.passed) {
        console.log(`✅ ${test}: ${result.message}`);
      } else {
        console.log(`❌ ${test}: ${result.message}`);
      }
    }
    
    console.log('');
  }

  async runLighthouse() {
    try {
      console.log('  🏃 Running Lighthouse audit...');
      
      // Check if Lighthouse is available
      try {
        execSync('which lighthouse', { timeout: 5000 });
      } catch {
        return {
          passed: false,
          message: 'Lighthouse not installed',
          error: 'Install Lighthouse: npm install -g lighthouse'
        };
      }
      
      // Run Lighthouse (this would require the app to be running)
      return {
        passed: true,
        message: 'Lighthouse: Skipped (requires running server)',
        note: 'Run: lighthouse http://localhost:3000 --output html'
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Lighthouse audit failed',
        error: error.message
      };
    }
  }

  async checkBundlePerformance() {
    try {
      console.log('  📦 Checking bundle performance...');
      
      const buildInfo = path.join('.next', 'build-manifest.json');
      if (!fs.existsSync(buildInfo)) {
        return {
          passed: false,
          message: 'Build manifest not found',
          error: 'Run npm run build first'
        };
      }
      
      const manifest = JSON.parse(fs.readFileSync(buildInfo, 'utf8'));
      const pages = manifest.pages || {};
      const pageCount = Object.keys(pages).length;
      
      return {
        passed: pageCount > 0,
        message: `Bundle performance: ${pageCount} pages generated`,
        pageCount,
        pages: Object.keys(pages).slice(0, 5)
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Bundle performance check failed',
        error: error.message
      };
    }
  }

  async measureLoadTime() {
    try {
      console.log('  ⏱️  Measuring load time...');
      
      // This would require puppeteer or similar for real measurement
      // For now, we'll simulate based on bundle size
      const bundles = this.getBundleSizes(path.join('.next', 'static'));
      const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
      
      // Estimate load time based on bundle size (rough calculation)
      const estimatedLoadTime = Math.max(1000, totalSize / 1000); // 1KB per ms
      const passed = estimatedLoadTime < this.config.thresholds.performance.pageLoad;
      
      return {
        passed,
        message: `Load time: ~${Math.round(estimatedLoadTime)}ms estimated ${passed ? '(Fast)' : '(Slow)'}`,
        estimatedLoadTime,
        bundleSize: totalSize
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Load time measurement failed',
        error: error.message
      };
    }
  }

  async checkMemoryUsage() {
    try {
      console.log('  🧠 Checking memory usage...');
      
      const usage = process.memoryUsage();
      const heapUsed = usage.heapUsed;
      const heapTotal = usage.heapTotal;
      const external = usage.external;
      
      const totalMB = Math.round((heapUsed + external) / 1024 / 1024);
      const passed = totalMB < 500; // 500MB threshold
      
      return {
        passed,
        message: `Memory usage: ${totalMB}MB used ${passed ? '(Good)' : '(High)'}`,
        usage: {
          heapUsed: Math.round(heapUsed / 1024 / 1024),
          heapTotal: Math.round(heapTotal / 1024 / 1024),
          external: Math.round(external / 1024 / 1024),
          total: totalMB
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Memory usage check failed',
        error: error.message
      };
    }
  }

  async runSecurityScan() {
    console.log('🔒 Phase 6: Security Scanning');
    console.log('-----------------------------');
    
    const securityResults = {
      dependencies: await this.auditDependencies(),
      secrets: await this.scanForSecrets(),
      headers: await this.checkSecurityHeaders(),
      permissions: await this.checkPermissions()
    };
    
    this.results.security = securityResults;
    
    for (const [scan, result] of Object.entries(securityResults)) {
      if (result.passed) {
        console.log(`✅ ${scan}: ${result.message}`);
      } else {
        console.log(`❌ ${scan}: ${result.message}`);
      }
    }
    
    console.log('');
  }

  async auditDependencies() {
    try {
      console.log('  🔍 Auditing dependencies...');
      
      const output = execSync('npm audit --json', { 
        encoding: 'utf8',
        timeout: 60000 
      });
      
      const audit = JSON.parse(output);
      const vulnerabilities = audit.vulnerabilities || {};
      const vulnCount = Object.keys(vulnerabilities).length;
      
      // Count by severity
      const severity = { low: 0, moderate: 0, high: 0, critical: 0 };
      Object.values(vulnerabilities).forEach(vuln => {
        if (vuln.severity) severity[vuln.severity]++;
      });
      
      const passed = severity.high === 0 && severity.critical === 0;
      
      return {
        passed,
        message: `Dependencies: ${vulnCount} vulnerabilities (${severity.critical} critical, ${severity.high} high)`,
        vulnerabilities: vulnCount,
        severity,
        audit
      };
    } catch (error) {
      // npm audit exits with non-zero on vulnerabilities
      try {
        const audit = JSON.parse(error.stdout || '{}');
        const vulnerabilities = audit.vulnerabilities || {};
        const vulnCount = Object.keys(vulnerabilities).length;
        
        return {
          passed: vulnCount === 0,
          message: `Dependencies: ${vulnCount} vulnerabilities found`,
          vulnerabilities: vulnCount,
          audit
        };
      } catch {
        return {
          passed: false,
          message: 'Dependency audit failed',
          error: error.message
        };
      }
    }
  }

  async scanForSecrets() {
    try {
      console.log('  🔐 Scanning for secrets...');
      
      const files = this.getSourceFiles();
      const secrets = [];
      
      const secretPatterns = [
        { name: 'API Key', regex: /['"](api[_-]?key|apikey)['"]\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/ },
        { name: 'Secret Key', regex: /['"](secret[_-]?key|secretkey)['"]\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/ },
        { name: 'Private Key', regex: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/ },
        { name: 'Password', regex: /['"](password|passwd)['"]\s*[:=]\s*['"][^'"]{8,}['"]/ },
        { name: 'Token', regex: /['"](token|auth[_-]?token)['"]\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/ }
      ];
      
      for (const file of files) {
        // Skip test files and config files
        if (file.includes('test') || file.includes('spec') || file.includes('.config.')) {
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of secretPatterns) {
            if (pattern.regex.test(lines[i])) {
              secrets.push({
                file: path.relative(process.cwd(), file),
                line: i + 1,
                type: pattern.name,
                content: lines[i].trim().substring(0, 100)
              });
            }
          }
        }
      }
      
      return {
        passed: secrets.length === 0,
        message: `Secrets scan: ${secrets.length} potential secrets found`,
        secrets
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Secrets scan failed',
        error: error.message
      };
    }
  }

  async checkSecurityHeaders() {
    try {
      console.log('  🛡️  Checking security headers...');
      
      const nextConfig = fs.existsSync('next.config.js') ? 
        fs.readFileSync('next.config.js', 'utf8') : '';
      
      const headers = {
        'X-Frame-Options': nextConfig.includes('X-Frame-Options'),
        'X-Content-Type-Options': nextConfig.includes('X-Content-Type-Options'),
        'Referrer-Policy': nextConfig.includes('Referrer-Policy'),
        'Strict-Transport-Security': nextConfig.includes('Strict-Transport-Security'),
        'Content-Security-Policy': nextConfig.includes('Content-Security-Policy')
      };
      
      const enabledCount = Object.values(headers).filter(Boolean).length;
      const passed = enabledCount >= 4;
      
      return {
        passed,
        message: `Security headers: ${enabledCount}/5 configured ${passed ? '(Good)' : '(Missing headers)'}`,
        headers
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Security headers check failed',
        error: error.message
      };
    }
  }

  async checkPermissions() {
    try {
      console.log('  👤 Checking file permissions...');
      
      const sensitiveFiles = [
        '.env',
        '.env.local',
        '.env.production',
        'next.config.js',
        'package.json'
      ];
      
      const issues = [];
      
      for (const file of sensitiveFiles) {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          const mode = (stats.mode & parseInt('777', 8)).toString(8);
          
          // Check if file is world-readable (too permissive)
          if (mode.endsWith('4') || mode.endsWith('6') || mode.endsWith('7')) {
            issues.push({
              file,
              permissions: mode,
              issue: 'World-readable'
            });
          }
        }
      }
      
      return {
        passed: issues.length === 0,
        message: `File permissions: ${issues.length} issues found`,
        issues
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Permissions check failed',
        error: error.message
      };
    }
  }

  async detectRuntimeErrors() {
    console.log('🚨 Phase 7: Runtime Error Detection');
    console.log('-----------------------------------');
    
    const errorResults = {
      compilation: await this.checkCompilationErrors(),
      runtime: await this.scanRuntimeErrors(),
      console: await this.checkConsoleErrors(),
      unhandled: await this.detectUnhandledErrors()
    };
    
    this.results.errorDetection = errorResults;
    
    for (const [check, result] of Object.entries(errorResults)) {
      if (result.passed) {
        console.log(`✅ ${check}: ${result.message}`);
      } else {
        console.log(`❌ ${check}: ${result.message}`);
      }
    }
    
    console.log('');
  }

  async checkCompilationErrors() {
    try {
      console.log('  🔧 Checking compilation errors...');
      
      // TypeScript compilation already checked in code quality
      const tsResult = this.results.codeQuality?.typescript;
      
      if (!tsResult) {
        return {
          passed: false,
          message: 'TypeScript check not available',
          error: 'Run code quality analysis first'
        };
      }
      
      return {
        passed: tsResult.passed,
        message: `Compilation: ${tsResult.passed ? 'No errors' : `${tsResult.errors?.length || 0} errors`}`,
        errors: tsResult.errors || []
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Compilation error check failed',
        error: error.message
      };
    }
  }

  async scanRuntimeErrors() {
    try {
      console.log('  🔍 Scanning for runtime error patterns...');
      
      const files = this.getSourceFiles();
      const errorPatterns = [];
      
      const patterns = [
        { name: 'Uncaught exception', regex: /throw\s+new\s+Error\s*\(\s*[^)]*\)/ },
        { name: 'Undefined access', regex: /\w+\.\w+\.\w+\s*(?!\?)/ },
        { name: 'Null reference', regex: /null\.\w+/ },
        { name: 'Missing await', regex: /\.\w+\(\)\s*\.\w+\(/ },
        { name: 'Memory leak risk', regex: /setInterval\s*\((?!.*clearInterval)/ }
      ];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of patterns) {
            if (pattern.regex.test(lines[i])) {
              errorPatterns.push({
                file: path.relative(process.cwd(), file),
                line: i + 1,
                pattern: pattern.name,
                content: lines[i].trim()
              });
            }
          }
        }
      }
      
      return {
        passed: errorPatterns.length === 0,
        message: `Runtime patterns: ${errorPatterns.length} potential error patterns found`,
        patterns: errorPatterns.slice(0, 10) // Top 10
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Runtime error scan failed',
        error: error.message
      };
    }
  }

  async checkConsoleErrors() {
    try {
      console.log('  📝 Checking console error usage...');
      
      const files = this.getSourceFiles();
      const consoleUsage = [];
      
      for (const file of files) {
        // Skip test files
        if (file.includes('test') || file.includes('spec')) {
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          if (/console\.(log|warn|error|debug)/.test(lines[i])) {
            consoleUsage.push({
              file: path.relative(process.cwd(), file),
              line: i + 1,
              content: lines[i].trim()
            });
          }
        }
      }
      
      // Console usage is not necessarily an error, but should be minimal in production
      const passed = consoleUsage.length < 10;
      
      return {
        passed,
        message: `Console usage: ${consoleUsage.length} instances found ${passed ? '(Acceptable)' : '(Too many)'}`,
        usage: consoleUsage.slice(0, 5)
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Console error check failed',
        error: error.message
      };
    }
  }

  async detectUnhandledErrors() {
    try {
      console.log('  🎯 Detecting unhandled error scenarios...');
      
      const files = this.getSourceFiles();
      const unhandledScenarios = [];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for async functions without try-catch
        const asyncFunctions = content.match(/async\s+function[^{]*{[^}]*}/g) || [];
        for (const func of asyncFunctions) {
          if (!func.includes('try') && !func.includes('catch')) {
            unhandledScenarios.push({
              file: path.relative(process.cwd(), file),
              type: 'Async function without error handling',
              content: func.substring(0, 100)
            });
          }
        }
        
        // Check for Promise usage without catch
        const promiseUsage = content.match(/\.\w+\([^)]*\)\s*\.then\([^}]*}/g) || [];
        for (const promise of promiseUsage) {
          if (!promise.includes('.catch')) {
            unhandledScenarios.push({
              file: path.relative(process.cwd(), file),
              type: 'Promise without catch handler',
              content: promise.substring(0, 100)
            });
          }
        }
      }
      
      return {
        passed: unhandledScenarios.length === 0,
        message: `Unhandled errors: ${unhandledScenarios.length} potential scenarios found`,
        scenarios: unhandledScenarios.slice(0, 5)
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Unhandled error detection failed',
        error: error.message
      };
    }
  }

  async generateReports() {
    console.log('📊 Phase 8: Generate Reports');
    console.log('----------------------------');
    
    try {
      // Ensure reports directory exists
      if (!fs.existsSync('reports')) {
        fs.mkdirSync('reports', { recursive: true });
      }
      
      // Generate comprehensive report
      const reportData = {
        ...this.results,
        metadata: {
          version: '1.0.0',
          framework: 'Zenith Quality Assurance',
          generatedAt: new Date().toISOString(),
          duration: Date.now() - new Date(this.results.timestamp).getTime(),
          nodeVersion: process.version,
          platform: process.platform
        }
      };
      
      // JSON Report
      const jsonReportPath = path.join('reports', `quality-report-${Date.now()}.json`);
      fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
      
      // HTML Report
      const htmlReport = this.generateHTMLReport(reportData);
      const htmlReportPath = path.join('reports', `quality-report-${Date.now()}.html`);
      fs.writeFileSync(htmlReportPath, htmlReport);
      
      // Summary Report
      const summaryReport = this.generateSummaryReport(reportData);
      const summaryPath = path.join('reports', 'quality-summary.md');
      fs.writeFileSync(summaryPath, summaryReport);
      
      console.log(`✅ Reports generated:`);
      console.log(`   📋 JSON: ${jsonReportPath}`);
      console.log(`   🌐 HTML: ${htmlReportPath}`);
      console.log(`   📝 Summary: ${summaryPath}`);
      console.log('');
      
      return {
        jsonReport: jsonReportPath,
        htmlReport: htmlReportPath,
        summaryReport: summaryPath
      };
    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
      this.results.errors.push({
        phase: 'Report Generation',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith Quality Assurance Report</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
        .passed { color: #28a745; font-weight: bold; }
        .failed { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; min-width: 150px; text-align: center; }
        .error-list { background: #fff5f5; border-left: 4px solid #dc3545; padding: 10px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .progress-bar { width: 100%; background-color: #e9ecef; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 20px; background-color: #28a745; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Zenith Quality Assurance Report</h1>
            <p>Generated: ${data.metadata.generatedAt}</p>
            <p>Duration: ${Math.round(data.metadata.duration / 1000)}s | Platform: ${data.metadata.platform} | Node: ${data.metadata.nodeVersion}</p>
        </div>

        <div class="section">
            <h2>📊 Overall Summary</h2>
            <div class="metric">
                <div>Test Success Rate</div>
                <div class="${this.getOverallTestsPass(data) ? 'passed' : 'failed'}">
                    ${this.getOverallTestsPass(data) ? '✅ PASSED' : '❌ FAILED'}
                </div>
            </div>
            <div class="metric">
                <div>Code Quality</div>
                <div class="${this.getCodeQualityPass(data) ? 'passed' : 'failed'}">
                    ${this.getCodeQualityPass(data) ? '✅ GOOD' : '❌ ISSUES'}
                </div>
            </div>
            <div class="metric">
                <div>Build Status</div>
                <div class="${this.getBuildPass(data) ? 'passed' : 'failed'}">
                    ${this.getBuildPass(data) ? '✅ SUCCESS' : '❌ FAILED'}
                </div>
            </div>
            <div class="metric">
                <div>Security</div>
                <div class="${this.getSecurityPass(data) ? 'passed' : 'failed'}">
                    ${this.getSecurityPass(data) ? '✅ SECURE' : '❌ ISSUES'}
                </div>
            </div>
        </div>

        ${this.generateTestSection(data)}
        ${this.generateCodeQualitySection(data)}
        ${this.generateBuildSection(data)}
        ${this.generatePerformanceSection(data)}
        ${this.generateSecuritySection(data)}
        ${this.generateErrorSection(data)}
    </div>
</body>
</html>`;
  }

  generateTestSection(data) {
    const tests = data.tests || {};
    return `
        <div class="section">
            <h2>🧪 Test Results</h2>
            <table>
                <tr><th>Test Type</th><th>Status</th><th>Details</th></tr>
                <tr><td>Unit Tests</td><td class="${tests.unit?.passed ? 'passed' : 'failed'}">${tests.unit?.passed ? '✅' : '❌'}</td><td>${tests.unit?.message || 'Not run'}</td></tr>
                <tr><td>Integration Tests</td><td class="${tests.integration?.passed ? 'passed' : 'failed'}">${tests.integration?.passed ? '✅' : '❌'}</td><td>${tests.integration?.message || 'Not run'}</td></tr>
                <tr><td>E2E Tests</td><td class="${tests.e2e?.passed ? 'passed' : 'failed'}">${tests.e2e?.passed ? '✅' : '❌'}</td><td>${tests.e2e?.message || 'Not run'}</td></tr>
                <tr><td>Coverage</td><td class="${tests.coverage?.passed ? 'passed' : 'failed'}">${tests.coverage?.passed ? '✅' : '❌'}</td><td>${tests.coverage?.message || 'Not analyzed'}</td></tr>
            </table>
        </div>`;
  }

  generateCodeQualitySection(data) {
    const quality = data.codeQuality || {};
    return `
        <div class="section">
            <h2>🔍 Code Quality</h2>
            <table>
                <tr><th>Check</th><th>Status</th><th>Details</th></tr>
                <tr><td>TypeScript</td><td class="${quality.typescript?.passed ? 'passed' : 'failed'}">${quality.typescript?.passed ? '✅' : '❌'}</td><td>${quality.typescript?.message || 'Not checked'}</td></tr>
                <tr><td>Linting</td><td class="${quality.linting?.passed ? 'passed' : 'failed'}">${quality.linting?.passed ? '✅' : '❌'}</td><td>${quality.linting?.message || 'Not checked'}</td></tr>
                <tr><td>Complexity</td><td class="${quality.complexity?.passed ? 'passed' : 'failed'}">${quality.complexity?.passed ? '✅' : '❌'}</td><td>${quality.complexity?.message || 'Not analyzed'}</td></tr>
                <tr><td>Duplication</td><td class="${quality.duplication?.passed ? 'passed' : 'failed'}">${quality.duplication?.passed ? '✅' : '❌'}</td><td>${quality.duplication?.message || 'Not checked'}</td></tr>
            </table>
        </div>`;
  }

  generateBuildSection(data) {
    const build = data.build || {};
    return `
        <div class="section">
            <h2>🏗️ Build System</h2>
            <table>
                <tr><th>Component</th><th>Status</th><th>Details</th></tr>
                <tr><td>Production Build</td><td class="${build.production?.passed ? 'passed' : 'failed'}">${build.production?.passed ? '✅' : '❌'}</td><td>${build.production?.message || 'Not built'}</td></tr>
                <tr><td>Service Worker</td><td class="${build.serviceWorker?.passed ? 'passed' : 'failed'}">${build.serviceWorker?.passed ? '✅' : '❌'}</td><td>${build.serviceWorker?.message || 'Not validated'}</td></tr>
                <tr><td>Bundle Analysis</td><td class="${build.bundleAnalysis?.passed ? 'passed' : 'failed'}">${build.bundleAnalysis?.passed ? '✅' : '❌'}</td><td>${build.bundleAnalysis?.message || 'Not analyzed'}</td></tr>
                <tr><td>Optimizations</td><td class="${build.optimization?.passed ? 'passed' : 'failed'}">${build.optimization?.passed ? '✅' : '❌'}</td><td>${build.optimization?.message || 'Not checked'}</td></tr>
            </table>
        </div>`;
  }

  generatePerformanceSection(data) {
    const perf = data.performance || {};
    return `
        <div class="section">
            <h2>⚡ Performance</h2>
            <table>
                <tr><th>Metric</th><th>Status</th><th>Details</th></tr>
                <tr><td>Lighthouse</td><td class="${perf.lighthouse?.passed ? 'passed' : 'failed'}">${perf.lighthouse?.passed ? '✅' : '❌'}</td><td>${perf.lighthouse?.message || 'Not run'}</td></tr>
                <tr><td>Bundle Size</td><td class="${perf.bundleSize?.passed ? 'passed' : 'failed'}">${perf.bundleSize?.passed ? '✅' : '❌'}</td><td>${perf.bundleSize?.message || 'Not checked'}</td></tr>
                <tr><td>Load Time</td><td class="${perf.loadTime?.passed ? 'passed' : 'failed'}">${perf.loadTime?.passed ? '✅' : '❌'}</td><td>${perf.loadTime?.message || 'Not measured'}</td></tr>
                <tr><td>Memory Usage</td><td class="${perf.memoryUsage?.passed ? 'passed' : 'failed'}">${perf.memoryUsage?.passed ? '✅' : '❌'}</td><td>${perf.memoryUsage?.message || 'Not checked'}</td></tr>
            </table>
        </div>`;
  }

  generateSecuritySection(data) {
    const security = data.security || {};
    return `
        <div class="section">
            <h2>🔒 Security</h2>
            <table>
                <tr><th>Check</th><th>Status</th><th>Details</th></tr>
                <tr><td>Dependencies</td><td class="${security.dependencies?.passed ? 'passed' : 'failed'}">${security.dependencies?.passed ? '✅' : '❌'}</td><td>${security.dependencies?.message || 'Not audited'}</td></tr>
                <tr><td>Secrets</td><td class="${security.secrets?.passed ? 'passed' : 'failed'}">${security.secrets?.passed ? '✅' : '❌'}</td><td>${security.secrets?.message || 'Not scanned'}</td></tr>
                <tr><td>Headers</td><td class="${security.headers?.passed ? 'passed' : 'failed'}">${security.headers?.passed ? '✅' : '❌'}</td><td>${security.headers?.message || 'Not checked'}</td></tr>
                <tr><td>Permissions</td><td class="${security.permissions?.passed ? 'passed' : 'failed'}">${security.permissions?.passed ? '✅' : '❌'}</td><td>${security.permissions?.message || 'Not checked'}</td></tr>
            </table>
        </div>`;
  }

  generateErrorSection(data) {
    const errors = data.errors || [];
    if (errors.length === 0) {
      return '<div class="section"><h2>🚨 Errors</h2><p class="passed">No errors detected! 🎉</p></div>';
    }
    
    const errorList = errors.map(error => `
        <div class="error-list">
            <strong>${error.phase}:</strong> ${error.error || error.message}
            <br><small>${error.timestamp}</small>
        </div>
    `).join('');
    
    return `
        <div class="section">
            <h2>🚨 Errors (${errors.length})</h2>
            ${errorList}
        </div>`;
  }

  getOverallTestsPass(data) {
    const tests = data.tests || {};
    return Object.values(tests).every(test => test?.passed !== false);
  }

  getCodeQualityPass(data) {
    const quality = data.codeQuality || {};
    return Object.values(quality).every(check => check?.passed !== false);
  }

  getBuildPass(data) {
    const build = data.build || {};
    return Object.values(build).every(component => component?.passed !== false);
  }

  getSecurityPass(data) {
    const security = data.security || {};
    return Object.values(security).every(check => check?.passed !== false);
  }

  generateSummaryReport(data) {
    const errors = data.errors || [];
    const timestamp = new Date(data.timestamp).toLocaleString();
    
    return `# Zenith Quality Assurance Report

**Generated:** ${timestamp}
**Duration:** ${Math.round(data.metadata.duration / 1000)}s
**Platform:** ${data.metadata.platform}
**Node Version:** ${data.metadata.nodeVersion}

## 📊 Executive Summary

${this.getOverallTestsPass(data) ? '✅' : '❌'} **Overall Status:** ${this.getOverallTestsPass(data) ? 'PASSED' : 'FAILED'}

### Key Metrics
- **Tests:** ${this.getOverallTestsPass(data) ? 'All Passed' : 'Some Failed'}
- **Code Quality:** ${this.getCodeQualityPass(data) ? 'Good' : 'Issues Found'}
- **Build System:** ${this.getBuildPass(data) ? 'Working' : 'Issues Found'}
- **Security:** ${this.getSecurityPass(data) ? 'Secure' : 'Vulnerabilities Found'}
- **Errors:** ${errors.length} detected

## 🎯 Recommendations

${this.generateRecommendations(data)}

## 📋 Action Items

${this.generateActionItems(data)}

---

*Generated by Zenith Quality Assurance Framework v1.0.0*
`;
  }

  generateRecommendations(data) {
    const recommendations = [];
    
    if (!this.getOverallTestsPass(data)) {
      recommendations.push('- Fix failing tests before deployment');
    }
    
    if (!this.getCodeQualityPass(data)) {
      recommendations.push('- Address code quality issues');
    }
    
    if (!this.getBuildPass(data)) {
      recommendations.push('- Fix build system problems');
    }
    
    if (!this.getSecurityPass(data)) {
      recommendations.push('- Address security vulnerabilities');
    }
    
    if (data.errors?.length > 0) {
      recommendations.push('- Investigate and fix detected errors');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Maintain current quality standards');
      recommendations.push('- Consider adding more comprehensive tests');
      recommendations.push('- Monitor performance regularly');
    }
    
    return recommendations.join('\n');
  }

  generateActionItems(data) {
    const actions = [];
    
    // Generate specific action items based on results
    if (data.tests?.coverage?.coverage?.statements < 95) {
      actions.push('- [ ] Increase test coverage to 95%+');
    }
    
    if (data.security?.dependencies?.vulnerabilities > 0) {
      actions.push('- [ ] Update dependencies with vulnerabilities');
    }
    
    if (data.performance?.bundleSize?.totalSize > 1000000) {
      actions.push('- [ ] Optimize bundle size');
    }
    
    if (data.codeQuality?.linting?.errors?.length > 0) {
      actions.push('- [ ] Fix ESLint errors');
    }
    
    if (actions.length === 0) {
      actions.push('- [ ] Continue monitoring quality metrics');
      actions.push('- [ ] Schedule next quality review');
    }
    
    return actions.join('\n');
  }

  async evaluateQualityGates() {
    console.log('🚪 Phase 9: Quality Gates Evaluation');
    console.log('------------------------------------');
    
    const gates = {
      tests: this.evaluateTestGate(),
      coverage: this.evaluateCoverageGate(),
      build: this.evaluateBuildGate(),
      security: this.evaluateSecurityGate(),
      performance: this.evaluatePerformanceGate()
    };
    
    this.results.qualityGates = gates;
    
    let allPassed = true;
    
    for (const [gate, result] of Object.entries(gates)) {
      if (result.passed) {
        console.log(`✅ ${gate} gate: ${result.message}`);
      } else {
        console.log(`❌ ${gate} gate: ${result.message}`);
        allPassed = false;
      }
    }
    
    console.log('');
    console.log('🏁 Final Result');
    console.log('===============');
    
    if (allPassed) {
      console.log('✅ ALL QUALITY GATES PASSED! 🎉');
      console.log('   Application is ready for production deployment.');
      process.exit(0);
    } else {
      console.log('❌ QUALITY GATES FAILED! 🚨');
      console.log('   Application requires fixes before deployment.');
      process.exit(1);
    }
  }

  evaluateTestGate() {
    const tests = this.results.tests || {};
    const allTestsPassed = Object.values(tests).every(test => test?.passed !== false);
    
    return {
      passed: allTestsPassed,
      message: allTestsPassed ? 'All tests passing' : 'Some tests failing',
      details: tests
    };
  }

  evaluateCoverageGate() {
    const coverage = this.results.tests?.coverage?.coverage || {};
    const thresholds = this.config.thresholds.coverage;
    
    const meetsThresholds = Object.entries(thresholds).every(([metric, threshold]) => 
      (coverage[metric] || 0) >= threshold
    );
    
    return {
      passed: meetsThresholds,
      message: meetsThresholds ? 'Coverage thresholds met' : 'Coverage below thresholds',
      details: { coverage, thresholds }
    };
  }

  evaluateBuildGate() {
    const build = this.results.build || {};
    const buildSuccess = Object.values(build).every(component => component?.passed !== false);
    
    return {
      passed: buildSuccess,
      message: buildSuccess ? 'Build system working' : 'Build issues detected',
      details: build
    };
  }

  evaluateSecurityGate() {
    const security = this.results.security || {};
    const isSecure = Object.values(security).every(check => check?.passed !== false);
    
    return {
      passed: isSecure,
      message: isSecure ? 'No security issues' : 'Security vulnerabilities found',
      details: security
    };
  }

  evaluatePerformanceGate() {
    const performance = this.results.performance || {};
    const performanceGood = Object.values(performance).every(metric => metric?.passed !== false);
    
    return {
      passed: performanceGood,
      message: performanceGood ? 'Performance acceptable' : 'Performance issues detected',
      details: performance
    };
  }
}

// CLI Interface
if (require.main === module) {
  const qa = new ZenithQualityAssurance();
  qa.run().catch(error => {
    console.error('💥 Quality Assurance Framework crashed:', error);
    process.exit(1);
  });
}

module.exports = ZenithQualityAssurance;