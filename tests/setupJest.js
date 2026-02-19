// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

// Mock Date.now for deterministic tests
const mockNow = 1635724800000; // Fixed timestamp: 2021-11-01T12:00:00.000Z
Date.now = jest.fn(() => mockNow);

// Mock Math.random for deterministic tests
Math.random = jest.fn(() => 0.5);

// Setup console error suppression for expected errors in tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Warning:') || args[0].includes('Error:'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Load actual API module from tests/lib
global.api = require('./lib/dncware-blockchain-nodejs-async-api.js');

// Global test utilities
global.testUtils = {
  mockNow,
  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0)),
  triggerPopstate: () => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};