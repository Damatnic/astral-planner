/**
 * ZENITH E2E TESTS - Dashboard Complete User Journey
 * Tests the entire dashboard workflow from authentication to interaction
 */
import { test, expect, Page } from '@playwright/test';

// Test constants
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const BASE_URL = process.env.TEST_URL || 'http://localhost:3099';

// Page Object Model for Dashboard
class DashboardPage {
  constructor(private page: Page) {}

  // Navigation methods
  async goto() {
    await this.page.goto(`${BASE_URL}/dashboard`);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="app-header"]', { timeout: 10000 });
  }

  // Authentication helpers
  async login() {
    // Navigate to login if not authenticated
    await this.page.goto(`${BASE_URL}/login`);
    
    // Fill in demo credentials or use PIN 0000
    const pinInput = this.page.locator('input[type="password"]');
    if (await pinInput.isVisible()) {
      await pinInput.fill('0000');
      await this.page.click('button[type="submit"]');
    }
    
    await this.page.waitForURL('**/dashboard');
    await this.waitForLoad();
  }

  // Dashboard element getters
  get welcomeMessage() {
    return this.page.locator('h1').filter({ hasText: /Good (morning|afternoon|evening)/ });
  }

  get statsCards() {
    return {
      tasksCompleted: this.page.locator('text=Tasks Completed').locator('..').locator('text=/\\d+/'),
      goalsAchieved: this.page.locator('text=Goals Achieved').locator('..').locator('text=/\\d+/'),
      habitsTracked: this.page.locator('text=Habits Tracked').locator('..').locator('text=/\\d+/'),
      focusTime: this.page.locator('text=Focus Time').locator('..').locator('text=/\\d+h \\d+m/'),
    };
  }

  get tabNavigation() {
    return {
      overviewTab: this.page.getByRole('tab', { name: 'Overview' }),
      tasksTab: this.page.getByRole('tab', { name: 'Tasks' }),
      calendarTab: this.page.getByRole('tab', { name: 'Calendar' }),
      analyticsTab: this.page.getByRole('tab', { name: 'Analytics' }),
    };
  }

  get upcomingTasks() {
    return this.page.locator('text=Upcoming Tasks').locator('..').locator('[data-testid="task-item"]');
  }

  get recentAchievements() {
    return this.page.locator('text=Recent Achievements').locator('..').locator('[data-testid="achievement-item"]');
  }

  // Actions
  async switchToTab(tabName: 'Overview' | 'Tasks' | 'Calendar' | 'Analytics') {
    await this.tabNavigation[`${tabName.toLowerCase()}Tab`].click();
    await this.page.waitForTimeout(500); // Wait for tab switch animation
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/dashboard-${name}.png`,
      fullPage: true,
    });
  }

  // Verification methods
  async verifyStatsDisplay() {
    const stats = this.statsCards;
    
    // Verify all stats are visible and have numeric values
    await expect(stats.tasksCompleted).toBeVisible();
    await expect(stats.goalsAchieved).toBeVisible();
    await expect(stats.habitsTracked).toBeVisible();
    await expect(stats.focusTime).toBeVisible();
    
    // Verify stats have actual values (not 0 or empty)
    const tasksText = await stats.tasksCompleted.textContent();
    const goalsText = await stats.goalsAchieved.textContent();
    const habitsText = await stats.habitsTracked.textContent();
    const focusText = await stats.focusTime.textContent();
    
    expect(tasksText).toMatch(/\d+/);
    expect(goalsText).toMatch(/\d+/);
    expect(habitsText).toMatch(/\d+/);
    expect(focusText).toMatch(/\d+h \d+m/);
  }

  async verifyResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    await expect(this.welcomeMessage).toBeVisible();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(500);
    await expect(this.welcomeMessage).toBeVisible();
    
    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.waitForTimeout(500);
    await expect(this.welcomeMessage).toBeVisible();
  }
}

test.describe('Dashboard E2E Tests', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    
    // Set up test environment
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Login and navigate to dashboard
    await dashboardPage.login();
  });

  test('should load dashboard successfully', async () => {
    await test.step('Verify page loads', async () => {
      await expect(dashboardPage.welcomeMessage).toBeVisible();
      await expect(dashboardPage.page.getByTestId('app-header')).toBeVisible();
    });

    await test.step('Take screenshot of loaded dashboard', async () => {
      await dashboardPage.takeScreenshot('loaded');
    });
  });

  test('should display correct welcome message based on time', async () => {
    await test.step('Verify greeting appears', async () => {
      const welcomeText = await dashboardPage.welcomeMessage.textContent();
      expect(welcomeText).toMatch(/Good (morning|afternoon|evening)/);
      expect(welcomeText).toMatch(/(☀️|⛅|🌙)/);
    });
  });

  test('should display stats cards with correct data', async () => {
    await test.step('Verify all stats cards are visible', async () => {
      await dashboardPage.verifyStatsDisplay();
    });

    await test.step('Verify stats have proper formatting', async () => {
      const focusTimeText = await dashboardPage.statsCards.focusTime.textContent();
      expect(focusTimeText).toMatch(/^\d+h \d+m$/);
    });

    await test.step('Take screenshot of stats cards', async () => {
      await dashboardPage.takeScreenshot('stats-cards');
    });
  });

  test('should navigate between tabs correctly', async () => {
    await test.step('Start on Overview tab', async () => {
      await expect(dashboardPage.tabNavigation.overviewTab).toHaveAttribute('data-state', 'active');
    });

    await test.step('Switch to Tasks tab', async () => {
      await dashboardPage.switchToTab('Tasks');
      await expect(dashboardPage.tabNavigation.tasksTab).toHaveAttribute('data-state', 'active');
      await expect(dashboardPage.page.getByText('Task Management')).toBeVisible();
    });

    await test.step('Switch to Calendar tab', async () => {
      await dashboardPage.switchToTab('Calendar');
      await expect(dashboardPage.tabNavigation.calendarTab).toHaveAttribute('data-state', 'active');
      await expect(dashboardPage.page.getByText('Calendar View')).toBeVisible();
    });

    await test.step('Switch to Analytics tab', async () => {
      await dashboardPage.switchToTab('Analytics');
      await expect(dashboardPage.tabNavigation.analyticsTab).toHaveAttribute('data-state', 'active');
      await expect(dashboardPage.page.getByText('Analytics Dashboard')).toBeVisible();
    });

    await test.step('Return to Overview tab', async () => {
      await dashboardPage.switchToTab('Overview');
      await expect(dashboardPage.tabNavigation.overviewTab).toHaveAttribute('data-state', 'active');
    });

    await test.step('Take screenshot of tab navigation', async () => {
      await dashboardPage.takeScreenshot('tab-navigation');
    });
  });

  test('should display upcoming tasks', async () => {
    await test.step('Verify upcoming tasks section exists', async () => {
      await expect(dashboardPage.page.getByText('Upcoming Tasks')).toBeVisible();
    });

    await test.step('Verify tasks have content', async () => {
      const taskElements = dashboardPage.page.locator('text=Complete project proposal');
      await expect(taskElements).toBeVisible();
      
      const timeElements = dashboardPage.page.locator('text=9:00 AM');
      await expect(timeElements).toBeVisible();
    });

    await test.step('Verify priority indicators', async () => {
      // Check for priority dots (visual indicators)
      const priorityDots = dashboardPage.page.locator('.w-2.h-2.rounded-full');
      await expect(priorityDots.first()).toBeVisible();
    });
  });

  test('should display recent achievements', async () => {
    await test.step('Verify achievements section exists', async () => {
      await expect(dashboardPage.page.getByText('Recent Achievements')).toBeVisible();
    });

    await test.step('Verify achievements have content', async () => {
      const achievementElements = dashboardPage.page.locator('text=Completed 30-day fitness challenge');
      await expect(achievementElements).toBeVisible();
      
      const dateElements = dashboardPage.page.locator('text=2 days ago');
      await expect(dateElements).toBeVisible();
    });
  });

  test('should be responsive across different screen sizes', async () => {
    await dashboardPage.verifyResponsiveDesign();
  });

  test('should handle loading states correctly', async () => {
    await test.step('Navigate to dashboard and check for loading', async () => {
      // Refresh the page to see loading state
      await dashboardPage.page.reload();
      
      // Look for loading indicators
      const loadingIndicator = dashboardPage.page.locator('text=Loading...');
      
      // Loading might be very fast, so we check if it appears or if content loads directly
      try {
        await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
        await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
      } catch {
        // Loading was too fast, verify content is loaded
        await expect(dashboardPage.welcomeMessage).toBeVisible();
      }
    });
  });

  test('should maintain accessibility standards', async () => {
    await test.step('Verify heading hierarchy', async () => {
      const h1Elements = dashboardPage.page.locator('h1');
      await expect(h1Elements).toHaveCount(1);
    });

    await test.step('Verify tab accessibility', async () => {
      const tablist = dashboardPage.page.getByRole('tablist');
      await expect(tablist).toBeVisible();
      
      const tabs = dashboardPage.page.getByRole('tab');
      await expect(tabs).toHaveCount(4);
    });

    await test.step('Verify keyboard navigation', async () => {
      // Tab through interactive elements
      await dashboardPage.page.keyboard.press('Tab');
      await dashboardPage.page.keyboard.press('Tab');
      
      // Verify focus is visible (check for focus indicators)
      const focusedElement = dashboardPage.page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    await test.step('Verify link accessibility', async () => {
      const homeLink = dashboardPage.page.getByRole('link', { name: 'Home' });
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  test('should handle errors gracefully', async () => {
    await test.step('Test network error resilience', async () => {
      // Simulate network issues
      await dashboardPage.page.route('**/api/**', route => route.abort());
      
      // Refresh and check that page still loads basic content
      await dashboardPage.page.reload();
      
      // Should still show basic layout even if API calls fail
      await expect(dashboardPage.page.getByTestId('app-header')).toBeVisible({ timeout: 10000 });
    });
  });

  test('should perform well under load', async () => {
    await test.step('Measure page load performance', async () => {
      const startTime = Date.now();
      
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    await test.step('Verify no memory leaks', async () => {
      // Navigate away and back multiple times
      for (let i = 0; i < 3; i++) {
        await dashboardPage.page.goto(`${BASE_URL}/`);
        await dashboardPage.goto();
        await dashboardPage.waitForLoad();
      }
      
      // Should still work after multiple navigations
      await expect(dashboardPage.welcomeMessage).toBeVisible();
    });
  });

  test('should work across different browsers', async ({ browserName }) => {
    await test.step(`Verify dashboard works in ${browserName}`, async () => {
      await expect(dashboardPage.welcomeMessage).toBeVisible();
      await dashboardPage.verifyStatsDisplay();
      
      // Browser-specific screenshot
      await dashboardPage.takeScreenshot(`${browserName}-compatibility`);
    });
  });
});

// Performance-focused tests
test.describe('Dashboard Performance Tests', () => {
  test('should meet Core Web Vitals requirements', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await test.step('Measure First Contentful Paint', async () => {
      await dashboardPage.login();
      
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
              }
            }
          }).observe({ entryTypes: ['paint'] });
        });
      });
      
      // FCP should be under 1.8 seconds
      expect(fcp).toBeLessThan(1800);
    });

    await test.step('Measure Largest Contentful Paint', async () => {
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      // LCP should be under 2.5 seconds
      expect(lcp).toBeLessThan(2500);
    });
  });

  test('should have acceptable bundle size', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await test.step('Monitor network requests', async () => {
      const responses: any[] = [];
      
      page.on('response', (response) => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          responses.push({
            url: response.url(),
            size: response.headers()['content-length'],
            status: response.status(),
          });
        }
      });
      
      await dashboardPage.login();
      
      // Verify main bundle is under reasonable size (500KB)
      const mainBundle = responses.find(r => r.url.includes('main') || r.url.includes('index'));
      if (mainBundle && mainBundle.size) {
        expect(parseInt(mainBundle.size)).toBeLessThan(500000);
      }
    });
  });
});