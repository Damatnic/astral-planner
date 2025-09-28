/**
 * ZENITH ACCESSIBILITY TESTING SUITE
 * Comprehensive accessibility testing with axe-core and Playwright
 */
import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility test configuration
const ACCESSIBILITY_STANDARDS = {
  wcag21aa: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  section508: ['section508'],
  bestPractices: ['best-practice'],
};

const TEST_PAGES = [
  { name: 'Home', url: '/' },
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Goals', url: '/goals' },
  { name: 'Habits', url: '/habits' },
  { name: 'Settings', url: '/settings' },
  { name: 'Analytics', url: '/analytics' },
];

// Page Object for Accessibility Testing
class AccessibilityTester {
  constructor(private page: Page) {}

  async authenticateIfNeeded() {
    // Check if we need to authenticate
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      // Use demo PIN authentication
      const pinInput = this.page.locator('input[type="password"]');
      if (await pinInput.isVisible({ timeout: 5000 })) {
        await pinInput.fill('0000');
        await this.page.click('button[type="submit"]');
        await this.page.waitForURL('**/dashboard', { timeout: 10000 });
      }
    }
  }

  async navigateToPage(url: string) {
    await this.page.goto(url);
    await this.authenticateIfNeeded();
    await this.page.waitForLoadState('networkidle');
  }

  async runAxeAnalysis(standards: string[] = ACCESSIBILITY_STANDARDS.wcag21aa) {
    const axeBuilder = new AxeBuilder({ page: this.page })
      .withTags(standards)
      .exclude('#ads') // Exclude third-party content
      .exclude('[data-test="skip-accessibility"]'); // Allow opt-out for specific elements

    return await axeBuilder.analyze();
  }

  async checkKeyboardNavigation() {
    const focusableElements = await this.page.locator([
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')).all();

    const navigationResults = {
      totalFocusable: focusableElements.length,
      canFocus: 0,
      hasVisibleFocus: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
      try {
        const element = focusableElements[i];
        await element.focus();
        
        const isFocused = await element.evaluate(el => el === document.activeElement);
        if (isFocused) {
          navigationResults.canFocus++;
          
          // Check if focus is visible
          const focusStyles = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              outline: styles.outline,
              outlineWidth: styles.outlineWidth,
              outlineStyle: styles.outlineStyle,
              outlineColor: styles.outlineColor,
              boxShadow: styles.boxShadow,
            };
          });
          
          const hasVisibleFocus = focusStyles.outline !== 'none' || 
                                 focusStyles.outlineWidth !== '0px' ||
                                 focusStyles.boxShadow !== 'none';
          
          if (hasVisibleFocus) {
            navigationResults.hasVisibleFocus++;
          }
        }
      } catch (error) {
        navigationResults.errors.push(`Element ${i}: ${error.message}`);
      }
    }

    return navigationResults;
  }

  async checkColorContrast() {
    // Use axe to check color contrast specifically
    const contrastResults = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    return {
      violations: contrastResults.violations,
      passes: contrastResults.passes.length,
      incomplete: contrastResults.incomplete.length,
    };
  }

  async checkAriaLabels() {
    const ariaResults = await new AxeBuilder({ page: this.page })
      .withRules([
        'aria-valid-attr',
        'aria-valid-attr-value',
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
      ])
      .analyze();

    return {
      violations: ariaResults.violations,
      passes: ariaResults.passes.length,
    };
  }

  async checkSemanticStructure() {
    const structure = await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => ({ tag: h.tagName.toLowerCase(), text: h.textContent?.trim() }));
      
      const landmarks = Array.from(document.querySelectorAll('[role], main, nav, header, footer, aside, section'))
        .map(el => ({ tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || 'implicit' }));
      
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => ({ 
          src: img.src, 
          alt: img.alt, 
          hasAlt: img.hasAttribute('alt'),
          decorative: img.alt === '' 
        }));

      return { headings, landmarks, images };
    });

    // Validate heading hierarchy
    const headingErrors = [];
    for (let i = 1; i < structure.headings.length; i++) {
      const current = parseInt(structure.headings[i].tag.charAt(1));
      const previous = parseInt(structure.headings[i - 1].tag.charAt(1));
      
      if (current > previous + 1) {
        headingErrors.push(`Heading hierarchy skip: ${structure.headings[i - 1].tag} to ${structure.headings[i].tag}`);
      }
    }

    // Check for missing alt text
    const imageErrors = structure.images
      .filter(img => !img.hasAlt && !img.src.includes('data:'))
      .map(img => `Missing alt text: ${img.src}`);

    return {
      structure,
      headingErrors,
      imageErrors,
      hasMainLandmark: structure.landmarks.some(l => l.tag === 'main' || l.role === 'main'),
      hasNavLandmark: structure.landmarks.some(l => l.tag === 'nav' || l.role === 'navigation'),
    };
  }

  async checkScreenReaderCompatibility() {
    // Test screen reader specific attributes and patterns
    const srResults = await this.page.evaluate(() => {
      const results = {
        liveRegions: 0,
        skipLinks: 0,
        hiddenContent: 0,
        labeledElements: 0,
        describedElements: 0,
        errors: [] as string[],
      };

      // Count live regions
      results.liveRegions = document.querySelectorAll('[aria-live]').length;

      // Count skip links
      results.skipLinks = document.querySelectorAll('a[href^="#"]').length;

      // Count screen reader only content
      results.hiddenContent = document.querySelectorAll('.sr-only, .screen-reader-only, [aria-hidden="true"]').length;

      // Check form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input: HTMLInputElement) => {
        const hasLabel = input.labels && input.labels.length > 0;
        const hasAriaLabel = input.hasAttribute('aria-label');
        const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
        
        if (hasLabel || hasAriaLabel || hasAriaLabelledBy) {
          results.labeledElements++;
        } else if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
          results.errors.push(`Unlabeled form element: ${input.type} ${input.name || input.id || 'unknown'}`);
        }
      });

      // Check elements with descriptions
      results.describedElements = document.querySelectorAll('[aria-describedby]').length;

      return results;
    });

    return srResults;
  }
}

