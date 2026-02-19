// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

/*
 * Playwright E2E Tests for DNCWARE Blockchain+ Explorer
 * 
 * How to run:
 * - All tests: npx playwright test
 * - Specific test: npx playwright test dashboard.spec.js
 * - UI mode: npx playwright test --ui
 * - Debug mode: npx playwright test --debug
 * 
 * Reports are saved to playwright-report/
 * To view HTML report: npx playwright show-report
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the base URL (dashboard is the default view)
    await page.goto('/index.html');
    // Wait for the page to be fully loaded
    await expect(page.locator('#dashboard')).toBeVisible();
  });

  test('displays dashboard with correct title and statistics', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Blockchain Explorer/i);
    
    // Verify dashboard container is visible
    await expect(page.locator('#dashboard')).toBeVisible();
    
    // Check that statistics are loaded (they should not show "-" once loaded)
    // Wait for at least one statistic to load properly
    await expect(page.locator('[name="num_blocks"]')).not.toHaveText('-', { timeout: 10000 });
    
    // Verify key statistics elements are present
    await expect(page.locator('[name="N"]')).toBeVisible();
    await expect(page.locator('[name="B"]')).toBeVisible();
    await expect(page.locator('[name="F"]')).toBeVisible();
    await expect(page.locator('[name="num_blocks"]')).toBeVisible();
    await expect(page.locator('[name="num_users"]')).toBeVisible();
    await expect(page.locator('[name="num_contracts"]')).toBeVisible();
    await expect(page.locator('#dashboard [name="num_transactions"]')).toBeVisible();
  });

  test('shows recent items sections when data is available', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Recent sections might be hidden if no data, so we check if they exist
    // and if visible, verify they have content
    const recentContracts = page.locator('#dashboard [name="recent_contracts"]').first();
    const recentUsers = page.locator('#dashboard [name="recent_users"]').first(); 
    const recentTransactions = page.locator('#dashboard [name="recent_transactions"]').first();
    
    // If recent contracts section is visible, check it has proper structure
    if (await recentContracts.isVisible()) {
      await expect(recentContracts.locator('.card-header').getByText('Recent Contracts')).toBeVisible();
      await expect(recentContracts.locator('.btn').getByText('View All')).toBeVisible();
    }
    
    // If recent users section is visible, check it has proper structure  
    if (await recentUsers.isVisible()) {
      await expect(recentUsers.locator('.card-header').getByText('Recent Users')).toBeVisible();
      await expect(recentUsers.locator('.btn').getByText('View All')).toBeVisible();
    }
    
    // If recent transactions section is visible, check it has proper structure
    if (await recentTransactions.isVisible()) {
      await expect(recentTransactions.locator('.card-header').getByText('Recent Transactions')).toBeVisible();
      await expect(recentTransactions.locator('.btn').getByText('View All')).toBeVisible();
    }
  });

  test('tooltips display helpful information', async ({ page }) => {
    // Hover over the N statistic to show tooltip
    await page.locator('[data-bs-title="Number of authorities"]').hover();
    // Note: Testing actual tooltip display is complex with Bootstrap tooltips
    // Here we just verify the tooltip attributes are present
    await expect(page.locator('[data-bs-title="Number of authorities"]')).toHaveAttribute('data-bs-title', 'Number of authorities');
    
    // Verify other tooltip attributes exist
    await expect(page.locator('[data-bs-title*="Byzantine"]')).toHaveAttribute('data-bs-title');
    await expect(page.locator('[data-bs-title*="Faulty"]')).toHaveAttribute('data-bs-title');
  });
});
