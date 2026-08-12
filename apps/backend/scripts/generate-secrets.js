#!/usr/bin/env node

/**
 * Generate secure random secrets for production environment
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 PRODUCTION SECRETS GENERATOR\n');
console.log('Copy these values to your .env.production file:\n');
console.log('─────────────────────────────────────────────────────\n');

console.log('# JWT Secrets (keep these secret!)');
console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${crypto.randomBytes(64).toString('hex')}`);

console.log('\n# Session Secret');
console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);

console.log('\n# API Keys (if needed)');
console.log(`API_KEY=${crypto.randomBytes(32).toString('hex')}`);

console.log('\n─────────────────────────────────────────────────────');
console.log('\n⚠️  IMPORTANT: Never commit these secrets to git!');
console.log('💾 Save them securely in your .env.production file\n');
