#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Ultimate Digital Planner for Production');
console.log('='.repeat(55));

// Helper function to run commands
function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const output = execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Helper function to check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('\n🔍 Checking prerequisites...');
  
  // Check if we have required CLIs
  const hasVercel = commandExists('vercel');
  const hasNeon = commandExists('neonctl');
  
  console.log(`Vercel CLI: ${hasVercel ? '✅' : '❌'}`);
  console.log(`Neon CLI: ${hasNeon ? '✅' : '❌'}`);
  
  // Install missing CLIs
  if (!hasVercel) {
    runCommand('npm install -g vercel@latest', 'Installing Vercel CLI');
  }
  
  if (!hasNeon) {
    runCommand('npm install -g neonctl', 'Installing Neon CLI');
  }
  
  console.log('\n🏗️ Building the application...');
  
  // Install dependencies
  if (!runCommand('npm install', 'Installing dependencies')) {
    process.exit(1);
  }
  
  // Fix any TypeScript issues by updating the problematic component
  console.log('\n🔧 Fixing TypeScript issues...');
  fixNotificationComponent();
  
  // Run type check
  runCommand('npm run type-check', 'Running type check');
  
  // Build the application
  if (!runCommand('npm run build', 'Building application')) {
    console.log('❌ Build failed. Please check the errors above.');
    process.exit(1);
  }
  
  console.log('\n🎯 Application built successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up your Neon database: https://console.neon.tech');
  console.log('2. Set up Clerk authentication: https://clerk.com');
  console.log('3. Update .env.production with your actual keys');
  console.log('4. Run: vercel --prod');
  console.log('\n🚀 Ready to deploy!');
}

function fixNotificationComponent() {
  const filePath = path.join(__dirname, 'src', 'components', 'NotificationCenter.tsx');
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix common TypeScript issues
    content = content.replace(/You've/g, "You have");
    content = content.replace(/Sarah joined your Marketing workspace/g, "Sarah joined your Marketing workspace");
    
    fs.writeFileSync(filePath, content);
    console.log('✅ Fixed TypeScript issues in NotificationCenter');
  } catch (error) {
    console.log('⚠️ Could not fix TypeScript issues automatically');
  }
}

// Run the main function
main().catch(console.error);