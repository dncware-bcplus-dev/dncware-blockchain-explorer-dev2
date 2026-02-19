// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#dashboard')).toBeVisible();
  });

  test('search form is present and functional', async ({ page }) => {
    // Verify search form exists in main navbar
    const searchForm = page.locator('#the_navbar form[name="search"]');
    await expect(searchForm).toBeVisible();
    
    // Verify search input and button
    const searchInput = searchForm.locator('input[type="search"]');
    const searchButton = searchForm.locator('button[type="submit"]');
    
    await expect(searchInput).toBeVisible();
    await expect(searchButton).toBeVisible();
    await expect(searchButton.locator('i.bi-search')).toBeVisible();
  });

  test('search redirects to search results page', async ({ page }) => {
    // Enter a search term
    const searchInput = page.locator('#the_navbar form[name="search"] input[type="search"]');
    await searchInput.fill('test');
    
    // Submit search
    await page.locator('#the_navbar form[name="search"] button[type="submit"]').click();
    
    // Should navigate to search results
    await expect(page).toHaveURL(/.*view=search.*id=test/);
    await expect(page.locator('#search_results')).toBeVisible();
  });

  test('empty search does not navigate', async ({ page }) => {
    const currentUrl = page.url();
    
    // Try to submit empty search
    await page.locator('#the_navbar form[name="search"] button[type="submit"]').click();
    
    // Should stay on the same page
    await expect(page).toHaveURL(currentUrl);
  });

  test('search results page displays search term', async ({ page }) => {
    const searchTerm = 'blockchain';
    
    // Perform search
    const searchInput = page.locator('#the_navbar form[name="search"] input[type="search"]');
    await searchInput.fill(searchTerm);
    await page.locator('#the_navbar form[name="search"] button[type="submit"]').click();
    
    // Verify search results page
    await expect(page.locator('#search_results')).toBeVisible();
    await expect(page.locator('#search_results [name="for"] span')).toContainText(searchTerm);
  });

  test('search results display actual results or clear no-results message', async ({ page }) => {
    // First try a search that should return results (like "1")
    const searchInput = page.locator('#the_navbar form[name="search"] input[type="search"]');
    await searchInput.fill('1');
    await page.locator('#the_navbar form[name="search"] button[type="submit"]').click();
    
    await expect(page.locator('#search_results')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // Check if we have actual results in table format
    const resultsTable = page.locator('#search_results table');
    if (await resultsTable.isVisible()) {
      // Verify table has proper structure with results
      await expect(resultsTable.locator('thead')).toBeVisible();
      await expect(resultsTable.locator('tbody')).toBeVisible();
      
      const resultRows = resultsTable.locator('tbody tr');
      const rowCount = await resultRows.count();
      
      if (rowCount > 0) {
        // Verify first result has expected structure (ID, Type, Name columns)
        const firstRow = resultRows.first();
        const cells = firstRow.locator('td');
        await expect(cells).toHaveCount(3);
        
        // Verify cells contain actual content
        for (let i = 0; i < 3; i++) {
          const cellContent = await cells.nth(i).textContent();
          expect(cellContent?.trim().length).toBeGreaterThan(0);
        }
      }
    } else {
      // If no table, should show clear "not found" message
      const notFoundMessage = page.locator('#search_results [name="not_found"]');
      await expect(notFoundMessage).toBeVisible();
      
      const messageText = await notFoundMessage.textContent();
      expect(messageText?.trim().length).toBeGreaterThan(0);
      expect(messageText?.toLowerCase()).toContain('not found');
    }
    
    // Now test with definitely non-existent search term
    await page.goto('/index.html');
    await searchInput.fill('nonexistentitem999999');
    await page.locator('#the_navbar form[name="search"] button[type="submit"]').click();
    
    await expect(page.locator('#search_results')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // This should definitely show "not found" message
    const notFoundForInvalid = page.locator('#search_results [name="not_found"]');
    await expect(notFoundForInvalid).toBeVisible();
  });

  test('search from mini navbar also works', async ({ page }) => {
    // Scroll down to potentially trigger mini navbar
    await page.evaluate(() => window.scrollTo(0, 200));
    
    // Check if mini navbar is visible, if so test its search
    const miniNavbar = page.locator('#mini_navbar');
    if (await miniNavbar.isVisible()) {
      const searchInput = miniNavbar.locator('form[name="search"] input[type="search"]');
      await searchInput.fill('test');
      await miniNavbar.locator('form[name="search"] button[type="submit"]').click();
      
      await expect(page).toHaveURL(/.*view=search.*id=test/);
      await expect(page.locator('#search_results')).toBeVisible();
    }
  });

  test('search results contain proper structure when results exist', async ({ page }) => {
    // Try a search term that might return results
    const searchTerm = '1'; // Simple search that might match block numbers, transaction IDs, etc.
    
    const searchInput = page.locator('#the_navbar form[name="search"] input[type="search"]');
    await searchInput.fill(searchTerm);
    await page.locator('#the_navbar form[name="search"] button[type="submit"]').click();
    
    await expect(page.locator('#search_results')).toBeVisible();
    await page.waitForLoadState('networkidle');
    
    // Check if results table is visible
    const resultsTable = page.locator('#search_results table');
    if (await resultsTable.isVisible()) {
      // Verify table structure
      await expect(resultsTable.locator('thead')).toBeVisible();
      await expect(resultsTable.locator('tbody')).toBeVisible();
      
      // If there are result rows, verify they have the expected columns
      const resultRows = resultsTable.locator('tbody tr');
      const rowCount = await resultRows.count();
      
      if (rowCount > 0) {
        const firstRow = resultRows.first();
        // Each row should have 3 columns: ID, Type, Name
        await expect(firstRow.locator('td')).toHaveCount(3);
      }
    }
  });

  test('direct navigation to specific item works', async ({ page }) => {
    // Test that single search results redirect directly to the item
    // This tests the search logic that redirects when only one result is found
    
    // Try searching for what might be a specific block number
    const searchInput = page.locator('#the_navbar form[name="search"] input[type="search"]');
    await searchInput.fill('0'); // Block 0 should exist in most blockchain systems
    await page.locator('#the_navbar form[name="search"] button[type="submit"]').click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Could either go to search results or directly to a specific item
    const url = page.url();
    const isSearchResults = url.includes('view=search');
    const isDirectItem = url.includes('view=a_');
    
    expect(isSearchResults || isDirectItem).toBeTruthy();
  });
});