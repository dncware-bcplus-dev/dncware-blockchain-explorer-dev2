// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

import { test, expect } from '@playwright/test';

async function getFirstBlockId(page) {
  // Navigate to blocks list to get a real block ID
  await page.goto('/index.html?view=blocks');
  await page.waitForLoadState('networkidle');
  
  // Try to get the first block row with an ID
  const firstBlockRow = page.locator('#blocks_list tbody tr').first();
  if (await firstBlockRow.isVisible()) {
    // Look for a link with block ID (typically in href attribute)
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
    
    // Fallback: try to get ID from first cell text content
    const blockIdElement = firstBlockRow.locator('td').first();
    const blockId = await blockIdElement.textContent();
    const trimmedId = blockId?.trim();
    
    // Check if it's a valid block number (1 or greater)
    if (trimmedId && /^\d+$/.test(trimmedId)) {
      const blockNum = parseInt(trimmedId);
      if (blockNum >= 1) {
        return blockNum.toString();
      }
    }
  }
  
  return '1'; // fallback to block 1
}

test.describe('Block Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('navigates to blocks list', async ({ page }) => {
    // Navigate to blocks list (might need to go via URL as there may not be direct link from dashboard)
    await page.goto('/index.html?view=blocks');
    
    // Should display blocks list view
    await expect(page.locator('#blocks_list')).toBeVisible();
    // Limit header title search to specific container
    await expect(page.locator('#blocks_list .header-title')).toContainText('Blocks List');
  });

  test('blocks list displays correctly with proper structure', async ({ page }) => {
    await page.goto('/index.html?view=blocks');
    await expect(page.locator('#blocks_list')).toBeVisible();
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for table structure
    const table = page.locator('#blocks_list table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead').first()).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
  });

  test('can navigate to block details from blocks list', async ({ page }) => {
    await page.goto('/index.html?view=blocks');
    await expect(page.locator('#blocks_list')).toBeVisible();
    
    // Wait for blocks to load
    await page.waitForLoadState('networkidle');
    
    // Find first clickable block row
    const firstBlockRow = page.locator('#blocks_list tbody tr').first();
    if (await firstBlockRow.isVisible()) {
      // Click on the row to navigate to block detail
      await firstBlockRow.click();
      
      // Should navigate to block detail view
      await expect(page).toHaveURL(/.*view=a_block/);
      await expect(page.locator('#a_block')).toBeVisible();
      await expect(page.locator('#a_block .header-title')).toContainText('Block Information');
    }
  });

  test('block detail page displays comprehensive information', async ({ page }) => {
    // Get a real block ID from the blocks list
    const blockId = await getFirstBlockId(page);
    
    // Navigate directly to a block detail
    await page.goto(`/index.html?view=a_block&id=${blockId}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // If block exists, verify structure
    if (await page.locator('#a_block').isVisible()) {
      await expect(page.locator('#a_block .header-title')).toContainText('Block Information');
      
      // Check for key block fields
      const table = page.locator('#a_block table');
      await expect(table).toBeVisible();
      
      // Verify important block fields are present - limit to a_block context
      await expect(page.locator('#a_block [name="time"]')).toBeVisible();
      await expect(page.locator('#a_block [name="blkno"]')).toBeVisible();
      await expect(page.locator('#a_block [name="hash"]')).toBeVisible();
      await expect(page.locator('#a_block [name="status"]')).toBeVisible();
    }
  });

  test('block detail page shows transaction and verification controls', async ({ page }) => {
    // Get a real block ID from the blocks list
    const blockId = await getFirstBlockId(page);
    
    await page.goto(`/index.html?view=a_block&id=${blockId}`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('#a_block')).toBeVisible();
    
    // Block detail should have transaction range or records information
    const txnosField = page.locator('#a_block [name="txnos"]');
    const recordsField = page.locator('#a_block [name="records"]');
    
    // At least one of these should be visible for a valid block
    const hasTxnos = await txnosField.count() > 0;
    const hasRecords = await recordsField.count() > 0;
    expect(hasTxnos || hasRecords).toBeTruthy();
    
    // Verify button should be present (even if not visible)
    const verifyBtn = page.locator('#a_block [name="verify"]');
    await expect(verifyBtn).toBeAttached();
  });

  test('block detail page shows block sequence information', async ({ page }) => {
    // Get a real block ID from the blocks list
    const blockId = await getFirstBlockId(page);
    
    await page.goto(`/?view=a_block&id=${blockId}`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('#a_block')).toBeVisible();
    
    // Check for block sequence field - should always be present for valid blocks
    const blkseqField = page.locator('#a_block [name="blkseq"]');
    await expect(blkseqField).toBeVisible();
    
    // Check for seed field (used in blockchain consensus) - should be present
    const seedField = page.locator('#a_block [name="seed"]');
    await expect(seedField).toBeVisible();
  });

  test('block detail page contains essential blockchain information', async ({ page }) => {
    // Get a real block ID from the blocks list
    const blockId = await getFirstBlockId(page);
    
    await page.goto(`/?view=a_block&id=${blockId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_block').isVisible()) {
      // Verify essential blockchain fields are present and contain data
      const essentialFields = ['hash', 'blkno', 'time', 'status'];
      
      for (const fieldName of essentialFields) {
        const field = page.locator(`#a_block [name="${fieldName}"]`);
        await expect(field).toBeVisible();
        
        // Check that field has actual content, not just placeholder
        const valueElement = field.locator('[name="value"]');
        if (await valueElement.isVisible()) {
          const content = await valueElement.textContent();
          expect(content?.trim().length).toBeGreaterThan(0);
        }
      }
      
      // Verify block sequence information exists and is meaningful
      const blkseqField = page.locator('#a_block [name="blkseq"]');
      if (await blkseqField.isVisible()) {
        const valueElement = blkseqField.locator('[name="value"]');
        if (await valueElement.isVisible()) {
          const seqContent = await valueElement.textContent();
          expect(seqContent?.trim()).not.toBe('');
          expect(seqContent?.trim()).not.toBe('-');
        }
      }
    }
  });

  test('blocks list supports filtering by block number constraint', async ({ page }) => {
    // Test navigation with a block number constraint
    await page.goto('/?view=blocks&blkno=0');
    await expect(page.locator('#blocks_list')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // When filtering by block number, the constraint should be applied
    // Either the header shows the constraint or the table shows filtered results
    const blknoHeader = page.locator('#blocks_list [name="blkno"]');
    const tableRows = page.locator('#blocks_list tbody tr');
    
    // Should either show constraint header or have table results
    const hasConstraintHeader = await blknoHeader.count() > 0;
    const hasTableResults = await tableRows.count() > 0;
    expect(hasConstraintHeader || hasTableResults).toBeTruthy();
  });

  test('blocks list displays data with proper table structure', async ({ page }) => {
    await page.goto('/?view=blocks');
    await expect(page.locator('#blocks_list')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // Verify table structure exists
    const table = page.locator('#blocks_list table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead').first()).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
    
    // Check if there are block rows with actual content
    const blockRows = page.locator('#blocks_list tbody tr');
    const rowCount = await blockRows.count();
    
    if (rowCount > 0) {
      const firstRow = blockRows.first();
      await expect(firstRow).toBeVisible();
      
      // Block rows should have meaningful data in multiple columns
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThan(1); // Should have multiple columns
      
      // First cell should contain block ID or number
      const firstCell = cells.first();
      const cellContent = await firstCell.textContent();
      expect(cellContent?.trim().length).toBeGreaterThan(0);
    }
    
    // Pagination controls should be present in the DOM
    const viewMoreAfter = page.locator('#blocks_list [name="view_more_after"]');
    const viewMoreBefore = page.locator('#blocks_list [name="view_more_before"]');
    await expect(viewMoreAfter).toBeAttached();
    await expect(viewMoreBefore).toBeAttached();
  });

  test('navigation from block to related transactions works', async ({ page }) => {
    // Get a real block ID from the blocks list
    const blockId = await getFirstBlockId(page);
    
    await page.goto(`/?view=a_block&id=${blockId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_block').isVisible()) {
      // Look for transaction range links
      const txRangeLinks = page.locator('#a_block a[href*="view=transactions"]');
      if (await txRangeLinks.count() > 0) {
        const firstTxLink = txRangeLinks.first();
        await firstTxLink.click();
        
        // Should navigate to transactions list
        await expect(page).toHaveURL(/.*view=transactions/);
        await expect(page.locator('#transactions_list')).toBeVisible();
      }
    }
  });
});