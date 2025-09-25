#!/usr/bin/env node

/**
 * Astral Planner Environment Setup Script
 * 
 * This script helps you configure your environment variables
 * and set up the necessary services for the Astral Planner application.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function generateSecretKey(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function setupEnvironment() {
  console.log('🚀 Welcome to Astral Planner Environment Setup!\n');
  
  const environment = await prompt('Which environment are you setting up? (development/production): ');
  const isDevelopment = environment.toLowerCase() === 'development';
  
  console.log(`\n🔧 Setting up ${isDevelopment ? 'development' : 'production'} environment...\n`);
  
  const envVars = {
    NODE_ENV: isDevelopment ? 'development' : 'production',
    NEXT_PUBLIC_APP_URL: isDevelopment ? 'http://localhost:3000' : '',
    ENABLE_TEST_USER: isDevelopment ? 'true' : 'false',
    LOG_LEVEL: isDevelopment ? 'debug' : 'info',
  };
  
  // Required Stack Auth Configuration
  console.log('📝 Stack Auth Configuration (Required):');
  envVars.STACK_PROJECT_ID = await prompt('Enter your Stack Auth Project ID: ');
  envVars.STACK_SECRET_SERVER_KEY = await prompt('Enter your Stack Auth Secret Server Key: ');
  envVars.STACK_PUBLISHABLE_CLIENT_KEY = await prompt('Enter your Stack Auth Publishable Client Key: ');
  
  // Required Database Configuration
  console.log('\n🗄️  Database Configuration (Required):');
  const databaseUrl = await prompt('Enter your PostgreSQL Database URL: ');
  envVars.DATABASE_URL = databaseUrl;
  envVars.DIRECT_DATABASE_URL = databaseUrl;
  
  if (!isDevelopment) {
    envVars.NEXT_PUBLIC_APP_URL = await prompt('Enter your production domain (https://your-domain.com): ');
  }
  
  // Optional AI Integration
  console.log('\n🤖 AI Integration (Optional - press Enter to skip):');
  const openaiKey = await prompt('Enter your OpenAI API Key (optional): ');
  if (openaiKey) {
    envVars.OPENAI_API_KEY = openaiKey;
    const openaiOrg = await prompt('Enter your OpenAI Organization ID (optional): ');
    if (openaiOrg) {
      envVars.OPENAI_ORGANIZATION = openaiOrg;
    }
  }
  
  // Optional Real-time Features
  console.log('\n⚡ Real-time Features (Optional - press Enter to skip):');
  const pusherAppId = await prompt('Enter your Pusher App ID (optional): ');
  if (pusherAppId) {
    envVars.PUSHER_APP_ID = pusherAppId;
    envVars.PUSHER_SECRET = await prompt('Enter your Pusher Secret: ');
    envVars.NEXT_PUBLIC_PUSHER_KEY = await prompt('Enter your Pusher Key: ');
    envVars.NEXT_PUBLIC_PUSHER_CLUSTER = await prompt('Enter your Pusher Cluster (default: us2): ') || 'us2';
  }
  
  // Optional Email Service
  console.log('\n📧 Email Service (Optional - press Enter to skip):');
  const resendKey = await prompt('Enter your Resend API Key (optional): ');
  if (resendKey) {
    envVars.RESEND_API_KEY = resendKey;
  }
  
  // Generate secure keys
  envVars.SESSION_SECRET = generateSecretKey(64);
  envVars.JWT_SECRET = generateSecretKey(32);
  
  // Feature flags
  envVars.NEXT_PUBLIC_FEATURE_AI_PARSING = openaiKey ? 'true' : 'false';
  envVars.NEXT_PUBLIC_FEATURE_CALENDAR_INTEGRATION = 'false'; // Will be enabled when Google Calendar is configured
  envVars.NEXT_PUBLIC_FEATURE_REALTIME_COLLABORATION = pusherAppId ? 'true' : 'false';
  envVars.NEXT_PUBLIC_FEATURE_ANALYTICS = 'true';
  envVars.NEXT_PUBLIC_FEATURE_TEMPLATES = 'true';
  
  // Database Pool Configuration
  envVars.DB_POOL_MAX = isDevelopment ? '10' : '20';
  envVars.DB_POOL_MIN = isDevelopment ? '2' : '5';
  envVars.DB_IDLE_TIMEOUT = '30000';
  envVars.DB_CONNECTION_TIMEOUT = '5000';
  
  // Create .env file
  const envFileName = '.env.local';
  let envContent = `# Astral Planner Environment Configuration\n`;
  envContent += `# Generated on ${new Date().toISOString()}\n`;
  envContent += `# Environment: ${isDevelopment ? 'development' : 'production'}\n\n`;
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      envContent += `${key}=${value}\n`;
    }
  }
  
  fs.writeFileSync(envFileName, envContent);
  
  console.log(`\n✅ Environment configuration saved to ${envFileName}\n`);
  
  // Next steps
  console.log('🎉 Setup Complete! Next steps:\n');
  console.log('1. Review and customize your .env.local file if needed');
  console.log('2. Set up your PostgreSQL database');
  console.log('3. Run database migrations: npm run db:migrate');
  console.log('4. Seed your database: npm run db:seed');
  console.log('5. Start the development server: npm run dev\n');
  
  if (!isDevelopment) {
    console.log('Production-specific steps:');
    console.log('6. Configure your hosting platform (Vercel, etc.) with these environment variables');
    console.log('7. Set up monitoring with Sentry (optional but recommended)');
    console.log('8. Configure your CDN and caching layer');
    console.log('9. Set up backup and disaster recovery\n');
  }
  
  console.log('📚 For more information, check the documentation at:');
  console.log('   https://github.com/your-repo/astral-planner\n');
  
  const openDocs = await prompt('Would you like to open the documentation? (y/n): ');
  if (openDocs.toLowerCase() === 'y' || openDocs.toLowerCase() === 'yes') {
    const { exec } = require('child_process');
    exec('start https://github.com/your-repo/astral-planner'); // Opens in default browser on Windows
  }
  
  rl.close();
}

// Handle errors gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Setup cancelled by user');
  rl.close();
  process.exit(0);
});

setupEnvironment().catch((error) => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});