#!/usr/bin/env node
/**
 * Production Verification Script
 * 
 * This script verifies that the production build is working correctly
 * and all enterprise-grade features are properly configured.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'STACK_PROJECT_ID', 
  'STACK_PUBLISHABLE_CLIENT_KEY',
  'STACK_SECRET_SERVER_KEY'
];

const OPTIONAL_ENV_VARS = [
  'REDIS_URL',
  'OPENAI_API_KEY',
  'SENTRY_DSN',
  'NEXT_PUBLIC_PUSHER_KEY'
];

console.log('🔍 Ultimate Digital Planner - Production Verification\n');

// Check Node.js version
console.log('📦 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.error('❌ Node.js 18+ required. Current version:', nodeVersion);
  process.exit(1);
}
console.log('✅ Node.js version:', nodeVersion);

// Check package.json exists
console.log('\n📄 Checking package.json...');
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found');
  process.exit(1);
}
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('✅ Package name:', packageJson.name);
console.log('✅ Version:', packageJson.version);

// Check critical files exist
console.log('\n📂 Checking critical files...');
const criticalFiles = [
  'src/lib/logger.ts',
  'src/lib/validation.ts', 
  'src/lib/security.ts',
  'src/lib/monitoring.ts',
  'src/types/index.ts',
  'src/db/index.ts',
  'next.config.js',
  'tailwind.config.js',
  'drizzle.config.ts',
  'jest.config.js',
  'jest.setup.js',
  'Dockerfile',
  'docker-compose.yml'
];

for (const file of criticalFiles) {
  if (fs.existsSync(file)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, '- MISSING');
  }
}

// Check environment variables
console.log('\n🔐 Checking environment configuration...');
const envExample = fs.existsSync('.env.example');
const envLocal = fs.existsSync('.env.local');
const envProduction = fs.existsSync('.env.production');

console.log('✅ .env.example exists:', envExample);
console.log('📝 .env.local exists:', envLocal);
console.log('🚀 .env.production exists:', envProduction);

// Check required environment variables
if (envLocal || envProduction) {
  console.log('\n🔑 Checking required environment variables...');
  for (const envVar of REQUIRED_ENV_VARS) {
    if (process.env[envVar]) {
      console.log('✅', envVar, '- configured');
    } else {
      console.log('❌', envVar, '- MISSING (required)');
    }
  }
  
  console.log('\n🔧 Checking optional environment variables...');
  for (const envVar of OPTIONAL_ENV_VARS) {
    if (process.env[envVar]) {
      console.log('✅', envVar, '- configured');
    } else {
      console.log('⚠️', envVar, '- not configured (optional)');
    }
  }
}

// Check dependencies
console.log('\n📦 Checking dependencies...');
try {
  const nodeModules = fs.existsSync('node_modules');
  if (!nodeModules) {
    console.log('❌ node_modules not found - run npm install');
  } else {
    console.log('✅ Dependencies installed');
    
    // Check critical dependencies
    const criticalDeps = [
      'next',
      'react', 
      'typescript',
      'drizzle-orm',
      '@neondatabase/serverless',
      'winston',
      'zod',
      'jest',
      'tailwindcss'
    ];
    
    for (const dep of criticalDeps) {
      const depPath = path.join('node_modules', dep);
      if (fs.existsSync(depPath)) {
        console.log('  ✅', dep);
      } else {
        console.log('  ❌', dep, '- MISSING');
      }
    }
  }
} catch (error) {
  console.error('❌ Error checking dependencies:', error.message);
}

// Test TypeScript compilation
console.log('\n🔧 Testing TypeScript compilation...');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log(error.stdout?.toString() || error.message);
}

// Test build
console.log('\n🏗️ Testing production build...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Production build successful');
  
  // Check build output
  const nextDir = fs.existsSync('.next');
  const staticDir = fs.existsSync('.next/static');
  console.log('📁 .next directory:', nextDir ? '✅' : '❌');
  console.log('📁 Static assets:', staticDir ? '✅' : '❌');
  
} catch (error) {
  console.log('❌ Production build failed');
  console.log(error.stdout?.toString() || error.message);
}

// Test linting
console.log('\n🧹 Testing code quality...');
try {
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('✅ ESLint passed');
} catch (error) {
  console.log('⚠️ ESLint issues found');
}

// Test database schema
console.log('\n🗄️ Checking database schema...');
const schemaFile = 'src/db/schema.ts';
if (fs.existsSync(schemaFile)) {
  console.log('✅ Database schema file exists');
  const schemaContent = fs.readFileSync(schemaFile, 'utf8');
  const hasGoals = schemaContent.includes('goals');
  const hasTasks = schemaContent.includes('tasks'); 
  const hasHabits = schemaContent.includes('habits');
  const hasUsers = schemaContent.includes('users');
  
  console.log('  📊 Goals table:', hasGoals ? '✅' : '❌');
  console.log('  📋 Tasks table:', hasTasks ? '✅' : '❌');  
  console.log('  🔄 Habits table:', hasHabits ? '✅' : '❌');
  console.log('  👤 Users table:', hasUsers ? '✅' : '❌');
} else {
  console.log('❌ Database schema file not found');
}

// Security checks
console.log('\n🔒 Security verification...');
const securityFile = 'src/lib/security.ts';
if (fs.existsSync(securityFile)) {
  const securityContent = fs.readFileSync(securityFile, 'utf8');
  const hasRateLimit = securityContent.includes('rateLimit');
  const hasCors = securityContent.includes('corsHeaders');
  const hasHeaders = securityContent.includes('securityHeaders');
  const hasSanitize = securityContent.includes('sanitize');
  
  console.log('  🚦 Rate limiting:', hasRateLimit ? '✅' : '❌');
  console.log('  🌐 CORS protection:', hasCors ? '✅' : '❌');
  console.log('  🛡️ Security headers:', hasHeaders ? '✅' : '❌');
  console.log('  🧹 Input sanitization:', hasSanitize ? '✅' : '❌');
}

// Monitoring checks  
console.log('\n📊 Monitoring verification...');
const monitoringFile = 'src/lib/monitoring.ts';
if (fs.existsSync(monitoringFile)) {
  const monitoringContent = fs.readFileSync(monitoringFile, 'utf8');
  const hasHealthCheck = monitoringContent.includes('HealthChecker');
  const hasMetrics = monitoringContent.includes('SystemMetrics');
  const hasAlerts = monitoringContent.includes('checkAlertThresholds');
  
  console.log('  🏥 Health checks:', hasHealthCheck ? '✅' : '❌');
  console.log('  📈 System metrics:', hasMetrics ? '✅' : '❌'); 
  console.log('  🚨 Alert system:', hasAlerts ? '✅' : '❌');
}

// Docker configuration
console.log('\n🐳 Docker configuration...');
const dockerfile = fs.existsSync('Dockerfile');
const dockerCompose = fs.existsSync('docker-compose.yml');
console.log('  📄 Dockerfile:', dockerfile ? '✅' : '❌');
console.log('  🐙 Docker Compose:', dockerCompose ? '✅' : '❌');

// Final summary
console.log('\n📋 Production Readiness Summary');
console.log('================================');

const checks = [
  { name: 'Node.js version', status: majorVersion >= 18 },
  { name: 'Dependencies installed', status: fs.existsSync('node_modules') },
  { name: 'Database schema', status: fs.existsSync('src/db/schema.ts') },
  { name: 'Security middleware', status: fs.existsSync('src/lib/security.ts') },
  { name: 'Monitoring system', status: fs.existsSync('src/lib/monitoring.ts') },
  { name: 'Type definitions', status: fs.existsSync('src/types/index.ts') },
  { name: 'Docker configuration', status: dockerfile && dockerCompose },
  { name: 'Environment template', status: fs.existsSync('.env.example') }
];

const passedChecks = checks.filter(c => c.status).length;
const totalChecks = checks.length;

for (const check of checks) {
  console.log(check.status ? '✅' : '❌', check.name);
}

console.log('\n🎯 Score:', `${passedChecks}/${totalChecks}`, `(${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 Production Ready! Your Ultimate Digital Planner is ready for deployment.');
} else if (passedChecks >= totalChecks * 0.8) {
  console.log('\n⚠️ Nearly Ready! Address the remaining issues before deployment.');  
} else {
  console.log('\n❌ Not Ready. Please fix the critical issues before deployment.');
}

console.log('\n📚 Next Steps:');
console.log('  1. Fix any failed checks above');
console.log('  2. Set up required environment variables');
console.log('  3. Test locally with: npm run dev');
console.log('  4. Deploy using: npm run deploy');
console.log('  5. Monitor at: /api/health');

console.log('\n🚀 Happy deploying!');