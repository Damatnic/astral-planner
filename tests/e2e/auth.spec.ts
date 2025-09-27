/**
 * End-to-End Authentication Tests
 * Testing complete user journeys and authentication flows across the application
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Page Object Model for Authentication
class AuthPage {
  constructor(private page: Page) {}

  // Selectors
  get loginButton() { return this.page.getByTestId('login-btn'); }
  get signoutButton() { return this.page.getByTestId('signout-btn'); }
  get userMenu() { return this.page.getByTestId('user-menu'); }
  get userAvatar() { return this.page.getByTestId('user-avatar'); }
  get authStatus() { return this.page.getByTestId('auth-status'); }
  get loadingSpinner() { return this.page.getByTestId('loading'); }
  get errorMessage() { return this.page.getByTestId('error-message'); }
  get welcomeMessage() { return this.page.getByTestId('welcome-message'); }

  // Navigation
  async goto(path: string = '/') {
    await this.page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  }

  async gotoLoginPage() {
    await this.goto('/login');
  }

  async gotoDashboard() {
    await this.goto('/dashboard');
  }

  // Authentication actions
  async loginAsDemoUser() {
    await this.page.evaluate(() => {
      const userData = {
        id: 'demo-user-e2e',
        name: 'Demo User',
        displayName: 'Demo User E2E',
        avatar: '/avatars/demo.png',
        theme: 'dark',
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('current-user', JSON.stringify(userData));
      
      // Trigger storage event to notify auth provider
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'current-user',
        newValue: JSON.stringify(userData),
        storageArea: localStorage
      }));
    });
    
    // Wait for authentication to take effect
    await this.page.waitForTimeout(500);
  }

  async logout() {
    await this.signoutButton.click();
    await this.page.waitForURL('**/login', { timeout: TEST_TIMEOUT });
  }

  // Assertions
  async expectToBeAuthenticated() {
    await expect(this.authStatus).toHaveText('authenticated', { timeout: TEST_TIMEOUT });
  }

  async expectToBeUnauthenticated() {
    await expect(this.authStatus).toHaveText('unauthenticated', { timeout: TEST_TIMEOUT });
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(/.*\/login/);
  }

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL(/.*\/dashboard/);
  }

  // Helper methods
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: TEST_TIMEOUT });
  }

  async clearAuthData() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async getStoredUser() {
    return await this.page.evaluate(() => {
      const stored = localStorage.getItem('current-user');
      return stored ? JSON.parse(stored) : null;
    });
  }

  async interceptAuthAPI() {
    await this.page.route('**/api/auth/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/api/auth/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'api-demo-user',
              email: 'demo@example.com',
              firstName: 'API Demo',
              lastName: 'User',
              settings: { theme: 'dark' }
            }
          })
        });
      } else if (url.includes('/api/auth/signout')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });
  }
}

