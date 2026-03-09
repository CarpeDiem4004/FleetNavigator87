#!/usr/bin/env node

// Make executable
const fs = require('fs');
fs.chmodSync(__filename, '755');

// Murici SaaS External Links - Startup Script
console.log('🚀 Iniciando Murici SaaS External Links...');

// Check Node.js version
const requiredVersion = '18.0.0';
const currentVersion = process.version;
console.log(`Node.js version: ${currentVersion}`);

if (parseFloat(currentVersion.slice(1)) < parseFloat(requiredVersion)) {
  console.error(`❌ Node.js ${requiredVersion}+ is required. Current: ${currentVersion}`);
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Validate required environment variables
const required = ['DATABASE_URL'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

// Set default values
process.env.JWT_SECRET = process.env.JWT_SECRET || 'murici-saas-dev-secret-' + Date.now();
process.env.PORT = process.env.PORT || '3001';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('✅ Environment validation passed');
console.log(`📊 Port: ${process.env.PORT}`);
console.log(`🔧 Mode: ${process.env.NODE_ENV}`);
console.log(`🔐 JWT: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);

// Start the SaaS server
console.log('🌟 Loading SaaS server...');

try {
  require('./backend/server');
} catch (error) {
  console.error('❌ Failed to start SaaS server:', error.message);
  process.exit(1);
}