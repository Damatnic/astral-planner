// ============================================================================
// ZENITH PERFORMANCE TESTS - K6 API LOAD TESTING
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// CUSTOM METRICS
// ============================================================================

export const errorRate = new Rate('errors');
export const apiLatency = new Trend('api_latency', true);
export const authLatency = new Trend('auth_latency', true);
export const requestCount = new Counter('total_requests');

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export const options = {
  stages: [
    // Warm-up
    { duration: '30s', target: 10 },
    
    // Ramp up to normal load
    { duration: '2m', target: 50 },
    
    // Stay at normal load
    { duration: '5m', target: 50 },
    
    // Ramp up to high load
    { duration: '2m', target: 100 },
    
    // Stay at high load
    { duration: '3m', target: 100 },
    
    // Peak load test
    { duration: '1m', target: 200 },
    { duration: '2m', target: 200 },
    
    // Ramp down
    { duration: '2m', target: 0 },
  ],
  
  thresholds: {
    // API Performance Requirements
    http_req_duration: [
      'p(95)<1000',  // 95% of requests under 1s
      'p(99)<2000',  // 99% of requests under 2s
    ],
    
    // Error Rate Requirements
    errors: ['rate<0.01'],         // Error rate under 1%
    http_req_failed: ['rate<0.01'], // HTTP failure rate under 1%
    
    // Authentication Performance
    'auth_latency': ['p(95)<500'],  // Auth under 500ms
    
    // API Latency
    'api_latency': ['p(95)<800'],   // API calls under 800ms
  },
};

// ============================================================================
// TEST DATA
// ============================================================================

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

const demoCredentials = {
  accountId: 'demo',
  pin: '0000',
  deviceInfo: {
    userAgent: 'K6 Load Test',
    ipAddress: '127.0.0.1',
    fingerprint: 'k6-load-test',
  },
};

const testTasks = [
  { title: 'Performance Test Task 1', description: 'Created during load test' },
  { title: 'Performance Test Task 2', description: 'Testing API throughput' },
  { title: 'Performance Test Task 3', description: 'Load testing scenario' },
];

const testGoals = [
  { title: 'Performance Goal 1', description: 'Test goal for load testing' },
  { title: 'Performance Goal 2', description: 'Validate API performance' },
];

// ============================================================================
// AUTHENTICATION HELPER
// ============================================================================

function authenticate() {
  const startTime = new Date();
  
  const authResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(demoCredentials), {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'K6-LoadTest/1.0',
    },
    tags: { endpoint: 'auth_login' },
  });

  const authTime = new Date() - startTime;
  authLatency.add(authTime);
  requestCount.add(1);

  const authSuccess = check(authResponse, {
    'auth status is 200': (r) => r.status === 200,
    'auth response has token': (r) => r.json('tokens.accessToken') !== null,
    'auth completed in time': (r) => r.timings.duration < 1000,
  });

  if (!authSuccess) {
    errorRate.add(1);
    return null;
  }

  const tokens = authResponse.json('tokens');
  return tokens ? tokens.accessToken : null;
}

// ============================================================================
// API TEST FUNCTIONS
// ============================================================================

function testAuthenticationEndpoint(token) {
  const startTime = new Date();
  
  const response = http.get(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'auth_me' },
  });

  const responseTime = new Date() - startTime;
  apiLatency.add(responseTime);
  requestCount.add(1);

  const success = check(response, {
    'auth/me status is 200': (r) => r.status === 200,
    'auth/me returns user': (r) => r.json('user') !== null,
    'auth/me is authenticated': (r) => r.json('isAuthenticated') === true,
    'auth/me response time OK': (r) => r.timings.duration < 500,
  });

  if (!success) {
    errorRate.add(1);
  }

  return success;
}

