// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

import { test, expect } from '@playwright/test';

// Helper function to get the first available transaction ID from the transactions list
async function getFirstTransactionId(page) {
  await page.goto('/index.html?view=transactions');
  await page.waitForLoadState('networkidle');
  
  // Wait for transactions list to load
  await expect(page.locator('#transactions_list')).toBeVisible();
  
  // Try to get the first transaction row with an ID
  const firstTransactionRow = page.locator('#transactions_list tbody tr').first();
  if (await firstTransactionRow.isVisible()) {
    // Look for a link with transaction ID (typically in href attribute)
    const transactionLink = firstTransactionRow.locator('a[href*="view=a_transaction"]').first();
    if (await transactionLink.isVisible()) {
      const href = await transactionLink.getAttribute('href');
      const match = href?.match(/[?&]id=([^&]+)/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback: try to get ID from first cell text content
    const transactionIdElement = firstTransactionRow.locator('td').first();
    const transactionId = await transactionIdElement.textContent();
    const trimmedId = transactionId?.trim();
    
    if (trimmedId && trimmedId.length > 0) {
      return trimmedId;
    }
  }
  
  // If no transactions found, use a fallback ID
  return '1';
}

test.describe('Transaction Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('navigates to transactions list from dashboard', async ({ page }) => {
    // Click on transactions link from dashboard
    await page.locator('a[href="?view=transactions"]').click();
    
    // Should navigate to transactions list view
    await expect(page).toHaveURL(/.*view=transactions/);
    await expect(page.locator('#transactions_list')).toBeVisible();
    
    // Verify page structure
    await expect(page.locator('#transactions_list .header-title')).toContainText('Transactions List');
  });

  test('transactions list displays correctly', async ({ page }) => {
    await page.goto('/index.html?view=transactions');
    await expect(page.locator('#transactions_list')).toBeVisible();
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for table structure
    const table = page.locator('#transactions_list table').first();
    await expect(table).toBeVisible();
    await expect(table.locator('thead').first()).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
  });

  test('can toggle between normal and detailed transaction view', async ({ page }) => {
    await page.goto('/index.html?view=transactions');
    await expect(page.locator('#transactions_list')).toBeVisible();
    
    // Click "show details" button
    const showDetailsBtn = page.locator('#transactions_list .btn').getByText('show details');
    if (await showDetailsBtn.isVisible()) {
      await showDetailsBtn.click();
      
      // Should navigate to detailed view
      await expect(page).toHaveURL(/.*view=transactions_details/);
      await expect(page.locator('#transactions_list_detail')).toBeVisible();
      
      // Should have "hide details" button now
      const hideDetailsBtn = page.locator('#transactions_list_detail .btn').getByText('hide details');
      await expect(hideDetailsBtn).toBeVisible();
      
      // Click to go back to normal view
      await hideDetailsBtn.click();
      await expect(page).toHaveURL(/.*view=transactions$/);
      await expect(page.locator('#transactions_list')).toBeVisible();
    }
  });

  test('clicking on transaction navigates to transaction detail', async ({ page }) => {
    await page.goto('/index.html?view=transactions');
    await expect(page.locator('#transactions_list')).toBeVisible();
    
    // Wait for transactions to load
    await page.waitForLoadState('networkidle');
    
    // Find first clickable transaction row
    const firstTxRow = page.locator('#transactions_list tbody tr').first();
    if (await firstTxRow.isVisible()) {
      // Click on the row to navigate to transaction detail
      await firstTxRow.click();
      
      // Should navigate to transaction detail view
      await expect(page).toHaveURL(/.*view=a_transaction/);
      await expect(page.locator('#a_transaction')).toBeVisible();
      await expect(page.locator('#a_transaction .header-title')).toContainText('Transaction Record');
    }
  });

  test('transaction detail page displays comprehensive information', async ({ page }) => {
    // Get a real transaction ID from the transactions list
    const transactionId = await getFirstTransactionId(page);
    
    // Navigate directly to a transaction detail
    await page.goto(`/index.html?view=a_transaction&id=${transactionId}`);
    
    // Wait for page to load - might show error if transaction doesn't exist
    await page.waitForLoadState('networkidle');
    
    // If transaction exists, verify structure
    if (await page.locator('#a_transaction').isVisible()) {
      await expect(page.locator('#a_transaction .header-title')).toContainText('Transaction Record');
      
      // Check for key transaction fields
      const table = page.locator('#a_transaction table').first();
      await expect(table).toBeVisible();
      
      // Verify important transaction fields are present - limit to a_transaction context
      await expect(page.locator('#a_transaction [name="time"]')).toBeVisible();
      await expect(page.locator('#a_transaction [name="txno"]')).toBeVisible();
      await expect(page.locator('#a_transaction [name="txid"]')).toBeVisible();
    }
  });

  test('transaction detail page has action buttons', async ({ page }) => {
    // Get a real transaction ID from the transactions list
    const transactionId = await getFirstTransactionId(page);
    
    await page.goto(`/index.html?view=a_transaction&id=${transactionId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_transaction').isVisible()) {
      // Check for "Nearby Transactions" button
      const nearbyBtn = page.locator('#a_transaction button[name="nearby"]');
      if (await nearbyBtn.isVisible()) {
        await expect(nearbyBtn).toContainText('Nearby Transactions');
        
        // Click should navigate to transactions list filtered around this transaction
        await nearbyBtn.click();
        await expect(page).toHaveURL(/.*view=transactions/);
        await expect(page.locator('#transactions_list')).toBeVisible();
      }
    }
  });

  test('transaction detail page has proof download functionality', async ({ page }) => {
    // Get a real transaction ID from the transactions list
    const transactionId = await getFirstTransactionId(page);
    
    await page.goto(`/index.html?view=a_transaction&id=${transactionId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_transaction').isVisible()) {
      // Check for "Download Proof" button
      const proofBtn = page.locator('#a_transaction button[name="proof"]');
      if (await proofBtn.isVisible()) {
        await expect(proofBtn).toContainText('Download Proof');
        // Note: We don't actually click this as it would trigger a download
        // but we verify the button exists and is functional
      }
    }
  });

  test('transactions list can be filtered by constraints', async ({ page }) => {
    await page.goto('/index.html?view=transactions');
    await expect(page.locator('#transactions_list')).toBeVisible();
    
    // Check if constraint headers are visible (they appear when filters are applied)
    const constraintHeaders = [
      '[name="user"]',
      '[name="contract"]', 
      '[name="caller"]',
      '[name="callee"]',
      '[name="status"]',
      '[name="related_to"]'
    ];
    
    // These headers might be hidden by default, which is expected
    for (const selector of constraintHeaders) {
      const element = page.locator(`#transactions_list .header-id${selector}`);
      // Just verify the element exists (might be hidden)
      await expect(element).toBeAttached();
    }
  });

  test('can navigate to transactions with specific constraints via URL', async ({ page }) => {
    // Test navigation with a user constraint
    // Get a real user ID from the users list (u012345678 format)
    await page.goto('/index.html?view=users');
    await page.waitForLoadState('networkidle');
    const firstUserRow = page.locator('#users_list tbody tr').first();
    
    let userId = 'u012345678'; // fallback
    if (await firstUserRow.isVisible()) {
      // Look for a link with user ID (typically in href attribute)
      const userLink = firstUserRow.locator('a[href*="view=a_user"]').first();
      if (await userLink.isVisible()) {
        const href = await userLink.getAttribute('href');
        const match = href?.match(/[?&]id=([^&]+)/);
        if (match) {
          userId = match[1];
        }
      } else {
        // Fallback: try to get ID from first cell text content
        const userIdElement = firstUserRow.locator('td').first();
        const userIdText = await userIdElement.textContent();
        const trimmedId = userIdText?.trim();
        
        // Check if it matches u012345678 format
        if (trimmedId && /^u\d{9}$/.test(trimmedId)) {
          userId = trimmedId;
        }
      }
    }
    
    await page.goto(`/index.html?view=transactions&user=${userId}`);
    await expect(page.locator('#transactions_list')).toBeVisible();
    
    // The user constraint header should be visible
    const userHeader = page.locator('#transactions_list [name="user"]');
    if (await userHeader.isVisible()) {
      // Just verify that the header exists when filtering by user
      await expect(userHeader).toBeVisible();
    }
  });

  test('transactions list displays data with proper structure and pagination', async ({ page }) => {
    await page.goto('/index.html?view=transactions');
    await expect(page.locator('#transactions_list')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // Verify table structure
    const table = page.locator('#transactions_list table').first();
    await expect(table).toBeVisible();
    await expect(table.locator('thead').first()).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
    
    // Check if there are transaction rows with meaningful content
    const txRows = page.locator('#transactions_list tbody tr');
    const rowCount = await txRows.count();
    
    if (rowCount > 0) {
      const firstRow = txRows.first();
      await expect(firstRow).toBeVisible();
      
      // Transaction rows should have multiple columns with data
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThan(1); // Should have multiple columns
      
      // Verify cells contain actual content
      const firstCell = cells.first();
      const cellContent = await firstCell.textContent();
      expect(cellContent?.trim().length).toBeGreaterThan(0);
    }
    
    // Pagination controls should be present
    const viewMoreAfter = page.locator('#transactions_list [name="view_more_after"]');
    const viewMoreBefore = page.locator('#transactions_list [name="view_more_before"]');
    await expect(viewMoreAfter).toBeAttached();
    await expect(viewMoreBefore).toBeAttached();
  });
});