test.describe('Accessibility Testing Suite', () => {
  let accessibilityTester: AccessibilityTester;

  test.beforeEach(async ({ page }) => {
    accessibilityTester = new AccessibilityTester(page);
  });

  for (const testPage of TEST_PAGES) {
    test.describe(`${testPage.name} Page Accessibility`, () => {
      test.beforeEach(async () => {
        await accessibilityTester.navigateToPage(testPage.url);
      });

      test('should meet WCAG 2.1 AA standards', async () => {
        const results = await accessibilityTester.runAxeAnalysis();
        
        // Log violations for debugging
        if (results.violations.length > 0) {
          console.log(`\n❌ Accessibility violations on ${testPage.name}:`);
          results.violations.forEach(violation => {
            console.log(`  - ${violation.id}: ${violation.description}`);
            console.log(`    Impact: ${violation.impact}`);
            console.log(`    Nodes: ${violation.nodes.length}`);
          });
        }

        expect(results.violations).toHaveLength(0);
      });

      test('should support keyboard navigation', async () => {
        const navResults = await accessibilityTester.checkKeyboardNavigation();
        
        console.log(`\n⌨️  Keyboard navigation on ${testPage.name}:`);
        console.log(`  - Focusable elements: ${navResults.totalFocusable}`);
        console.log(`  - Can focus: ${navResults.canFocus}`);
        console.log(`  - Visible focus: ${navResults.hasVisibleFocus}`);
        
        if (navResults.errors.length > 0) {
          console.log(`  - Errors: ${navResults.errors.length}`);
          navResults.errors.forEach(error => console.log(`    ${error}`));
        }

        // At least 80% of focusable elements should be properly focusable
        const focusRate = navResults.totalFocusable > 0 ? 
          navResults.canFocus / navResults.totalFocusable : 1;
        expect(focusRate).toBeGreaterThan(0.8);

        // At least 70% should have visible focus indicators
        const visibleFocusRate = navResults.canFocus > 0 ? 
          navResults.hasVisibleFocus / navResults.canFocus : 1;
        expect(visibleFocusRate).toBeGreaterThan(0.7);
      });

      test('should have adequate color contrast', async () => {
        const contrastResults = await accessibilityTester.checkColorContrast();
        
        console.log(`\n🎨 Color contrast on ${testPage.name}:`);
        console.log(`  - Violations: ${contrastResults.violations.length}`);
        console.log(`  - Passes: ${contrastResults.passes}`);
        
        if (contrastResults.violations.length > 0) {
          console.log(`  - Details:`);
          contrastResults.violations.forEach(violation => {
            console.log(`    ${violation.description} (${violation.nodes.length} elements)`);
          });
        }

        expect(contrastResults.violations).toHaveLength(0);
      });

      test('should have proper ARIA implementation', async () => {
        const ariaResults = await accessibilityTester.checkAriaLabels();
        
        console.log(`\n🏷️  ARIA implementation on ${testPage.name}:`);
        console.log(`  - Violations: ${ariaResults.violations.length}`);
        console.log(`  - Passes: ${ariaResults.passes}`);
        
        if (ariaResults.violations.length > 0) {
          ariaResults.violations.forEach(violation => {
            console.log(`  - ${violation.id}: ${violation.description}`);
          });
        }

        expect(ariaResults.violations).toHaveLength(0);
      });

      test('should have semantic HTML structure', async () => {
        const structureResults = await accessibilityTester.checkSemanticStructure();
        
        console.log(`\n🏗️  Semantic structure on ${testPage.name}:`);
        console.log(`  - Headings: ${structureResults.structure.headings.length}`);
        console.log(`  - Landmarks: ${structureResults.structure.landmarks.length}`);
        console.log(`  - Images: ${structureResults.structure.images.length}`);
        console.log(`  - Has main landmark: ${structureResults.hasMainLandmark}`);
        console.log(`  - Has navigation landmark: ${structureResults.hasNavLandmark}`);
        
        if (structureResults.headingErrors.length > 0) {
          console.log(`  - Heading errors:`);
          structureResults.headingErrors.forEach(error => console.log(`    ${error}`));
        }
        
        if (structureResults.imageErrors.length > 0) {
          console.log(`  - Image errors:`);
          structureResults.imageErrors.forEach(error => console.log(`    ${error}`));
        }

        // Should have proper heading hierarchy
        expect(structureResults.headingErrors).toHaveLength(0);
        
        // Should have minimal image accessibility errors
        expect(structureResults.imageErrors.length).toBeLessThan(3);
        
        // Should have main landmark (except for landing page)
        if (testPage.name !== 'Home') {
          expect(structureResults.hasMainLandmark).toBe(true);
        }
      });

      test('should be screen reader compatible', async () => {
        const srResults = await accessibilityTester.checkScreenReaderCompatibility();
        
        console.log(`\n🔊 Screen reader compatibility on ${testPage.name}:`);
        console.log(`  - Live regions: ${srResults.liveRegions}`);
        console.log(`  - Skip links: ${srResults.skipLinks}`);
        console.log(`  - Hidden content: ${srResults.hiddenContent}`);
        console.log(`  - Labeled elements: ${srResults.labeledElements}`);
        console.log(`  - Described elements: ${srResults.describedElements}`);
        
        if (srResults.errors.length > 0) {
          console.log(`  - Errors:`);
          srResults.errors.forEach(error => console.log(`    ${error}`));
        }

        // Should have minimal labeling errors
        expect(srResults.errors.length).toBeLessThan(5);
      });

      test('should work with high contrast mode', async ({ page }) => {
        // Enable high contrast simulation
        await page.emulateMedia({ forcedColors: 'active' });
        
        // Re-run basic accessibility checks
        const results = await accessibilityTester.runAxeAnalysis();
        
        // Should not introduce new violations in high contrast mode
        const highContrastViolations = results.violations.filter(v => 
          v.id.includes('color') || v.id.includes('contrast')
        );
        
        expect(highContrastViolations).toHaveLength(0);
      });

      test('should be usable with screen magnification', async ({ page }) => {
        // Simulate screen magnification by zooming
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.evaluate(() => {
          document.body.style.zoom = '200%';
        });

        // Check that content is still accessible
        const results = await accessibilityTester.runAxeAnalysis(['wcag2aa']);
        
        // Should not break at high zoom levels
        const zoomViolations = results.violations.filter(v => 
          v.id.includes('scrollable') || v.id.includes('reflow')
        );
        
        expect(zoomViolations).toHaveLength(0);
      });
    });
  }

  test('Cross-page accessibility consistency', async ({ page }) => {
    const pageResults = [];
    
    for (const testPage of TEST_PAGES) {
      await accessibilityTester.navigateToPage(testPage.url);
      const results = await accessibilityTester.runAxeAnalysis();
      
      pageResults.push({
        page: testPage.name,
        violations: results.violations.length,
        passes: results.passes.length,
        violationTypes: results.violations.map(v => v.id),
      });
    }

    console.log('\n📊 Accessibility Summary Across All Pages:');
    pageResults.forEach(result => {
      console.log(`  ${result.page}: ${result.violations} violations, ${result.passes} passes`);
    });

    // Check for consistency in accessibility implementation
    const totalViolations = pageResults.reduce((sum, result) => sum + result.violations, 0);
    const averageViolations = totalViolations / pageResults.length;
    
    console.log(`\n📈 Average violations per page: ${averageViolations.toFixed(2)}`);
    
    // Should have consistently low violation rates across all pages
    expect(averageViolations).toBeLessThan(2);
    
    // No page should have more than 5 violations
    pageResults.forEach(result => {
      expect(result.violations).toBeLessThan(5);
    });
  });
});

