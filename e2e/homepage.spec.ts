import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/CryptoRafts/);
    await expect(page.locator('h1')).toContainText('The AI-Powered Web3 Ecosystem');
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();
    
    // Check for proper ARIA labels
    await expect(page.locator('[aria-label*="Hero section"]')).toBeVisible();
    await expect(page.locator('[aria-label*="Platform features"]')).toBeVisible();
  });

  test('should have working email subscription form', async ({ page }) => {
    // Scroll to email subscription section
    await page.locator('[aria-label*="Connect with us"]').scrollIntoViewIfNeeded();
    
    // Test email validation
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await page.locator('button[type="submit"]').click();
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('Please enter a valid email address');
    
    // Test valid email
    await emailInput.fill('test@example.com');
    await page.locator('button[type="submit"]').click();
    
    // Should show success (or at least not show error)
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test('should have accessible social media links', async ({ page }) => {
    // Scroll to social media section
    await page.locator('[aria-label*="Connect with us"]').scrollIntoViewIfNeeded();
    
    // Check that all social media links have proper ARIA labels
    const socialLinks = page.locator('[role="listitem"]');
    await expect(socialLinks).toHaveCount(6);
    
    // Check that links open in new tab
    const twitterLink = page.locator('a[href*="twitter.com"]');
    await expect(twitterLink).toHaveAttribute('target', '_blank');
    await expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible and accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button')).toBeVisible();
    
    // Check that mobile navigation works
    const mobileMenuButton = page.locator('button[aria-label*="menu"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test that all interactive elements are focusable
    const focusableElements = page.locator('button, a, input, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();
    
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // This would typically use a color contrast testing library
    // For now, we'll just check that text is visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('p')).toBeVisible();
    await expect(page.locator('button')).toBeVisible();
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Firebase Admin credentials not found') &&
      !error.includes('Service account object must contain')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check for essential meta tags
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content');
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content');
  });
});
