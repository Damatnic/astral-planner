// ============================================================================
// ZENITH API TESTS - HEALTH CHECK ENDPOINT
// ============================================================================

import { GET } from '../route';
import { NextRequest } from 'next/server';

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return health status successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test'
      });
    });

    it('should return valid timestamp format', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET(request);
      const data = await response.json();
      
      // Should be a valid ISO timestamp
      expect(() => new Date(data.timestamp)).not.toThrow();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });

    it('should return positive uptime', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.uptime).toBeGreaterThan(0);
      expect(typeof data.uptime).toBe('number');
    });

    it('should respond quickly', async () => {
      const startTime = performance.now();
      
      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);
      
      const responseTime = performance.now() - startTime;
      expect(responseTime).toBeLessThan(50); // Should respond within 50ms
    });

    it('should handle CORS properly', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      
      const response = await GET(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?invalid=true');
      
      expect(async () => {
        await GET(request);
      }).not.toThrow();
    });

    it('should always return JSON content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      
      const response = await GET(request);
      
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () => 
        GET(new NextRequest('http://localhost:3000/api/health'))
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain consistent response format', async () => {
      const responses = await Promise.all([
        GET(new NextRequest('http://localhost:3000/api/health')),
        GET(new NextRequest('http://localhost:3000/api/health')),
        GET(new NextRequest('http://localhost:3000/api/health'))
      ]);
      
      const dataPromises = responses.map(r => r.json());
      const allData = await Promise.all(dataPromises);
      
      allData.forEach(data => {
        expect(data).toHaveProperty('status', 'ok');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('uptime');
        expect(data).toHaveProperty('environment');
      });
    });
  });
});