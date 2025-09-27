#!/usr/bin/env node

/**
 * Production Deployment Monitor
 * Monitors Vercel deployment and tests live functionality
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Production URL (Vercel deployment)
const PRODUCTION_URL = 'https://astral-planner-pro.vercel.app';

console.log('🚀 VERCEL DEPLOYMENT MONITOR');
console.log('==================================================');

async function checkDeploymentStatus() {
  console.log('📡 Checking Vercel deployment status...\n');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${PRODUCTION_URL}/api/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ Health check: ${res.statusCode} - ${response.status}`);
          console.log(`🕐 Timestamp: ${response.timestamp}`);
          console.log(`📊 Memory usage: ${response.memoryUsage?.rss || 'N/A'}`);
          resolve(true);
        } catch (error) {
          console.log(`❌ Health check failed: ${res.statusCode}`);
          console.log(`📄 Response: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Network error: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Health check request timed out');
      req.destroy();
      resolve(false);
    });
  });
}

async function testAuthEndpoint() {
  console.log('\n🔐 Testing authentication endpoint...');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${PRODUCTION_URL}/api/auth/me`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 401) {
            console.log('✅ Auth endpoint working - returns 401 as expected for unauthenticated request');
            console.log(`📋 Response: ${response.error}`);
            resolve(true);
          } else if (res.statusCode === 200) {
            console.log('✅ Auth endpoint working - authenticated user detected');
            console.log(`👤 User: ${response.user?.email || 'Demo user'}`);
            resolve(true);
          } else {
            console.log(`❌ Auth endpoint error: ${res.statusCode}`);
            console.log(`📄 Response: ${data}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`❌ Auth endpoint JSON parse error: ${error.message}`);
          console.log(`📄 Raw response: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Auth endpoint network error: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Auth endpoint request timed out');
      req.destroy();
      resolve(false);
    });
  });
}

async function testHabitsEndpoint() {
  console.log('\n🎯 Testing habits endpoint...');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${PRODUCTION_URL}/api/habits?userId=demo-user`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Habits endpoint working');
            console.log(`📊 Habits count: ${response.habits?.length || 0}`);
            console.log(`📈 Stats: ${JSON.stringify(response.stats || {})}`);
            resolve(true);
          } else {
            console.log(`❌ Habits endpoint error: ${res.statusCode}`);
            console.log(`📄 Response: ${data}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`❌ Habits endpoint JSON parse error: ${error.message}`);
          console.log(`📄 Raw response: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Habits endpoint network error: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Habits endpoint request timed out');
      req.destroy();
      resolve(false);
    });
  });
}

async function testLoginPage() {
  console.log('\n🔑 Testing login page...');
  
  return new Promise((resolve, reject) => {
    const req = https.get(`${PRODUCTION_URL}/login`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          // Check if it's HTML and contains login elements
          if (data.includes('<html') && (data.includes('Demo Account') || data.includes('login'))) {
            console.log('✅ Login page loads successfully');
            console.log('📄 Contains expected login elements');
            resolve(true);
          } else {
            console.log('❌ Login page loads but missing expected content');
            resolve(false);
          }
        } else {
          console.log(`❌ Login page error: ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Login page network error: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Login page request timed out');
      req.destroy();
      resolve(false);
    });
  });
}

async function generateDeploymentReport() {
  console.log('📊 Running comprehensive deployment tests...\n');
  
  const results = {
    healthCheck: await checkDeploymentStatus(),
    authEndpoint: await testAuthEndpoint(),
    habitsEndpoint: await testHabitsEndpoint(),
    loginPage: await testLoginPage()
  };
  
  console.log('\n📋 DEPLOYMENT TEST SUMMARY:');
  console.log('------------------------------');
  console.log(`✅ Health Check: ${results.healthCheck ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Auth Endpoint: ${results.authEndpoint ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Habits Endpoint: ${results.habitsEndpoint ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Login Page: ${results.loginPage ? 'PASS' : 'FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n==================================================');
  if (allPassed) {
    console.log('🎉 ALL DEPLOYMENT TESTS PASSED!');
    console.log('🚀 Production site is fully operational');
    console.log('\n🌟 Next steps:');
    console.log('1. Visit: https://astral-planner-pro.vercel.app/login');
    console.log('2. Click "Demo Account"'); 
    console.log('3. Verify PIN auto-fills to 0000');
    console.log('4. Test all dashboard features');
  } else {
    console.log('❌ SOME DEPLOYMENT TESTS FAILED');
    console.log('🔍 Check the failed tests above and investigate');
  }
  
  return allPassed;
}

// Run the deployment monitor
if (require.main === module) {
  generateDeploymentReport().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  checkDeploymentStatus,
  testAuthEndpoint, 
  testHabitsEndpoint,
  testLoginPage,
  generateDeploymentReport
};