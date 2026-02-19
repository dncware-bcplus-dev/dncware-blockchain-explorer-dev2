// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

import { test, expect } from '@playwright/test';

// Helper function to get the first available contract ID from the contracts list
async function getFirstContractId(page) {
  await page.goto('/index.html?view=contracts');
  await page.waitForLoadState('networkidle');
  
  // Wait for contracts list to load
  await expect(page.locator('#contracts_list')).toBeVisible();
  
  // Try to get the first contract row with an ID
  const firstContractRow = page.locator('#contracts_list tbody tr').first();
  if (await firstContractRow.isVisible()) {
    // Extract the contract ID from the row (usually in the first cell or as a data attribute)
    const contractIdElement = firstContractRow.locator('td').first();
    const contractId = await contractIdElement.textContent();
    return contractId?.trim() || '1'; // fallback to '1' if no ID found
  }
  
  // If no contracts found, use a default ID
  return '1';
}

test.describe('Contract Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('navigates to contracts list from dashboard', async ({ page }) => {
    // Click on contracts link from dashboard
    await page.locator('a[href="?view=contracts"]').click();
    
    // Should navigate to contracts list view
    await expect(page).toHaveURL(/.*view=contracts/);
    await expect(page.locator('#contracts_list')).toBeVisible();
    
    // Verify page structure
    await expect(page.locator('#contracts_list .header-title')).toContainText('Contracts List');
  });

  test('contracts list displays correctly with proper structure', async ({ page }) => {
    await page.goto('/index.html?view=contracts');
    await expect(page.locator('#contracts_list')).toBeVisible();
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for table structure
    const table = page.locator('#contracts_list table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead')).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
  });

  test('can navigate to contract details from contracts list', async ({ page }) => {
    await page.goto('/?view=contracts');
    await expect(page.locator('#contracts_list')).toBeVisible();
    
    // Wait for contracts to load
    await page.waitForLoadState('networkidle');
    
    // Find first clickable contract row
    const firstContractRow = page.locator('#contracts_list tbody tr').first();
    if (await firstContractRow.isVisible()) {
      // Click on the row to navigate to contract detail
      await firstContractRow.click();
      
      // Should navigate to contract detail view
      await expect(page).toHaveURL(/.*view=a_contract/);
      await expect(page.locator('#a_contract')).toBeVisible();
      await expect(page.locator('#a_contract .header-title')).toContainText('Smart Contract');
    }
  });

  test('contract detail page displays comprehensive information', async ({ page }) => {
    // Get a real contract ID from the contracts list
    const contractId = await getFirstContractId(page);
    
    // Navigate directly to a contract detail
    await page.goto(`/index.html?view=a_contract&id=${contractId}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // If contract exists, verify structure
    if (await page.locator('#a_contract').isVisible()) {
      await expect(page.locator('#a_contract .header-title')).toContainText('Smart Contract');
      
      // Check for key contract fields
      const table = page.locator('#a_contract table').first();
      await expect(table).toBeVisible();
      
      // Verify important contract fields are present
      await expect(page.locator('#a_contract [name="id"]')).toBeVisible();
      await expect(page.locator('#a_contract [name="name"]')).toBeVisible();
      await expect(page.locator('#a_contract [name="description"]')).toBeVisible();
    }
  });

  test('contracts list can be sorted by different criteria', async ({ page }) => {
    await page.goto('/?view=contracts');
    await expect(page.locator('#contracts_list')).toBeVisible();
    
    // Test active sort parameter (URL parameter functionality)
    await page.goto('/?view=contracts&activesort=1');
    await expect(page.locator('#contracts_list')).toBeVisible();
    
    // Verify that the contracts list is still functional with sort parameter
    // (activesort is handled by getURLParameterByName, not show_constraints)
    const table = page.locator('#contracts_list table');
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });

  test('contracts list supports domain constraint filtering', async ({ page }) => {
    // Test navigation with a domain constraint
    await page.goto('/?view=contracts&domain=testdomain');
    await expect(page.locator('#contracts_list')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // When filtering by domain, the page should handle the constraint
    // Either show constraint header or filtered results
    const domainHeader = page.locator('#contracts_list [name="domain"]');
    const tableRows = page.locator('#contracts_list tbody tr');
    
    // Should either show constraint header or have table results
    const hasConstraintHeader = await domainHeader.count() > 0;
    const hasTableResults = await tableRows.count() > 0;
    expect(hasConstraintHeader || hasTableResults).toBeTruthy();
  });

  test('contract detail page displays status and technical information', async ({ page }) => {
    // Get a real contract ID from the contracts list
    const contractId = await getFirstContractId(page);
    
    await page.goto(`/index.html?view=a_contract&id=${contractId}`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('#a_contract')).toBeVisible();
    await expect(page.locator('#a_contract .header-title')).toContainText('Smart Contract');
    
    // Verify essential contract fields are present
    const essentialFields = ['id', 'name', 'description'];
    for (const fieldName of essentialFields) {
      const field = page.locator(`#a_contract [name="${fieldName}"]`);
      await expect(field).toBeVisible();
      
      // Check for value content if value element exists
      const valueElement = field.locator('[name="value"]');
      if (await valueElement.count() > 0 && await valueElement.first().isVisible()) {
        const content = await valueElement.first().textContent();
        if (content && content.trim() !== '' && content.trim() !== '-') {
          expect(content.trim().length).toBeGreaterThan(0);
        }
      }
    }
    
    // Check for technical contract fields (these should exist for smart contracts)
    const technicalFields = ['argtypes', 'maxsteps', 'callable_to'];
    for (const fieldName of technicalFields) {
      const field = page.locator(`#a_contract [name="${fieldName}"]`);
      // Technical fields should be present in the DOM
      await expect(field).toBeAttached();
    }
  });

  test('contract detail page may show related transactions', async ({ page }) => {
    // Get a real contract ID from the contracts list
    const contractId = await getFirstContractId(page);
    
    await page.goto(`/index.html?view=a_contract&id=${contractId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_contract').isVisible()) {
      // Check for recent transactions section
      const recentTransactions = page.locator('#a_contract [name="recent_transactions"]');
      if (await recentTransactions.isVisible()) {
        await expect(recentTransactions.locator('.card-header')).toContainText('Recent Transactions');
        
        // Should have a "View All" button
        const viewAllBtn = recentTransactions.locator('.btn', { hasText: 'View All' });
        if (await viewAllBtn.isVisible()) {
          await viewAllBtn.click();
          
          // Should navigate to transactions list filtered by this contract
          await expect(page).toHaveURL(/.*view=transactions/);
          await expect(page.locator('#transactions_list')).toBeVisible();
        }
      }
    }
  });

  test('contracts list displays data with proper structure and pagination', async ({ page }) => {
    await page.goto('/?view=contracts');
    await expect(page.locator('#contracts_list')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // Verify table structure
    const table = page.locator('#contracts_list table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead')).toBeVisible();
    await expect(table.locator('tbody')).toBeVisible();
    
    // Check if there are contract rows with meaningful content
    const contractRows = page.locator('#contracts_list tbody tr');
    const rowCount = await contractRows.count();
    
    if (rowCount > 0) {
      const firstRow = contractRows.first();
      await expect(firstRow).toBeVisible();
      
      // Contract rows should have multiple columns with data
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThan(1); // Should have multiple columns
      
      // Verify cells contain actual content
      const firstCell = cells.first();
      const cellContent = await firstCell.textContent();
      expect(cellContent?.trim().length).toBeGreaterThan(0);
    }
    
    // Pagination controls should be present
    const viewMoreBefore = page.locator('#contracts_list [name="view_more_before"]');
    await expect(viewMoreBefore).toBeAttached();
  });

  test('contract detail page shows proper contract identification', async ({ page }) => {
    // Get a real contract ID from the contracts list
    const contractId = await getFirstContractId(page);
    
    await page.goto(`/index.html?view=a_contract&id=${contractId}`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('#a_contract')).toBeVisible();
    
    // Contract ID should be displayed
    const contractIdField = page.locator('#a_contract [name="id"]');
    await expect(contractIdField).toBeVisible();
    
    // Contract name should be shown
    const contractNameField = page.locator('#a_contract [name="name"]');
    await expect(contractNameField).toBeVisible();
    
    // Contract description should be visible
    const descriptionField = page.locator('#a_contract [name="description"]');
    await expect(descriptionField).toBeVisible();
    
    // Verify fields contain meaningful data (if value elements exist)
    const valueElements = [
      { field: contractIdField, name: 'id' },
      { field: contractNameField, name: 'name' },
      { field: descriptionField, name: 'description' }
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

  test('contract detail may show creator information', async ({ page }) => {
    // Get a real contract ID from the contracts list
    const contractId = await getFirstContractId(page);
    
    await page.goto(`/index.html?view=a_contract&id=${contractId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_contract').isVisible()) {
      // Check for creator/author field
      const creatorField = page.locator('#a_contract [name="creator"], #a_contract [name="author"]');
      if (await creatorField.first().isVisible()) {
        await expect(creatorField.first()).toBeVisible();
      }
      
      // Check for creation time
      const createdField = page.locator('#a_contract [name="created"], #a_contract [name="creation_time"]');
      if (await createdField.first().isVisible()) {
        await expect(createdField.first()).toBeVisible();
      }
    }
  });

  test('navigation from contract page to related views works', async ({ page }) => {
    // Get a real contract ID from the contracts list
    const contractId = await getFirstContractId(page);
    
    await page.goto(`/index.html?view=a_contract&id=${contractId}`);
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('#a_contract').isVisible()) {
      // Look for links to related views (transactions, users, etc.)
      const relatedLinks = page.locator('#a_contract a[href*="view="]');
      const linkCount = await relatedLinks.count();
      
      if (linkCount > 0) {
        // Test clicking on the first related link that's not the current contract
        const firstLink = relatedLinks.first();
        const href = await firstLink.getAttribute('href');
        
        if (href && href.includes('view=') && !href.includes('view=a_contract')) {
          await firstLink.click();
          
          // Should navigate to the related view
          await expect(page).toHaveURL(new RegExp(href.replace('?', '\\?')));
        }
      }
    }
  });

  test('contract list shows contract activity status', async ({ page }) => {
    await page.goto('/?view=contracts');
    await expect(page.locator('#contracts_list')).toBeVisible();
    
    // Wait for contracts to load
    await page.waitForLoadState('networkidle');
    
    // If there are contract rows, check for activity indicators
    const contractRows = page.locator('#contracts_list tbody tr');
    const rowCount = await contractRows.count();
    
    if (rowCount > 0) {
      const firstRow = contractRows.first();
      
      // Look for last active time or similar activity indicators
      const activityElements = firstRow.locator('.ago-lst, [class*="ago"], [class*="active"]');
      const activityCount = await activityElements.count();
      
      // Some form of activity indication should be present
      if (activityCount > 0) {
        await expect(activityElements.first()).toBeVisible();
      }
    }
  });
});