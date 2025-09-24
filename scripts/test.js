#!/usr/bin/env node

/**
 * Advanced Test Runner Script
 * 
 * This script provides additional testing utilities and commands
 * beyond the basic Jest configuration.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const COMMANDS = {
  unit: 'jest --testPathPattern="__tests__/(components|hooks|lib|utils)"',
  integration: 'jest --testPathPattern="__tests__/(api|integration)"',
  e2e: 'jest --testPathPattern="__tests__/e2e"',
  coverage: 'jest --coverage --watchAll=false',
  'coverage-open': 'jest --coverage --watchAll=false && open-cli coverage/lcov-report/index.html',
  watch: 'jest --watch',
  'watch-all': 'jest --watchAll',
  ci: 'jest --ci --coverage --watchAll=false --passWithNoTests',
  debug: 'node --inspect-brk node_modules/.bin/jest --runInBand --no-coverage',
  update: 'jest --updateSnapshot',
  clear: 'jest --clearCache',
}

function printHelp() {
  console.log(`
🧪 Ultimate Digital Planner Test Runner

Available commands:
  
  📦 Test Types:
    unit           Run unit tests (components, hooks, utils)
    integration    Run integration tests (API, workflows)
    e2e           Run end-to-end tests
  
  📊 Coverage & Reporting:
    coverage      Generate coverage report
    coverage-open Generate coverage report and open in browser
  
  🔍 Development:
    watch         Run tests in watch mode (changed files)
    watch-all     Run all tests in watch mode
    debug         Run tests in debug mode
  
  🔄 Maintenance:
    update        Update test snapshots
    clear         Clear Jest cache
    ci            Run tests in CI mode
  
  Usage:
    npm run test:unit
    npm run test:integration
    npm run test:coverage
    
  Or directly:
    node scripts/test.js unit
    node scripts/test.js coverage
`)
}

function runCommand(command) {
  try {
    console.log(`🚀 Running: ${command}\n`)
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { 
        ...process.env,
        NODE_ENV: 'test'
      }
    })
  } catch (error) {
    console.error(`❌ Command failed with exit code ${error.status}`)
    process.exit(error.status || 1)
  }
}

function checkTestHealth() {
  console.log('🔍 Checking test environment health...\n')
  
  // Check if Jest config exists
  const jestConfig = path.join(process.cwd(), 'jest.config.js')
  const jestSetup = path.join(process.cwd(), 'jest.setup.js')
  
  console.log(`✅ Jest config: ${fs.existsSync(jestConfig) ? 'Found' : '❌ Missing'}`)
  console.log(`✅ Jest setup: ${fs.existsSync(jestSetup) ? 'Found' : '❌ Missing'}`)
  
  // Check test directories
  const testDir = path.join(process.cwd(), 'src', '__tests__')
  const hasTests = fs.existsSync(testDir)
  
  console.log(`✅ Test directory: ${hasTests ? 'Found' : '❌ Missing'}`)
  
  if (hasTests) {
    const testFiles = fs.readdirSync(testDir, { recursive: true })
      .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
    
    console.log(`✅ Test files found: ${testFiles.length}`)
    
    // Show test distribution
    const distribution = testFiles.reduce((acc, file) => {
      const category = file.split('/')[0] || 'root'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 Test distribution:')
    Object.entries(distribution).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} tests`)
    })
  }
  
  console.log('\n🔧 Environment variables:')
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
  console.log(`   CI: ${process.env.CI || 'not set'}`)
  
  console.log('\n')
}

function generateTestReport() {
  console.log('📋 Generating comprehensive test report...\n')
  
  try {
    // Run tests with JSON reporter
    const reportCommand = 'jest --json --outputFile=test-results.json --passWithNoTests'
    execSync(reportCommand, { stdio: 'pipe' })
    
    // Read the JSON report
    const reportPath = path.join(process.cwd(), 'test-results.json')
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      
      console.log('📊 Test Summary:')
      console.log(`   Total Tests: ${report.numTotalTests}`)
      console.log(`   Passed: ${report.numPassedTests}`)
      console.log(`   Failed: ${report.numFailedTests}`)
      console.log(`   Skipped: ${report.numPendingTests}`)
      console.log(`   Success Rate: ${((report.numPassedTests / report.numTotalTests) * 100).toFixed(1)}%`)
      console.log(`   Runtime: ${(report.testResults.reduce((sum, result) => sum + result.perfStats.runtime, 0) / 1000).toFixed(2)}s`)
      
      // Show slowest tests
      if (report.testResults.length > 0) {
        console.log('\n⏱️  Slowest Tests:')
        const slowTests = report.testResults
          .sort((a, b) => b.perfStats.runtime - a.perfStats.runtime)
          .slice(0, 5)
        
        slowTests.forEach((test, index) => {
          const filename = path.basename(test.name)
          const runtime = (test.perfStats.runtime / 1000).toFixed(2)
          console.log(`   ${index + 1}. ${filename} - ${runtime}s`)
        })
      }
      
      // Clean up
      fs.unlinkSync(reportPath)
    }
    
  } catch (error) {
    console.error('❌ Failed to generate test report:', error.message)
  }
}

// Main execution
const args = process.argv.slice(2)
const command = args[0]

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp()
  process.exit(0)
}

if (command === 'health') {
  checkTestHealth()
  process.exit(0)
}

if (command === 'report') {
  generateTestReport()
  process.exit(0)
}

if (COMMANDS[command]) {
  runCommand(COMMANDS[command])
} else {
  console.error(`❌ Unknown command: ${command}`)
  console.log('\nRun "node scripts/test.js help" for available commands')
  process.exit(1)
}