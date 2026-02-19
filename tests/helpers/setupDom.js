// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// DOM setup helper for tests

const fs = require('fs');
const path = require('path');

/**
 * Load and setup DOM from index.html and configure API from actual module
 */
function setupDom() {
  const htmlPath = path.join(__dirname, '../../src/index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Set up document HTML
  document.documentElement.innerHTML = htmlContent;
  
  // Ensure body exists
  if (!document.body) {
    document.body = document.createElement('body');
  }
  
  return document;
}

/**
 * Clean up DOM after tests
 */
function cleanupDom() {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
}

// DOM setup functions are now called explicitly by tests

module.exports = {
  setupDom,
  cleanupDom
};