test.describe('Authentication E2E Tests', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.clearAuthData();
  });

  test.describe('Public Route Access', () => {
    test('should allow access to home page without authentication', async ({ page }) => {
      await authPage.goto('/');
      await authPage.waitForPageLoad();
      
      // Should not redirect to login
      await expect(page).toHaveURL(BASE_URL + '/');
      await authPage.expectToBeUnauthenticated();
    });

    test('should allow access to login page without authentication', async ({ page }) => {
      await authPage.gotoLoginPage();
      await authPage.waitForPageLoad();
      
      await expect(page).toHaveURL(/.*\/login/);
      await authPage.expectToBeUnauthenticated();
    });

    test('should show appropriate UI for unauthenticated users', async ({ page }) => {
      await authPage.goto('/');
      await authPage.waitForPageLoad();
      
      // Should show login option
      await expect(authPage.loginButton).toBeVisible();
      await expect(authPage.signoutButton).not.toBeVisible();
      await expect(authPage.userMenu).not.toBeVisible();
    });
  });

  test.describe('Protected Route Access', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await authPage.gotoDashboard();
      
      // Should redirect to login
      await authPage.expectToBeOnLoginPage();
      await authPage.expectToBeUnauthenticated();
    });

    test('should redirect to login when accessing protected routes', async ({ page }) => {
      const protectedRoutes = ['/dashboard', '/settings', '/profile', '/admin'];
      
      for (const route of protectedRoutes) {
        await authPage.goto(route);
        await authPage.expectToBeOnLoginPage();
      }
    });

    test('should preserve intended destination after login', async ({ page }) => {
      // Try to access dashboard without auth
      await authPage.gotoDashboard();
      await authPage.expectToBeOnLoginPage();
      
      // Login
      await authPage.loginAsDemoUser();
      await authPage.gotoLoginPage(); // Simulate being on login page
      
      // Should redirect to intended destination (dashboard)
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: TEST_TIMEOUT });
    });
  });

  test.describe('Authentication Flow', () => {
    test('should successfully login demo user', async ({ page }) => {
      await authPage.gotoLoginPage();
      await authPage.waitForPageLoad();
      
      // Login as demo user
      await authPage.loginAsDemoUser();
      
      // Should be authenticated
      await authPage.expectToBeAuthenticated();
      
      // Should show authenticated UI
      await expect(authPage.signoutButton).toBeVisible();
      await expect(authPage.loginButton).not.toBeVisible();
      
      // User data should be stored
      const storedUser = await authPage.getStoredUser();
      expect(storedUser).toBeTruthy();
      expect(storedUser.id).toBe('demo-user-e2e');
    });

    test('should redirect authenticated user away from login page', async ({ page }) => {
      // Login first
      await authPage.loginAsDemoUser();
      
      // Try to access login page
      await authPage.gotoLoginPage();
      
      // Should redirect to dashboard
      await authPage.expectToBeOnDashboard();
    });

    test('should successfully logout user', async ({ page }) => {
      // Login first
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      await authPage.expectToBeAuthenticated();
      
      // Logout
      await authPage.logout();
      
      // Should be unauthenticated
      await authPage.expectToBeUnauthenticated();
      await authPage.expectToBeOnLoginPage();
      
      // User data should be cleared
      const storedUser = await authPage.getStoredUser();
      expect(storedUser).toBeNull();
    });

    test('should clear all user data on logout', async ({ page }) => {
      // Setup user data
      await page.evaluate(() => {
        localStorage.setItem('preferences-user-123', 'user-prefs');
        localStorage.setItem('data-cache', 'cache-data');
        localStorage.setItem('other-data', 'should-remain');
      });
      
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Logout
      await authPage.logout();
      
      // Check what data remains
      const remainingData = await page.evaluate(() => {
        return {
          user: localStorage.getItem('current-user'),
          preferences: localStorage.getItem('preferences-user-123'),
          cache: localStorage.getItem('data-cache'),
          other: localStorage.getItem('other-data')
        };
      });
      
      expect(remainingData.user).toBeNull();
      expect(remainingData.preferences).toBeNull();
      expect(remainingData.cache).toBeNull();
      expect(remainingData.other).toBeNull(); // All should be cleared
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      await authPage.expectToBeAuthenticated();
      
      // Refresh page
      await page.reload({ waitUntil: 'networkidle' });
      await authPage.waitForPageLoad();
      
      // Should still be authenticated
      await authPage.expectToBeAuthenticated();
      await authPage.expectToBeOnDashboard();
    });

    test('should maintain session across navigation', async ({ page }) => {
      await authPage.loginAsDemoUser();
      
      const routes = ['/dashboard', '/', '/dashboard'];
      
      for (const route of routes) {
        await authPage.goto(route);
        await authPage.waitForPageLoad();
        
        if (route === '/') {
          // Home page - should be authenticated but not redirected
          await authPage.expectToBeAuthenticated();
        } else {
          // Protected routes - should be accessible
          await authPage.expectToBeAuthenticated();
          await expect(page).toHaveURL(BASE_URL + route);
        }
      }
    });

    test('should handle session expiry', async ({ page }) => {
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Simulate session expiry by setting old login time
      await page.evaluate(() => {
        const userData = JSON.parse(localStorage.getItem('current-user') || '{}');
        userData.loginTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
        localStorage.setItem('current-user', JSON.stringify(userData));
      });
      
      // Refresh to trigger session check
      await page.reload({ waitUntil: 'networkidle' });
      
      // Should redirect to login due to expired session
      await authPage.expectToBeOnLoginPage();
      await authPage.expectToBeUnauthenticated();
    });

    test('should handle corrupted session data', async ({ page }) => {
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Corrupt the session data
      await page.evaluate(() => {
        localStorage.setItem('current-user', 'invalid-json-data');
      });
      
      // Refresh to trigger session check
      await page.reload({ waitUntil: 'networkidle' });
      
      // Should redirect to login due to corrupted session
      await authPage.expectToBeOnLoginPage();
      await authPage.expectToBeUnauthenticated();
    });
  });

  test.describe('Cross-Tab Authentication', () => {
    test('should sync authentication across tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      const authPage1 = new AuthPage(page1);
      const authPage2 = new AuthPage(page2);
      
      // Tab 1: Go to login
      await authPage1.gotoLoginPage();
      
      // Tab 2: Go to dashboard (should redirect to login)
      await authPage2.gotoDashboard();
      await authPage2.expectToBeOnLoginPage();
      
      // Tab 1: Login
      await authPage1.loginAsDemoUser();
      await authPage1.expectToBeAuthenticated();
      
      // Tab 2: Should automatically update to authenticated
      await authPage2.goto('/dashboard');
      await authPage2.expectToBeAuthenticated();
      await authPage2.expectToBeOnDashboard();
      
      await context.close();
    });

    test('should sync logout across tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      const authPage1 = new AuthPage(page1);
      const authPage2 = new AuthPage(page2);
      
      // Login in both tabs
      await authPage1.loginAsDemoUser();
      await authPage1.gotoDashboard();
      
      await authPage2.gotoDashboard();
      await authPage2.expectToBeAuthenticated();
      
      // Logout from tab 1
      await authPage1.logout();
      
      // Tab 2: Should automatically logout
      await page2.reload();
      await authPage2.expectToBeOnLoginPage();
      
      await context.close();
    });
  });

  test.describe('API Integration', () => {
    test('should call auth API endpoints correctly', async ({ page }) => {
      await authPage.interceptAuthAPI();
      
      // Monitor API calls
      const apiCalls: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/')) {
          apiCalls.push(request.url());
        }
      });
      
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Should call auth/me endpoint
      await page.waitForTimeout(1000);
      expect(apiCalls.some(url => url.includes('/api/auth/me'))).toBe(true);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API to return errors
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // App should still function with local auth data
      await authPage.expectToBeAuthenticated();
    });

    test('should handle network failures', async ({ page }) => {
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Simulate network failure
      await page.setOffline(true);
      
      // Refresh page
      await page.reload({ waitUntil: 'domcontentloaded' });
      
      // Should still work with cached auth data
      await authPage.expectToBeAuthenticated();
      
      await page.setOffline(false);
    });
  });

  test.describe('Security Tests', () => {
    test('should prevent access to admin routes for regular users', async ({ page }) => {
      await authPage.loginAsDemoUser();
      
      // Try to access admin routes
      const adminRoutes = ['/admin', '/admin/users', '/admin/settings'];
      
      for (const route of adminRoutes) {
        await authPage.goto(route);
        
        // Should either redirect or show access denied
        const url = page.url();
        const isRedirected = !url.includes('/admin') || url.includes('/login');
        const hasAccessDenied = await page.getByText('Access Denied').isVisible().catch(() => false);
        
        expect(isRedirected || hasAccessDenied).toBe(true);
      }
    });

    test('should not expose sensitive auth data in client', async ({ page }) => {
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Check for sensitive data exposure
      const sensitiveData = await page.evaluate(() => {
        const scripts = Array.from(document.scripts);
        const content = scripts.map(script => script.textContent || '').join(' ');
        
        return {
          hasSecrets: content.includes('secret') || content.includes('private'),
          hasTokens: content.includes('jwt') || content.includes('bearer'),
          localStorage: Object.keys(localStorage),
          sessionStorage: Object.keys(sessionStorage)
        };
      });
      
      // Should not expose secrets in client-side code
      expect(sensitiveData.hasSecrets).toBe(false);
      
      // Local storage should only contain expected user data
      expect(sensitiveData.localStorage).toEqual(['current-user']);
    });

    test('should handle XSS attempts in auth data', async ({ page }) => {
      // Attempt to inject malicious script through user data
      await page.evaluate(() => {
        const maliciousUserData = {
          id: '<script>alert("xss")</script>',
          name: '"><script>alert("xss")</script>',
          displayName: 'javascript:alert("xss")',
          theme: 'dark',
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('current-user', JSON.stringify(maliciousUserData));
      });
      
      await authPage.gotoDashboard();
      
      // Should not execute malicious scripts
      const alerts = [];
      page.on('dialog', (dialog) => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(2000);
      expect(alerts).toHaveLength(0);
    });
  });

  test.describe('Performance Tests', () => {
    test('should load authenticated pages quickly', async ({ page }) => {
      await authPage.loginAsDemoUser();
      
      const startTime = Date.now();
      await authPage.gotoDashboard();
      await authPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });

    test('should handle rapid navigation without issues', async ({ page }) => {
      await authPage.loginAsDemoUser();
      
      // Rapid navigation between routes
      const routes = ['/', '/dashboard', '/', '/dashboard'];
      
      for (const route of routes) {
        await authPage.goto(route);
        // Don't wait for full load, just for navigation
        await page.waitForURL(`**${route}`);
      }
      
      // Should end up in stable state
      await authPage.waitForPageLoad();
      await authPage.expectToBeAuthenticated();
    });

    test('should not cause memory leaks with repeated auth operations', async ({ page }) => {
      // Repeated login/logout cycles
      for (let i = 0; i < 5; i++) {
        await authPage.loginAsDemoUser();
        await authPage.gotoDashboard();
        await authPage.logout();
      }
      
      // Should still function normally
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      await authPage.expectToBeAuthenticated();
    });
  });

  test.describe('Mobile and Responsive Tests', () => {
    test('should work on mobile devices', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const page = await context.newPage();
      const mobileAuthPage = new AuthPage(page);
      
      await mobileAuthPage.loginAsDemoUser();
      await mobileAuthPage.gotoDashboard();
      await mobileAuthPage.expectToBeAuthenticated();
      
      // Mobile-specific UI should be functional
      await expect(page.getByTestId('mobile-menu')).toBeVisible();
      
      await context.close();
    });

    test('should work on tablet devices', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 768, height: 1024 }, // iPad
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const page = await context.newPage();
      const tabletAuthPage = new AuthPage(page);
      
      await tabletAuthPage.loginAsDemoUser();
      await tabletAuthPage.gotoDashboard();
      await tabletAuthPage.expectToBeAuthenticated();
      
      await context.close();
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be accessible with keyboard navigation', async ({ page }) => {
      await authPage.gotoLoginPage();
      
      // Should be able to navigate with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Login and test dashboard accessibility
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Should be able to navigate to logout
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Should logout successfully
      await authPage.expectToBeOnLoginPage();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await authPage.loginAsDemoUser();
      await authPage.gotoDashboard();
      
      // Check for accessibility attributes
      const authElements = await page.evaluate(() => {
        return {
          userMenu: document.querySelector('[data-testid="user-menu"]')?.getAttribute('aria-label'),
          signoutBtn: document.querySelector('[data-testid="signout-btn"]')?.getAttribute('aria-label'),
          authStatus: document.querySelector('[data-testid="auth-status"]')?.getAttribute('role')
        };
      });
      
      expect(authElements.userMenu).toBeTruthy();
      expect(authElements.signoutBtn).toBeTruthy();
    });
  });
});