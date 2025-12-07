#!/bin/bash

# PromptBrain CLI - Comprehensive Command Testing Script
# Testing all commands for user: anayb.dhamma@gmail.com
# Date: $(date)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test user credentials
TEST_EMAIL="anayb.dhamma@gmail.com"

# Logging functions
log_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

log_test() {
    echo -e "${YELLOW}▶ Testing: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Build the CLI first
log_section "Building PromptBrain CLI"
npm run build
log_success "Build completed"

# Link the CLI for testing
log_section "Linking CLI for Testing"
npm link
log_success "CLI linked successfully"

# Test 1: Version Check
log_section "TEST 1: Version & Help Commands"
log_test "pb --version"
pb --version
log_success "Version check passed"

log_test "pb --help"
pb --help
log_success "Help command passed"

# Test 2: Doctor Command (Pre-login)
log_section "TEST 2: Doctor Command (Pre-login)"
log_test "pb doctor"
pb doctor || true
log_info "Doctor command executed (may show not logged in)"

# Test 3: Login
log_section "TEST 3: Authentication - Login"
log_info "Please login with credentials for: $TEST_EMAIL"
log_test "pb login --email $TEST_EMAIL"
pb login --email "$TEST_EMAIL"
log_success "Login successful"

# Test 4: Whoami
log_section "TEST 4: User Information"
log_test "pb whoami"
pb whoami
log_success "Whoami command passed"

# Test 5: Usage & Quota
log_section "TEST 5: Usage & Quota Commands"
log_test "pb usage"
pb usage
log_success "Usage command passed"

log_test "pb usage --json"
pb usage --json
log_success "Usage JSON output passed"

log_test "pb quota"
pb quota
log_success "Quota command passed"

# Test 6: Doctor Command (Post-login)
log_section "TEST 6: Doctor Command (Post-login)"
log_test "pb doctor"
pb doctor
log_success "Doctor command passed"

# Test 7: Health Check
log_section "TEST 7: Health Check"
log_test "pb health"
pb health
log_success "Health check passed"

# Test 8: Link List (Before linking)
log_section "TEST 8: Integration Status (Before Linking)"
log_test "pb link list"
pb link list
log_success "Link list command passed"

log_test "pb link list --verbose"
pb link list --verbose
log_success "Link list verbose passed"

log_test "pb link list --json"
pb link list --json
log_success "Link list JSON output passed"

# Test 9: Link Notion
log_section "TEST 9: Link Notion Integration"
log_info "This will open your browser for OAuth authorization"
log_info "Please approve the Notion connection in your browser"
log_test "pb link notion"
pb link notion
log_success "Notion linked successfully"

# Test 10: Link Cursor
log_section "TEST 10: Link Cursor Integration"
log_info "This will open your browser for OAuth authorization"
log_info "Please approve the Cursor connection in your browser"
log_test "pb link cursor"
pb link cursor
log_success "Cursor linked successfully"

# Test 11: Link Figma
log_section "TEST 11: Link Figma Integration"
log_info "This will open your browser for OAuth authorization"
log_info "Please approve the Figma connection in your browser"
log_test "pb link figma"
pb link figma
log_success "Figma linked successfully"

# Test 12: Link ChatGPT (requires export file)
log_section "TEST 12: Link ChatGPT Integration"
log_info "ChatGPT requires an export file"
log_info "Skipping automated test - requires manual file input"
log_info "To test manually, run: pb link chatgpt --file /path/to/conversations.json"

# Test 13: Link List (After linking)
log_section "TEST 13: Integration Status (After Linking)"
log_test "pb link list"
pb link list
log_success "All integrations listed"

log_test "pb link list --verbose"
pb link list --verbose
log_success "Verbose integration list passed"

# Test 14: API Key Management
log_section "TEST 14: API Key Management"
log_test "pb api key list"
pb api key list
log_success "API key list passed"

log_info "Creating a new API key..."
log_test "pb api key create"
pb api key create
log_success "API key created"

log_test "pb api key list (after creation)"
pb api key list
log_success "API key list updated"

# Test 15: Config Commands
log_section "TEST 15: Configuration"
log_test "pb config"
pb config || true
log_info "Config command executed"

# Test 16: Library/Template Commands
log_section "TEST 16: Template Library"
log_test "pb lib list"
pb lib list
log_success "Template list passed"

# Test 17: Init Command
log_section "TEST 17: Project Initialization"
log_info "Testing in current directory"
log_test "pb init"
pb init || true
log_info "Init command executed"

# Test 18: Enhance Command
log_section "TEST 18: Prompt Enhancement"
log_test "pb enhance 'Create a React component for user authentication'"
pb enhance "Create a React component for user authentication"
log_success "Enhance command passed"

log_test "pb enhance 'Fix bug in my Next.js API route'"
pb enhance "Fix bug in my Next.js API route"
log_success "Second enhance test passed"

# Test 19: Devsync Command
log_section "TEST 19: Devsync Context"
log_test "pb devsync"
pb devsync || true
log_info "Devsync command executed"

# Test 20: Update Check
log_section "TEST 20: Update Check"
log_test "pb update --check"
pb update --check
log_success "Update check passed"

# Test 21: Billing Portal
log_section "TEST 21: Billing Portal"
log_info "This will open your browser to the billing portal"
log_test "pb billing open"
pb billing open || true
log_info "Billing portal command executed"

# Final Summary
log_section "TEST SUMMARY"
log_success "All automated tests completed successfully!"
echo ""
log_info "User tested: $TEST_EMAIL"
log_info "Integrations linked: Notion, Cursor, Figma"
log_info "Commands tested: 20+ commands"
echo ""
log_info "To view your integrations: pb link list"
log_info "To check usage: pb usage"
log_info "To enhance prompts: pb enhance '<your prompt>'"
echo ""
log_success "Testing complete! 🎉"
