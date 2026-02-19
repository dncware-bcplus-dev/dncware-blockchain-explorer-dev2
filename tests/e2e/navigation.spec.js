// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

import { test, expect } from '@playwright/test';

// Helper functions to get real IDs
async function getFirstContractId(page) {
  await page.goto('/index.html?view=contracts');
  await page.waitForLoadState('networkidle');
  
  const firstContractRow = page.locator('#contracts_list tbody tr').first();
  if (await firstContractRow.isVisible()) {
    const contractLink = firstContractRow.locator('a[href*="view=a_contract"]').first();
    if (await contractLink.isVisible()) {
      const href = await contractLink.getAttribute('href');
      const match = href?.match(/[?&]id=([^&]+)/);
      if (match) {
        return match[1];
      }
    }
  }
  return 'c012345678'; // fallback
}

async function getFirstUserId(page) {
  await page.goto('/index.html?view=users');
  await page.waitForLoadState('networkidle');
  
  const firstUserRow = page.locator('#users_list tbody tr').first();
  if (await firstUserRow.isVisible()) {
    const userLink = firstUserRow.locator('a[href*="view=a_user"]').first();
    if (await userLink.isVisible()) {
      const href = await userLink.getAttribute('href');
      const match = href?.match(/[?&]id=([^&]+)/);
      if (match) {
        return match[1];
      }
    }
    
    const userIdElement = firstUserRow.locator('td').first();
    const userId = await userIdElement.textContent();
    const trimmedId = userId?.trim();
    
    if (trimmedId && /^u\d{9}$/.test(trimmedId)) {
      return trimmedId;
    }
  }
  return 'u012345678'; // fallback
}

async function getFirstTransactionId(page) {
  await page.goto('/index.html?view=transactions');
  await page.waitForLoadState('networkidle');
  
  const firstTransactionRow = page.locator('#transactions_list tbody tr').first();
  if (await firstTransactionRow.isVisible()) {
    const transactionLink = firstTransactionRow.locator('a[href*="view=a_transaction"]').first();
    if (await transactionLink.isVisible()) {
      const href = await transactionLink.getAttribute('href');
      const match = href?.match(/[?&]id=([^&]+)/);
      if (match) {
        return match[1];
      }
    }
  }
  return 't012345678'; // fallback
}

async function getFirstBlockId(page) {
  await page.goto('/index.html?view=blocks');
  await page.waitForLoadState('networkidle');
  
  const firstBlockRow = page.locator('#blocks_list tbody tr').first();
  if (await firstBlockRow.isVisible()) {
    const blockLink = firstBlockRow.locator('a[href*="view=a_block"]').first();
    if (await blockLink.isVisible()) {
      const href = await blockLink.getAttribute('href');
      const match = href?.match(/[?&]id=([^&]+)/);
      if (match) {
        const blockId = parseInt(match[1]);
        if (blockId >= 1) {
          return blockId.toString();
        }
      }
    }
    
    const blockIdElement = firstBlockRow.locator('td').first();
    const blockId = await blockIdElement.textContent();
    const trimmedId = blockId?.trim();
    
    if (trimmedId && /^\d+$/.test(trimmedId)) {
      const blockNum = parseInt(trimmedId);
      if (blockNum >= 1) {
        return blockNum.toString();
      }
    }
  }
  
  return '1'; // fallback to block 1
}

