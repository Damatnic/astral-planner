// ============================================================================
// ZENITH E2E AUTHENTICATION SETUP - PLAYWRIGHT AUTH SETUP
// ============================================================================

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate with demo account', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  // Check if already authenticated by looking for dashboard elements
  try {
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });
    console.log('Already authenticated, saving current state');
    await page.context().storageState({ path: authFile });
    return;
  } catch {
    // Not authenticated, proceed with login
  }

  // Navigate to login if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    await page.goto('/login');
  }

  // Wait for login page to load
  await page.waitForLoadState('networkidle');

  // Look for demo account login option
  // This might be a button, link, or form field depending on implementation
  
  // Try to find PIN input field
  const pinInput = page.locator('input[type="password"], input[placeholder*="PIN"], input[name*="pin"]').first();
  
  if (await pinInput.isVisible()) {
    // Enter demo PIN
    await pinInput.fill('0000');
    
    // Find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await submitButton.click();
  } else {
    // Look for demo account button or link
    const demoButton = page.locator('button:has-text("Demo"), a:has-text("Demo"), [data-testid="demo-login"]').first();
    
    if (await demoButton.isVisible()) {
      await demoButton.click();
      
      // If there's a PIN field after clicking demo
      const demoPinInput = page.locator('input[type="password"], input[placeholder*="PIN"]').first();
      if (await demoPinInput.isVisible()) {
        await demoPinInput.fill('0000');
        const demoSubmitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
        await demoSubmitButton.click();
      }
    } else {
      // Fallback: try to find any form and fill with demo credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('demo@astralchronos.com');
        await pinInput.fill('0000');
        const submitBtn = page.locator('button[type="submit"]').first();
        await submitBtn.click();
      }
    }
  }

  // Wait for authentication to complete
  await page.waitForURL(url => url.pathname === '/' || url.pathname.includes('/dashboard'), {
    timeout: 10000
  });

  // Verify we're authenticated by checking for user elements
  await expect(page.locator('body')).toBeVisible();
  
  // Wait a bit more for authentication state to stabilize
  await page.waitForTimeout(2000);

  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('Demo authentication completed and saved');
});