function testTasksAPI(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // GET /api/tasks
  let startTime = new Date();
  let response = http.get(`${BASE_URL}/api/tasks`, { 
    headers,
    tags: { endpoint: 'tasks_get' },
  });
  
  apiLatency.add(new Date() - startTime);
  requestCount.add(1);

  let success = check(response, {
    'tasks GET status is 200': (r) => r.status === 200,
    'tasks GET returns array': (r) => Array.isArray(r.json('tasks')),
    'tasks GET response time OK': (r) => r.timings.duration < 800,
  });

  if (!success) {
    errorRate.add(1);
    return false;
  }

  // POST /api/tasks
  const newTask = testTasks[Math.floor(Math.random() * testTasks.length)];
  
  startTime = new Date();
  response = http.post(`${BASE_URL}/api/tasks`, JSON.stringify(newTask), { 
    headers,
    tags: { endpoint: 'tasks_post' },
  });
  
  apiLatency.add(new Date() - startTime);
  requestCount.add(1);

  success = check(response, {
    'tasks POST status is 201': (r) => r.status === 201,
    'tasks POST returns task': (r) => r.json('task.id') !== null,
    'tasks POST response time OK': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errorRate.add(1);
  }

  return success;
}

function testGoalsAPI(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // GET /api/goals
  let startTime = new Date();
  let response = http.get(`${BASE_URL}/api/goals`, { 
    headers,
    tags: { endpoint: 'goals_get' },
  });
  
  apiLatency.add(new Date() - startTime);
  requestCount.add(1);

  let success = check(response, {
    'goals GET status is 200': (r) => r.status === 200,
    'goals GET returns array': (r) => Array.isArray(r.json('goals')),
    'goals GET response time OK': (r) => r.timings.duration < 800,
  });

  if (!success) {
    errorRate.add(1);
    return false;
  }

  // POST /api/goals (with probability to avoid too many creates)
  if (Math.random() < 0.3) { // 30% chance to create a goal
    const newGoal = testGoals[Math.floor(Math.random() * testGoals.length)];
    
    startTime = new Date();
    response = http.post(`${BASE_URL}/api/goals`, JSON.stringify(newGoal), { 
      headers,
      tags: { endpoint: 'goals_post' },
    });
    
    apiLatency.add(new Date() - startTime);
    requestCount.add(1);

    success = check(response, {
      'goals POST status is 201': (r) => r.status === 201,
      'goals POST returns goal': (r) => r.json('goal.id') !== null,
      'goals POST response time OK': (r) => r.timings.duration < 1000,
    });

    if (!success) {
      errorRate.add(1);
    }
  }

  return success;
}

function testHealthCheck() {
  const startTime = new Date();
  
  const response = http.get(`${BASE_URL}/api/health`, {
    tags: { endpoint: 'health' },
  });

  apiLatency.add(new Date() - startTime);
  requestCount.add(1);

  const success = check(response, {
    'health status is 200': (r) => r.status === 200,
    'health response is valid': (r) => r.json('status') === 'healthy',
    'health response time OK': (r) => r.timings.duration < 300,
  });

  if (!success) {
    errorRate.add(1);
  }

  return success;
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

export default function() {
  // Health check (10% of requests)
  if (Math.random() < 0.1) {
    testHealthCheck();
    sleep(0.5);
    return;
  }

  // Authenticate
  const token = authenticate();
  if (!token) {
    console.error('Authentication failed');
    sleep(1);
    return;
  }

  // Test authenticated endpoints
  const authMeSuccess = testAuthenticationEndpoint(token);
  if (!authMeSuccess) {
    sleep(1);
    return;
  }

  // Randomly test different APIs to simulate real usage
  const rand = Math.random();
  
  if (rand < 0.5) {
    // 50% - Test tasks API
    testTasksAPI(token);
  } else if (rand < 0.8) {
    // 30% - Test goals API
    testGoalsAPI(token);
  } else {
    // 20% - Test multiple endpoints (power user simulation)
    testTasksAPI(token);
    sleep(0.2);
    testGoalsAPI(token);
  }

  // Random sleep to simulate user think time
  sleep(Math.random() * 2 + 0.5); // 0.5 to 2.5 seconds
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

export function setup() {
  console.log('🚀 Starting Zenith API Load Test');
  console.log(`📊 Base URL: ${BASE_URL}`);
  console.log(`👥 Virtual Users: ${__ENV.VU_MAX || 'default'}`);
  
  // Verify API is accessible
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`API not accessible. Health check failed: ${healthResponse.status}`);
  }
  
  console.log('✅ API is accessible, starting load test...');
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date(),
  };
}

export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  
  console.log('📊 Load Test Summary:');
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`📈 Total Requests: ${requestCount.count}`);
  console.log(`⚡ Avg RPS: ${(requestCount.count / duration).toFixed(2)}`);
  console.log('🎯 Test completed successfully!');
}

// ============================================================================
// STRESS TEST SCENARIOS
// ============================================================================

export const stressTest = {
  executor: 'ramping-arrival-rate',
  startRate: 10,
  timeUnit: '1s',
  preAllocatedVUs: 50,
  maxVUs: 500,
  stages: [
    { duration: '1m', target: 50 },   // Ramp to 50 RPS
    { duration: '2m', target: 100 },  // Ramp to 100 RPS
    { duration: '1m', target: 200 },  // Spike to 200 RPS
    { duration: '30s', target: 300 }, // Peak at 300 RPS
    { duration: '2m', target: 0 },    // Ramp down
  ],
  tags: { test_type: 'stress' },
};

export const spikeTest = {
  executor: 'ramping-arrival-rate',
  startRate: 10,
  timeUnit: '1s',
  preAllocatedVUs: 20,
  maxVUs: 1000,
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 500 },  // Instant spike
    { duration: '1m', target: 500 },   // Stay at spike
    { duration: '10s', target: 10 },   // Drop back
    { duration: '30s', target: 10 },   // Recovery
  ],
  tags: { test_type: 'spike' },
};