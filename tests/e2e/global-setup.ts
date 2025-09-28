/**
 * ZENITH E2E TESTING - Global Setup
 * Comprehensive test environment initialization
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Zenith E2E Testing Framework - Global Setup');
  console.log('================================================');
  
  // Environment validation
  const requiredEnvVars = [
    'TEST_URL',
    'NODE_ENV'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️  Warning: ${envVar} environment variable not set`);
    }
  }
  
  // Set test environment defaults
  process.env.TEST_URL = process.env.TEST_URL || 'http://localhost:3099';
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  
  console.log(`📍 Test URL: ${process.env.TEST_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  
  // Wait for server to be ready
  console.log('⏳ Waiting for application server...');
  
  try {
    const response = await fetch(process.env.TEST_URL);
    if (response.ok) {
      console.log('✅ Application server is ready');
    } else {
      console.log('⚠️  Application server returned non-200 status');
    }
  } catch (error) {
    console.log('⚠️  Could not connect to application server');
    console.log('   Make sure the development server is running');
    console.log(`   Expected URL: ${process.env.TEST_URL}`);
  }
  
  console.log('🚀 Global setup completed');
  console.log('================================================');
}

export default globalSetup;