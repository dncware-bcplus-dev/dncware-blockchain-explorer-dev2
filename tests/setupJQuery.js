// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

// Load and setup jQuery
const $ = require('jquery');

// Create a spy wrapper for jQuery to enable testing
const jQuerySpy = jest.fn((selector) => {
  // Call actual jQuery and return its actual result
  return $(selector);
});

// Make jQuery spy available globally
global.$ = jQuerySpy;
global.jQuery = jQuerySpy;

if (typeof window !== 'undefined') {
  window.$ = jQuerySpy;
  window.jQuery = jQuerySpy;
}

// Mocks for util.js dependencies
global.bootstrap = {
  Tooltip: jest.fn(function(element, options) {
    this.element = element;
    this.options = options;
    return this;
  })
};

global.debug = console.error;