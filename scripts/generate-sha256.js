#!/usr/bin/env node

/**
 * Generate SHA256 checksum for release tarball
 * Used for Homebrew formula
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const VERSION = process.argv[2] || process.env.npm_package_version;

if (!VERSION) {
  console.error('Error: Version not provided');
  console.error('Usage: node generate-sha256.js <version>');
  process.exit(1);
}

const TARBALL_URL = `https://github.com/promptbrain/cli/archive/refs/tags/v${VERSION}.tar.gz`;

console.log(`Generating SHA256 for version ${VERSION}...`);
console.log(`URL: ${TARBALL_URL}`);

https.get(TARBALL_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Error: HTTP ${response.statusCode}`);
    process.exit(1);
  }

  const hash = crypto.createHash('sha256');
  
  response.on('data', (chunk) => {
    hash.update(chunk);
  });

  response.on('end', () => {
    const sha256 = hash.digest('hex');
    console.log('');
    console.log('SHA256:', sha256);
    console.log('');
    console.log('Update .homebrew/pb.rb with this checksum');
  });

  response.on('error', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}).on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
