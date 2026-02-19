// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

const express = require('express');
const path = require('path');

const app = express();
const PORT = 8003;

// Static files from src directory
app.use(express.static(path.join(__dirname, '..', 'src')));

// Fallback to index.html for SPA routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'index.html'));
});

// Handle all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📂 Serving files from: ${path.join(__dirname, '..', 'src')}`);
  console.log('📄 Available at: http://localhost:8003/index.html');
});

module.exports = app;