#!/usr/bin/env node

/**
 * Post-install script for PBCLI
 * Runs after npm install to verify installation
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

console.log('');
console.log(`${CYAN}╔════════════════════════════════════════╗${RESET}`);
console.log(`${CYAN}║                                        ║${RESET}`);
console.log(`${CYAN}║     ${GREEN}✓${CYAN} PBCLI Installed Successfully    ║${RESET}`);
console.log(`${CYAN}║                                        ║${RESET}`);
console.log(`${CYAN}╚════════════════════════════════════════╝${RESET}`);
console.log('');
console.log(`${DIM}Official CLI for PromptBrain Context Engine${RESET}`);
console.log('');
console.log(`${GREEN}Get started:${RESET}`);
console.log(`  ${CYAN}pb login${RESET}      ${DIM}# Login to your account${RESET}`);
console.log(`  ${CYAN}pb enhance${RESET}    ${DIM}# Enhance a prompt${RESET}`);
console.log(`  ${CYAN}pb doctor${RESET}     ${DIM}# Check system health${RESET}`);
console.log(`  ${CYAN}pb --help${RESET}     ${DIM}# View all commands${RESET}`);
console.log('');
console.log(`${DIM}Documentation: https://promptbrain.io/docs${RESET}`);
console.log('');

// Verify bin file exists and is executable
const binPath = path.join(__dirname, '..', 'bin', 'pb');
if (fs.existsSync(binPath)) {
  try {
    fs.chmodSync(binPath, '755');
  } catch (error) {
    // Ignore chmod errors on Windows
  }
}