// Performance impact of accessibility features
test.describe('Accessibility Performance Impact', () => {
  test('accessibility features should not significantly impact performance', async ({ page }) => {
    const accessibilityTester = new AccessibilityTester(page);
    
    // Test dashboard page as it's the most complex
    await accessibilityTester.navigateToPage('/dashboard');
    
    // Measure performance with accessibility features enabled
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Use PerformanceObserver to measure
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {
            domContentLoaded: 0,
            loadComplete: 0,
            firstContentfulPaint: 0,
          };
          
          entries.forEach(entry => {
            if (entry.name === 'DOMContentLoaded') {
              metrics.domContentLoaded = entry.duration;
            } else if (entry.name === 'loadEventEnd') {
              metrics.loadComplete = entry.duration;
            } else if (entry.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = entry.startTime;
            }
          });
          
          resolve(metrics);
        });
        
        observer.observe({ entryTypes: ['navigation', 'paint'] });
        
        // Fallback timeout
        setTimeout(() => {
          resolve({
            domContentLoaded: performance.now(),
            loadComplete: performance.now(),
            firstContentfulPaint: performance.now(),
          });
        }, 5000);
      });
    });

    console.log('\n⚡ Performance with accessibility features:');
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`  Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`);

    // Accessibility features shouldn't significantly impact performance
    // These are reasonable thresholds for a complex dashboard
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000);
  });
});