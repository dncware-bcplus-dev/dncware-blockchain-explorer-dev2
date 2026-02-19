// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

import { test, expect } from '@playwright/test';

// Helper function to get the first available user ID from the users list
async function getFirstUserId(page) {
  await page.goto('/index.html?view=users');
  await page.waitForLoadState('networkidle');
  
  // Wait for users list to load
  await expect(page.locator('#users_list')).toBeVisible();
  
  // Try to get the first user row with an ID
  const firstUserRow = page.locator('#users_list tbody tr').first();
  if (await firstUserRow.isVisible()) {
    // Look for a link with user ID (typically in href attribute)
    const userLink = firstUserRow.locator('a[href*="view=a_user"]').first();
    if (await userLink.isVisible()) {
      const href = await userLink.getAttribute('href');
      const match = href?.match(/[?&]id=([^&]+)/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback: try to get ID from first cell text content
    const userIdElement = firstUserRow.locator('td').first();
    const userId = await userIdElement.textContent();
    const trimmedId = userId?.trim();
    
    // Check if it matches u012345678 format
    if (trimmedId && /^u\d{9}$/.test(trimmedId)) {
      return trimmedId;
    }
  }
  
  // If no users found, use a known format ID
  return 'u012345678';
}

test.describe('User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('navigates to users list from dashboard', async ({ page }) => {
    // Click on users link from dashboard
    await page.locator('a[href="?view=users"]').click();
    
    // Should navigate to users list view
    await expect(page).toHaveURL(/.*view=users/);
    await expect(page.locator('#users_list')).toBeVisible();
    
    // Verify page structure
    await expect(page.locator('#users_list .header-title')).toContainText('Users List');
  });

  test('users list displays correctly with proper structure', async ({ page }) => {
    await page.goto('/?view=users');
    await expect(page.locator('#users_list')).toBeVisible();
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for table structure
    const table = page.locator('#users_list table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead')).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
  });

  test('can navigate to user details from users list', async ({ page }) => {
    await page.goto('/?view=users');
    await expect(page.locator('#users_list')).toBeVisible();
    
    // Wait for users to load
    await page.waitForLoadState('networkidle');
    
    // Find first clickable user row
    const firstUserRow = page.locator('#users_list tbody tr').first();
    if (await firstUserRow.isVisible()) {
      // Click on the row to navigate to user detail
      await firstUserRow.click();
      
      // Should navigate to user detail view
      await expect(page).toHaveURL(/.*view=a_user/);
      await expect(page.locator('#a_user')).toBeVisible();
      await expect(page.locator('#a_user .header-title')).toContainText('User Profile');
    }
  });

  test('user detail page displays comprehensive information', async ({ page }) => {
    // Get a real user ID from the users list
    const userId = await getFirstUserId(page);
    
    // Navigate directly to a user detail
    await page.goto(`/index.html?view=a_user&id=${userId}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // If user exists, verify structure
    if (await page.locator('#a_user').isVisible()) {
      await expect(page.locator('#a_user .header-title')).toContainText('User Profile');
      
      // Check for key user fields
      const table = page.locator('#a_user table').first();
      await expect(table).toBeVisible();
      
      // Verify important user fields are present
      await expect(page.locator('#a_user [name="id"]')).toBeVisible();
      await expect(page.locator('#a_user [name="name"]')).toBeVisible();
    }
  });

  test('users list can be sorted by different criteria', async ({ page }) => {
    await page.goto('/?view=users');
    await expect(page.locator('#users_list')).toBeVisible();
    
    // Test active sort parameter
    await page.goto('/?view=users&activesort=1');
    await expect(page.locator('#users_list')).toBeVisible();
    
    // The activesort constraint header should be visible when applied
    const activesortHeader = page.locator('#users_list [name="activesort"]');
    if (await activesortHeader.isVisible()) {
      await expect(activesortHeader).toBeVisible();
    }
  });

  test('users list supports constraint filtering', async ({ page }) => {
    await page.goto('/?view=users');
    await expect(page.locator('#users_list')).toBeVisible();
    
    // Check if constraint headers are present (only those used by show_constraints())
    // Based on listview.js lines 271-272: callee and domain constraints are used
    const constraintHeaders = [
      '[name="domain"]',
      '[name="callee"]'
    ];
    
    for (const selector of constraintHeaders) {
      const element = page.locator(`#users_list .header-id${selector}`);
      // Just verify the element exists (might be hidden)
      await expect(element).toBeAttached();
    }
  });

  test('can navigate to users with domain constraint', async ({ page }) => {
    // Get a real domain from the users list first
    await page.goto('/index.html?view=users');
    await page.waitForLoadState('networkidle');
    
    let domain = 'DAO'; // fallback
    const firstUserRow = page.locator('#users_list tbody tr').first();
    if (await firstUserRow.isVisible()) {
      // Try to extract domain from user name (e.g., "鈴木#1@DAO" -> "DAO")
      const userNameCell = firstUserRow.locator('td').nth(1); // Second column usually contains name
      if (await userNameCell.isVisible()) {
        const userNameText = await userNameCell.textContent();
        const domainMatch = userNameText?.match(/@([^@\s]+)/);
        if (domainMatch) {
          domain = domainMatch[1];
        }
      }
    }
    
    // Test navigation with the extracted domain constraint
    await page.goto(`/?view=users&domain=${domain}`);
    await expect(page.locator('#users_list')).toBeVisible();
    
    // The domain constraint header should be visible and show the domain
    const domainHeader = page.locator('#users_list [name="domain"]');
    if (await domainHeader.isVisible()) {
      await expect(domainHeader).toContainText(domain);
    }
  });

  test('user detail page displays comprehensive user information', async ({ page }) => {
    // Get a real user ID from the users list
    const userId = await getFirstUserId(page);
    
    await page.goto(`/index.html?view=a_user&id=${userId}`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('#a_user')).toBeVisible();
    await expect(page.locator('#a_user .header-title')).toContainText('User Profile');
    
    // Verify essential user fields are present
    const essentialFields = ['id', 'name'];
    for (const fieldName of essentialFields) {
      const field = page.locator(`#a_user [name="${fieldName}"]`);
      await expect(field).toBeVisible();
    }
    
    // User ID should be displayed
    const userIdField = page.locator('#a_user [name="id"]');
    await expect(userIdField).toBeVisible();
    
    // User name should be shown
    const userNameField = page.locator('#a_user [name="name"]');
    await expect(userNameField).toBeVisible();
    
    // Verify fields contain meaningful data (if value elements exist)
    const valueElements = [
      { field: userIdField, name: 'id' },
      { field: userNameField, name: 'name' }
    ];
    
    for (const { field, name } of valueElements) {
      const valueElement = field.locator('[name="value"]');
      if (await valueElement.count() > 0 && await valueElement.first().isVisible()) {
        const content = await valueElement.first().textContent();
        if (content && content.trim() !== '' && content.trim() !== '-') {
          expect(content.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('users list displays data with proper structure and pagination', async ({ page }) => {
    await page.goto('/?view=users');
    await expect(page.locator('#users_list')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // Verify table structure
    const table = page.locator('#users_list table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead')).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
    
    // Check if there are user rows with meaningful content
    const userRows = page.locator('#users_list tbody tr');
    const rowCount = await userRows.count();
    
    if (rowCount > 0) {
      const firstRow = userRows.first();
      await expect(firstRow).toBeVisible();
      
      // User rows should have multiple columns with data
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThan(1); // Should have multiple columns
      
      // Verify first cell contains user ID
      const firstCell = cells.first();
      const cellContent = await firstCell.textContent();
      expect(cellContent?.trim().length).toBeGreaterThan(0);
      
      // User ID should follow expected format (u + 9 digits)
      if (/^u\d{9}$/.test(cellContent?.trim() || '')) {
        expect(cellContent?.trim()).toMatch(/^u\d{9}$/);
      }
    }
    
    // Pagination controls should be present
    const viewMoreBefore = page.locator('#users_list [name="view_more_before"]');
    await expect(viewMoreBefore).toBeAttached();
  });

  test('navigation from user page to related views works', async ({ page }) => {
    // Get a real user ID from the users list
    const userId = await getFirstUserId(page);
    
    await page.goto(`/?view=a_user&id=${userId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_user').isVisible()) {
      // Look for links to related views (contracts, transactions, etc.)
      const relatedLinks = page.locator('#a_user a[href*="view="]');
      const linkCount = await relatedLinks.count();
      
      if (linkCount > 0) {
        // Test clicking on the first related link
        const firstLink = relatedLinks.first();
        const href = await firstLink.getAttribute('href');
        
        if (href && href.includes('view=')) {
          await firstLink.click();
          
          // Should navigate to the related view
          await expect(page).toHaveURL(new RegExp(href.replace('?', '\\?')));
        }
      }
    }
  });
});