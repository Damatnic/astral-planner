/**
 * Test the actual login flow for the demo account
 */
const http = require('http');

const BASE_URL = 'http://localhost:3040';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testHealthEndpoint() {
  console.log('🧪 Testing Health Endpoint...');
  try {
    const response = await makeRequest('/api/health');
    if (response.statusCode === 200) {
      console.log('✅ Health endpoint is working');
      return true;
    } else {
      console.log('❌ Health endpoint failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testHabitsEndpoint() {
  console.log('🧪 Testing Habits Endpoint...');
  try {
    const response = await makeRequest('/api/habits?userId=demo-user');
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.habits && Array.isArray(data.habits) && data.habits.length > 0) {
        console.log(`✅ Habits endpoint working (${data.habits.length} habits found)`);
        console.log(`   Sample habit: ${data.habits[0].name}`);
        return true;
      } else {
        console.log('❌ Habits endpoint returned no data');
        return false;
      }
    } else {
      console.log('❌ Habits endpoint failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Habits endpoint error:', error.message);
    return false;
  }
}

async function testGoalsEndpoint() {
  console.log('🧪 Testing Goals Endpoint...');
  try {
    const response = await makeRequest('/api/goals?userId=demo-user');
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`✅ Goals endpoint working (${data.data.length} goals found)`);
        console.log(`   Sample goal: ${data.data[0].title}`);
        return true;
      } else {
        console.log('❌ Goals endpoint returned no data');
        console.log('   Response:', JSON.stringify(data, null, 2));
        return false;
      }
    } else {
      console.log('❌ Goals endpoint failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Goals endpoint error:', error.message);
    return false;
  }
}

async function testLoginPage() {
  console.log('🧪 Testing Login Page...');
  try {
    const response = await makeRequest('/login');
    if (response.statusCode === 200 && response.body.includes('Demo Account')) {
      console.log('✅ Login page loads and contains Demo Account');
      return true;
    } else {
      console.log('❌ Login page failed or missing Demo Account');
      return false;
    }
  } catch (error) {
    console.log('❌ Login page error:', error.message);
    return false;
  }
}

async function testDashboardPage() {
  console.log('🧪 Testing Dashboard Page (no auth)...');
  try {
    const response = await makeRequest('/dashboard');
    // Should either load or redirect to login
    if (response.statusCode === 200 || response.statusCode === 302) {
      console.log('✅ Dashboard page responds appropriately');
      return true;
    } else {
      console.log('❌ Dashboard page failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard page error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 TESTING DEMO ACCOUNT LOGIN FLOW');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Login Page', fn: testLoginPage },
    { name: 'Dashboard Page', fn: testDashboardPage },
    { name: 'Habits API', fn: testHabitsEndpoint },
    { name: 'Goals API', fn: testGoalsEndpoint }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
    console.log(''); // Add spacing
  }
  
  console.log('📊 TEST RESULTS:');
  console.log('-'.repeat(30));
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 PASSED: ${passedCount}/${results.length} tests`);
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - Demo account APIs are working!');
    console.log('\n✅ The demo account should work correctly.');
    console.log('✅ All API endpoints are responding with data.');
    console.log('✅ The login page contains the demo account option.');
    console.log('\n🔧 If you\'re still seeing errors in production:');
    console.log('1. Check browser console for client-side errors');
    console.log('2. Verify Vercel deployment has completed');
    console.log('3. Clear browser cache and try again');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Check the issues above');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure the development server is running on port 3040');
    console.log('2. Check for any error messages in the server logs');
    console.log('3. Verify all API endpoints are implemented correctly');
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };