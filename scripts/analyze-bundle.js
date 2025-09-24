#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  log(`\n${colors.bold}=== ${message} ===${colors.reset}`)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function analyzeBundleSize() {
  logHeader('Bundle Size Analysis')
  
  try {
    // Run bundle analyzer
    log('Building with bundle analyzer...', 'blue')
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' })
    
    // Check if .next/analyze exists
    const analyzeDir = path.join(process.cwd(), '.next', 'analyze')
    if (fs.existsSync(analyzeDir)) {
      log('Bundle analysis complete! Check the generated report.', 'green')
    } else {
      log('Bundle analyzer did not generate expected output', 'yellow')
    }
    
  } catch (error) {
    log(`Bundle analysis failed: ${error.message}`, 'red')
  }
}

async function checkBundleSizes() {
  logHeader('Bundle Size Check')
  
  const nextDir = path.join(process.cwd(), '.next')
  const staticDir = path.join(nextDir, 'static')
  
  if (!fs.existsSync(staticDir)) {
    log('No build found. Run "npm run build" first.', 'yellow')
    return
  }
  
  // Check JavaScript chunks
  const chunksDir = path.join(staticDir, 'chunks')
  if (fs.existsSync(chunksDir)) {
    const chunks = fs.readdirSync(chunksDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(chunksDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          path: filePath
        }
      })
      .sort((a, b) => b.size - a.size)
    
    log('\nLargest JavaScript chunks:')
    chunks.slice(0, 10).forEach((chunk, index) => {
      const color = chunk.size > 1024 * 1024 ? 'red' : chunk.size > 500 * 1024 ? 'yellow' : 'green'
      log(`${index + 1}. ${chunk.name}: ${formatBytes(chunk.size)}`, color)
    })
    
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    log(`\nTotal JavaScript size: ${formatBytes(totalSize)}`, 'bold')
    
    // Recommendations
    if (totalSize > 5 * 1024 * 1024) {
      log('\n⚠️  Bundle size is quite large (>5MB). Consider:', 'yellow')
      log('  - Code splitting with dynamic imports')
      log('  - Removing unused dependencies')
      log('  - Using smaller alternatives for large libraries')
    } else if (totalSize > 2 * 1024 * 1024) {
      log('\n⚠️  Bundle size is getting large (>2MB). Monitor closely.', 'yellow')
    } else {
      log('\n✅ Bundle size looks good!', 'green')
    }
  }
}

async function checkDuplicates() {
  logHeader('Duplicate Package Check')
  
  try {
    const result = execSync('npm ls --depth=0 --json', { encoding: 'utf8' })
    const packageInfo = JSON.parse(result)
    
    // Check for common duplicates
    const packages = Object.keys(packageInfo.dependencies || {})
    const duplicateCandidates = [
      'react', 'react-dom', 'lodash', 'moment', 'date-fns',
      '@types/react', '@types/node'
    ]
    
    const found = packages.filter(pkg => 
      duplicateCandidates.some(candidate => pkg.includes(candidate))
    )
    
    if (found.length > 0) {
      log('Packages that might have duplicates:', 'yellow')
      found.forEach(pkg => log(`  - ${pkg}`))
    } else {
      log('No obvious duplicate candidates found', 'green')
    }
    
  } catch (error) {
    log(`Could not check for duplicates: ${error.message}`, 'red')
  }
}

async function generateReport() {
  logHeader('Performance Optimization Report')
  
  const report = {
    timestamp: new Date().toISOString(),
    recommendations: [],
    metrics: {}
  }
  
  // Bundle size recommendations
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const deps = Object.keys(packageJson.dependencies || {})
    
    const largeDependencies = [
      'moment', // Use date-fns instead
      'lodash', // Use specific lodash functions
      'antd',   // Large UI library
      'material-ui',
      'bootstrap'
    ]
    
    const foundLarge = deps.filter(dep => largeDependencies.includes(dep))
    if (foundLarge.length > 0) {
      report.recommendations.push({
        type: 'bundle-size',
        severity: 'warning',
        message: `Large dependencies found: ${foundLarge.join(', ')}`,
        suggestion: 'Consider smaller alternatives or tree shaking'
      })
    }
    
  } catch (error) {
    log(`Could not analyze dependencies: ${error.message}`, 'red')
  }
  
  // Next.js config recommendations
  const nextConfigPath = path.join(process.cwd(), 'next.config.js')
  if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, 'utf8')
    
    if (!configContent.includes('experimental')) {
      report.recommendations.push({
        type: 'config',
        severity: 'info',
        message: 'Consider enabling experimental optimizations in next.config.js',
        suggestion: 'Add experimental.optimizePackageImports for better tree shaking'
      })
    }
    
    if (!configContent.includes('compress')) {
      report.recommendations.push({
        type: 'config',
        severity: 'info', 
        message: 'Compression not explicitly enabled',
        suggestion: 'Add compress: true in next.config.js'
      })
    }
  }
  
  // Save report
  const reportsDir = path.join(process.cwd(), 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  
  const reportPath = path.join(reportsDir, `performance-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  log(`\nReport saved to: ${reportPath}`, 'green')
  
  // Display recommendations
  if (report.recommendations.length > 0) {
    log('\nRecommendations:', 'bold')
    report.recommendations.forEach(rec => {
      const color = rec.severity === 'error' ? 'red' : rec.severity === 'warning' ? 'yellow' : 'blue'
      log(`  ${rec.severity.toUpperCase()}: ${rec.message}`, color)
      log(`    💡 ${rec.suggestion}`)
    })
  } else {
    log('\n✅ No specific recommendations at this time', 'green')
  }
}

async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'analyze':
      await analyzeBundleSize()
      break
    case 'size':
      await checkBundleSizes()
      break
    case 'duplicates':
      await checkDuplicates()
      break
    case 'report':
      await generateReport()
      break
    case 'all':
      await checkBundleSizes()
      await checkDuplicates()
      await generateReport()
      break
    default:
      log('Bundle Analyzer Tool', 'bold')
      log('\nCommands:')
      log('  analyze     - Run interactive bundle analyzer')
      log('  size        - Check current bundle sizes')
      log('  duplicates  - Check for duplicate packages')
      log('  report      - Generate optimization report')
      log('  all         - Run all checks')
      log('\nUsage: node scripts/analyze-bundle.js [command]')
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`Error: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = {
  analyzeBundleSize,
  checkBundleSizes,
  checkDuplicates,
  generateReport
}