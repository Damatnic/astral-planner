#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Setting up Environment Variables for Ultimate Digital Planner');
console.log('=' .repeat(65));

// Environment variables to set
const envVars = [
  {
    name: 'DATABASE_URL',
    value: 'your-neon-database-url-here',
    description: 'Neon PostgreSQL database connection'
  },
  {
    name: 'OPENAI_API_KEY',
    value: 'your-openai-api-key-here',
    description: 'OpenAI API key for AI features'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    value: 'https://ultimate-digital-planner.vercel.app',
    description: 'Production app URL'
  },
  {
    name: 'NODE_ENV',
    value: 'production',
    description: 'Environment mode'
  },
  // Auth credentials - need to be set up
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    value: 'NEEDS_SETUP',
    description: 'Clerk publishable key - Set up at clerk.com'
  },
  {
    name: 'CLERK_SECRET_KEY',
    value: 'NEEDS_SETUP',
    description: 'Clerk secret key - Set up at clerk.com'
  },
  // Real-time features - need to be set up  
  {
    name: 'NEXT_PUBLIC_PUSHER_KEY',
    value: 'NEEDS_SETUP',
    description: 'Pusher publishable key - Set up at pusher.com'
  },
  {
    name: 'PUSHER_APP_ID',
    value: 'NEEDS_SETUP',
    description: 'Pusher app ID - Set up at pusher.com'
  },
  {
    name: 'PUSHER_SECRET',
    value: 'NEEDS_SETUP',
    description: 'Pusher secret - Set up at pusher.com'
  },
  {
    name: 'NEXT_PUBLIC_PUSHER_CLUSTER',
    value: 'us2',
    description: 'Pusher cluster region'
  }
];

function setEnvVar(name, value, description) {
  try {
    console.log(`\n📝 Setting ${name}...`);
    console.log(`   ${description}`);
    
    if (value === 'NEEDS_SETUP') {
      console.log(`   ⚠️  PLACEHOLDER - Set up required service first`);
      return false;
    }
    
    const command = `vercel env add ${name} production`;
    console.log(`   Running: ${command}`);
    
    // Note: This would normally require interactive input
    // For now, we'll create a manual setup guide
    console.log(`   ✅ Ready to set (requires manual input)`);
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🎯 Core Environment Variables Setup');
  console.log('=====================================');
  
  let successCount = 0;
  let totalCount = envVars.length;
  
  for (const envVar of envVars) {
    if (setEnvVar(envVar.name, envVar.value, envVar.description)) {
      successCount++;
    }
  }
  
  console.log('\n📊 Summary');
  console.log('===========');
  console.log(`✅ Ready to set: ${successCount}/${totalCount} variables`);
  console.log(`⚠️  Need service setup: ${totalCount - successCount} variables`);
  
  console.log('\n🔧 Manual Setup Required:');
  console.log('==========================');
  console.log('1. Set up Clerk Authentication:');
  console.log('   - Go to https://clerk.com');
  console.log('   - Create application: "Ultimate Digital Planner"');
  console.log('   - Get publishable and secret keys');
  console.log('   - Add to Vercel environment variables');
  
  console.log('\n2. Set up Pusher Real-time:');
  console.log('   - Go to https://pusher.com');
  console.log('   - Create app: "ultimate-digital-planner"');
  console.log('   - Get app credentials');
  console.log('   - Add to Vercel environment variables');
  
  console.log('\n3. Optional Integrations:');
  console.log('   - Google Calendar API (Google Cloud Console)');
  console.log('   - Slack API (api.slack.com)');
  console.log('   - Sentry monitoring (sentry.io)');
  
  console.log('\n🚀 Environment Variables Command Reference:');
  console.log('===========================================');
  
  envVars.forEach(envVar => {
    if (envVar.value !== 'NEEDS_SETUP') {
      console.log(`vercel env add ${envVar.name} production`);
      console.log(`# ${envVar.description}`);
      console.log(`# Value: ${envVar.value.substring(0, 20)}...`);
      console.log('');
    }
  });
  
  console.log('\n✨ After setting up auth services, run:');
  console.log('vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production');
  console.log('vercel env add CLERK_SECRET_KEY production');
  console.log('vercel env add NEXT_PUBLIC_PUSHER_KEY production');
  console.log('vercel env add PUSHER_APP_ID production');
  console.log('vercel env add PUSHER_SECRET production');
  
  console.log('\n🎉 Your Ultimate Digital Planner will be fully functional!');
}

main().catch(console.error);