test.describe('Navigation and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('navbar brand navigation works consistently', async ({ page }) => {
    // Navigate to different views and verify brand link returns to dashboard
    const views = ['users', 'contracts', 'transactions'];
    
    for (const view of views) {
      await page.goto(`/?view=${view}`);
      await expect(page).toHaveURL(new RegExp(`view=${view}`));
      
      // Click brand link to return to dashboard
      await page.locator('.navbar-brand').first().click();
      await expect(page).toHaveURL(/.*view=dashboard/);
      await expect(page.locator('#dashboard')).toBeVisible();
    }
  });

  test('navigation between all major views works', async ({ page }) => {
    const views = ['dashboard', 'users', 'contracts', 'transactions'];

    for (const view of views) {
      // Navigate to each view directly via URL
      await page.goto(`/?view=${view}`);
      await page.waitForLoadState('networkidle');
      
      // Verify the view loads correctly
      const expectedContainers = {
        'dashboard': '#dashboard',
        'users': '#users_list',
        'contracts': '#contracts_list', 
        'transactions': '#transactions_list'
      };
      
      const expectedContainer = expectedContainers[view];
      await expect(page.locator(expectedContainer)).toBeVisible();
    }
    
    // Test navbar brand navigation works from any page
    await page.goto('/?view=users');
    await page.waitForLoadState('networkidle');
    
    const navbarBrand = page.locator('.navbar-brand').first();
    if (await navbarBrand.isVisible()) {
      await navbarBrand.click();
      await expect(page.locator('#dashboard')).toBeVisible();
    }
  });

  test('direct URL navigation to all views works', async ({ page }) => {
    const views = [
      { url: '/index.html?view=dashboard', container: '#dashboard', title: /dashboard|blockchain explorer/i },
      { url: '/index.html?view=users', container: '#users_list', title: /users/i },
      { url: '/index.html?view=contracts', container: '#contracts_list', title: /contracts/i },
      { url: '/index.html?view=transactions', container: '#transactions_list', title: /transactions/i },
      { url: '/index.html?view=blocks', container: '#blocks_list', title: /blocks/i },
      { url: '/index.html?view=peers', container: '#peers_list', title: /peers/i }
    ];

    for (const view of views) {
      await page.goto(view.url);
      await expect(page).toHaveURL(new RegExp(view.url.replace('?', '\\?')));
      
      // Wait for the specific container to be visible
      await expect(page.locator(view.container)).toBeVisible();
    }
  });

  test('handles invalid view gracefully', async ({ page }) => {
    // Navigate to an invalid view
    await page.goto('/index.html?view=nonexistentview');
    
    // Should fallback to dashboard or show appropriate error
    const isDashboard = await page.locator('#dashboard').isVisible();
    const hasError = await page.locator('.alert, .error, [class*="error"]').first().isVisible();
    
    // Either should show dashboard (default fallback) or an error message
    expect(isDashboard || hasError).toBeTruthy();
  });

  test('navigation to valid item details works', async ({ page }) => {
    // Test navigation to existing items with real IDs
    const contractId = await getFirstContractId(page);
    const userId = await getFirstUserId(page);
    const transactionId = await getFirstTransactionId(page);
    const blockId = await getFirstBlockId(page);

    const validItems = [
      { url: `/index.html?view=a_contract&id=${contractId}`, container: '#a_contract' },
      { url: `/index.html?view=a_user&id=${userId}`, container: '#a_user' },
      { url: `/index.html?view=a_transaction&id=${transactionId}`, container: '#a_transaction' },
      { url: `/index.html?view=a_block&id=${blockId}`, container: '#a_block' }
    ];

    for (const item of validItems) {
      await page.goto(item.url);
      await page.waitForLoadState('networkidle');
      
      // Should display the detail view
      await expect(page.locator(item.container)).toBeVisible();
    }
  });

  test('handles invalid item ID gracefully', async ({ page }) => {
    // Try to access non-existent items with correct format but non-existent IDs
    const invalidItems = [
      '/index.html?view=a_transaction&id=t999999999',
      '/index.html?view=a_user&id=u999999999', 
      '/index.html?view=a_contract&id=c999999999',
      '/index.html?view=a_block&id=99999'
    ];

    for (const url of invalidItems) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Application should handle invalid IDs without crashing
      // We just verify the page loads and shows some content
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
      
      // Check that the page has basic structure
      const hasNavbar = await page.locator('#the_navbar').isVisible();
      expect(hasNavbar).toBeTruthy();
    }
  });

  test('search functionality works from different pages', async ({ page }) => {
    const pages = ['dashboard', 'users', 'contracts', 'transactions'];
    
    for (const pageView of pages) {
      await page.goto(`/?view=${pageView}`);
      
      // Perform search
      const searchInput = page.locator('#the_navbar form[name="search"] input');
      await searchInput.fill('test');
      await page.locator('#the_navbar form[name="search"] button').click();
      
      // Should navigate to search results
      await expect(page).toHaveURL(/.*view=search.*id=test/);
      await expect(page.locator('#search_results')).toBeVisible();
    }
  });

  test('page loading states are handled properly', async ({ page }) => {
    // Navigate to a data-heavy view
    await page.goto('/index.html?view=transactions');
    
    // The container should become visible
    await expect(page.locator('#transactions_list')).toBeVisible();
    
    // Wait for network requests to complete
    await page.waitForLoadState('networkidle');
    
    // Table structure should be present
    await expect(page.locator('#transactions_list table')).toBeVisible();
  });

  test('responsive navigation elements work', async ({ page }) => {
    // Test main navbar
    const mainNavbar = page.locator('#the_navbar');
    await expect(mainNavbar).toBeVisible();
    
    // Test if mini navbar appears on scroll (if implemented)
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500); // Wait for scroll effects
    
    const miniNavbar = page.locator('#mini_navbar');
    // Mini navbar might be visible or hidden depending on scroll position
    const isMiniNavbarVisible = await miniNavbar.isVisible();
    
    if (isMiniNavbarVisible) {
      // If mini navbar is visible, its search should work too
      const miniSearch = miniNavbar.locator('form[name="search"] input');
      if (await miniSearch.isVisible()) {
        await miniSearch.fill('test');
        await miniNavbar.locator('form[name="search"] button').click();
        await expect(page).toHaveURL(/.*view=search.*id=test/);
      }
    }
  });

  test('browser back/forward navigation works', async ({ page }) => {
    // Start at dashboard
    await page.goto('/index.html');
    await expect(page.locator('#dashboard')).toBeVisible();
    
    // Navigate to users
    await page.goto('/index.html?view=users');
    await expect(page.locator('#users_list')).toBeVisible();
    
    // Navigate to contracts
    await page.goto('/index.html?view=contracts');
    await expect(page.locator('#contracts_list')).toBeVisible();
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*view=users/);
    await expect(page.locator('#users_list')).toBeVisible();
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*view=contracts/);
    await expect(page.locator('#contracts_list')).toBeVisible();
  });

  test('page accessibility basics', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility elements
    const pageTitle = await page.title();
    expect(pageTitle).toMatch(/blockchain explorer/i);
    
    // Navigation should be keyboard accessible
    const navLinks = page.locator('.navbar a, .navbar button');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    
    // Main content areas should be properly structured
    const mainContent = page.locator('main, .container, #dashboard');
    await expect(mainContent.first()).toBeVisible();
  });

  test('external resources load properly', async ({ page }) => {
    await page.goto('/index.html');
    
    // Check that external CSS is loaded (Bootstrap)
    const bootstrapStyles = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.some(link => link.href.includes('bootstrap'));
    });
    expect(bootstrapStyles).toBeTruthy();
    
    // Check that external JS is loaded (jQuery, Bootstrap)
    const hasJQuery = await page.evaluate(() => typeof window.$ !== 'undefined');
    expect(hasJQuery).toBeTruthy();
  });

  test('page loads with essential elements', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check that essential page elements are present
    await expect(page.locator('#the_navbar')).toBeVisible();
    await expect(page.locator('#dashboard')).toBeVisible();
    
    // Check that the page has basic interactivity
    const pageTitle = await page.title();
    expect(pageTitle.length).toBeGreaterThan(0);
  });

  test('handles special characters in search and URLs', async ({ page }) => {
    // Test search with special characters
    const specialQueries = ['test@domain.com', 'contract#123', 'user_name'];
    
    for (const query of specialQueries) {
      await page.goto('/index.html');
      const searchInput = page.locator('#the_navbar form[name="search"] input');
      await searchInput.fill(query);
      await page.locator('#the_navbar form[name="search"] button').click();
      
      // Should handle the search gracefully
      await expect(page).toHaveURL(/.*view=search/);
      await expect(page.locator('#search_results')).toBeVisible();
    }
  });
});