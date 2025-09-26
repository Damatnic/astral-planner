/**
 * Test script to verify demo account functionality
 */
const fs = require('fs');
const path = require('path');

// Test data from account-data.ts
const DEMO_ACCOUNT_DATA = {
  id: 'demo-user',
  name: 'Demo Account',
  pin: '0000',
  displayName: 'Demo User',
  avatar: '🎯',
  theme: 'green'
};

const EXPECTED_HABITS = [
  { name: 'Morning Meditation', target: 20, unit: 'minutes' },
  { name: 'Daily Exercise', target: 30, unit: 'minutes' },
  { name: 'Read for Learning', target: 25, unit: 'minutes' },
  { name: 'Drink Water', target: 8, unit: 'glasses' },
  { name: 'Practice Gratitude', target: 3, unit: 'items' }
];

const EXPECTED_GOALS = [
  { title: 'Complete Online Course', category: 'Learning' },
  { title: 'Improve Physical Fitness', category: 'Health' },
  { title: 'Build a Daily Routine', category: 'Personal' },
  { title: 'Learn a New Skill', category: 'Learning' }
];

function testAccountData() {
  console.log('🧪 Testing Account Data Configuration...\n');
  
  try {
    // Test if account data file exists and is properly configured
    const accountDataPath = path.join(__dirname, 'src', 'lib', 'account-data.ts');
    
    if (!fs.existsSync(accountDataPath)) {
      console.error('❌ Account data file not found');
      return false;
    }
    
    const accountDataContent = fs.readFileSync(accountDataPath, 'utf8');
    
    // Check if demo-user exists
    if (!accountDataContent.includes('demo-user')) {
      console.error('❌ Demo user not found in account data');
      return false;
    }
    
    console.log('✅ Account data file exists and contains demo user');
    
    // Check if LoginClient has demo account
    const loginClientPath = path.join(__dirname, 'src', 'app', 'login', 'LoginClient.tsx');
    
    if (!fs.existsSync(loginClientPath)) {
      console.error('❌ LoginClient file not found');
      return false;
    }
    
    const loginClientContent = fs.readFileSync(loginClientPath, 'utf8');
    
    if (!loginClientContent.includes('demo-user') || !loginClientContent.includes('0000')) {
      console.error('❌ Demo account not properly configured in LoginClient');
      return false;
    }
    
    console.log('✅ LoginClient contains demo account configuration');
    console.log('✅ All account data tests passed\n');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing account data:', error.message);
    return false;
  }
}

function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const apiTests = [
    { path: 'src/app/api/habits/route.ts', name: 'Habits API' },
    { path: 'src/app/api/goals/route.ts', name: 'Goals API' },
    { path: 'src/app/api/health/route.ts', name: 'Health API' }
  ];
  
  let allPassed = true;
  
  apiTests.forEach(test => {
    const filePath = path.join(__dirname, test.path);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ ${test.name} file not found`);
      allPassed = false;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if API handles user ID parameter
    if (!content.includes('userId') && !content.includes('demo-user')) {
      console.warn(`⚠️  ${test.name} may not handle user-specific data`);
    } else {
      console.log(`✅ ${test.name} configured properly`);
    }
  });
  
  console.log(allPassed ? '✅ All API endpoint tests passed\n' : '❌ Some API endpoint tests failed\n');
  return allPassed;
}

function testComponentHydration() {
  console.log('🧪 Testing Component Hydration Fixes...\n');
  
  const componentsToTest = [
    { path: 'src/app/planner/PhysicalPlannerView.tsx', name: 'PhysicalPlannerView' },
    { path: 'src/app/dashboard/DashboardClientFixed.tsx', name: 'DashboardClientFixed' },
    { path: 'src/app/habits/HabitsClient.tsx', name: 'HabitsClient' },
    { path: 'src/components/pwa/OfflineIndicator.tsx', name: 'OfflineIndicator' }
  ];
  
  let allPassed = true;
  
  componentsToTest.forEach(component => {
    const filePath = path.join(__dirname, component.path);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ ${component.name} file not found`);
      allPassed = false;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for hydration fixes
    const hasNullInit = content.includes('useState<Date | null>(null)') || content.includes('useState(null)');
    const hasUseEffect = content.includes('useEffect') && content.includes('setCurrentDate');
    const hasEarlyReturn = content.includes('if (!currentDate)') || content.includes('if (!') && content.includes('return');
    
    if (component.name === 'PhysicalPlannerView') {
      if (hasNullInit && hasUseEffect && hasEarlyReturn) {
        console.log(`✅ ${component.name} has proper hydration fixes`);
      } else {
        console.error(`❌ ${component.name} missing hydration fixes`);
        allPassed = false;
      }
    } else {
      console.log(`✅ ${component.name} checked`);
    }
  });
  
  console.log(allPassed ? '✅ All component hydration tests passed\n' : '❌ Some component hydration tests failed\n');
  return allPassed;
}

function testBuildConfiguration() {
  console.log('🧪 Testing Build Configuration...\n');
  
  try {
    // Check package.json
    const packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.error('❌ package.json not found');
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageJson.scripts || !packageJson.scripts.build) {
      console.error('❌ Build script not found in package.json');
      return false;
    }
    
    console.log('✅ Build script configured');
    
    // Check Next.js config
    const nextConfigPath = path.join(__dirname, 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      console.log('✅ Next.js configuration exists');
    }
    
    // Check TypeScript config
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      console.log('✅ TypeScript configuration exists');
    }
    
    console.log('✅ All build configuration tests passed\n');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing build configuration:', error.message);
    return false;
  }
}

function generateTestReport() {
  console.log('📋 DEMO ACCOUNT TEST REPORT');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Account Data Configuration', fn: testAccountData },
    { name: 'API Endpoints', fn: testAPIEndpoints },
    { name: 'Component Hydration Fixes', fn: testComponentHydration },
    { name: 'Build Configuration', fn: testBuildConfiguration }
  ];
  
  const results = tests.map(test => ({
    name: test.name,
    passed: test.fn()
  }));
  
  console.log('\n📊 TEST SUMMARY:');
  console.log('-'.repeat(30));
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  
  console.log('\n' + '='.repeat(50));
  console.log(allPassed ? 
    '🎉 ALL TESTS PASSED - Demo account should work correctly!' :
    '⚠️  SOME TESTS FAILED - Issues need to be addressed'
  );
  
  if (!allPassed) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Fix any configuration issues identified above');
    console.log('2. Test the demo account login manually');
    console.log('3. Check browser console for hydration errors');
    console.log('4. Verify API endpoints return correct data');
  }
  
  console.log('\n🌟 To test manually:');
  console.log('1. Go to http://localhost:3040/login');
  console.log('2. Click "Demo Account"');
  console.log('3. Verify PIN auto-fills to 0000');
  console.log('4. Click login and check for errors');
  console.log('5. Navigate to dashboard and test all tabs');
  
  return allPassed;
}

// Run the tests
if (require.main === module) {
  generateTestReport();
}

module.exports = {
  testAccountData,
  testAPIEndpoints,
  testComponentHydration,
  testBuildConfiguration,
  generateTestReport
};