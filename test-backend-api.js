#!/usr/bin/env node

/**
 * PromptBrain CLI - Backend API Test Script
 * Tests all backend API endpoints for user: anayb.dhamma@gmail.com
 */

const axios = require('axios');
const { auth } = require('./dist/lib/auth');
const colors = require('./dist/utils/colors').default;

const BASE_URL = process.env.PB_API_URL || 'https://promptbrain-context-engine.vercel.app';
const TEST_EMAIL = 'anayb.dhamma@gmail.com';

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
};

function log(message, type = 'info') {
    const prefix = {
        info: colors.primary('ℹ'),
        success: colors.success('✓'),
        error: colors.error('✗'),
        warning: colors.warning('⚠'),
        section: colors.heading('▶')
    }[type] || '';
    
    console.log(`${prefix} ${message}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'section');
    console.log('='.repeat(60) + '\n');
}

async function runTest(name, testFn) {
    try {
        log(`Testing: ${name}`, 'info');
        const result = await testFn();
        log(`${name} - PASSED`, 'success');
        results.passed++;
        results.tests.push({ name, status: 'passed', result });
        return result;
    } catch (error) {
        log(`${name} - FAILED: ${error.message}`, 'error');
        results.failed++;
        results.tests.push({ name, status: 'failed', error: error.message });
        return null;
    }
}

async function skipTest(name, reason) {
    log(`${name} - SKIPPED: ${reason}`, 'warning');
    results.skipped++;
    results.tests.push({ name, status: 'skipped', reason });
}

// Get auth token
async function getAuthToken() {
    const session = await auth.loadSession();
    if (!session) {
        throw new Error('Not logged in. Run: pb login');
    }
    return session.access_token;
}

// API Test Functions
const apiTests = {
    // Health Check
    async testHealth() {
        const response = await axios.get(`${BASE_URL}/health`, {
            timeout: 5000
        });
        
        if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
        }
        
        return response.data;
    },

    // Authentication - Get User Info
    async testGetUserInfo() {
        const token = await getAuthToken();
        const response = await axios.get(`${BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.email) {
            throw new Error('User email not returned');
        }
        
        return response.data;
    },

    // Billing - Get Usage
    async testGetUsage() {
        const token = await getAuthToken();
        const response = await axios.get(`${BASE_URL}/billing/usage`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (typeof response.data.daily_usage !== 'number') {
            throw new Error('Invalid usage data');
        }
        
        return response.data;
    },

    // Billing - Get Portal URL
    async testGetBillingPortal() {
        const token = await getAuthToken();
        const response = await axios.get(`${BASE_URL}/billing/portal`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.url) {
            throw new Error('Portal URL not returned');
        }
        
        return response.data;
    },

    // Integrations - List
    async testListIntegrations() {
        const token = await getAuthToken();
        const response = await axios.get(`${BASE_URL}/integrations/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!Array.isArray(response.data)) {
            throw new Error('Expected array of integrations');
        }
        
        return response.data;
    },

    // Integrations - Start Link (Notion)
    async testStartLinkNotion() {
        const token = await getAuthToken();
        const cliSession = 'test-session-' + Date.now();
        
        const response = await axios.post(`${BASE_URL}/cli/link/start`, {
            provider: 'notion',
            cli_session: cliSession
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.auth_url) {
            throw new Error('Auth URL not returned');
        }
        
        return response.data;
    },

    // Integrations - Start Link (Cursor)
    async testStartLinkCursor() {
        const token = await getAuthToken();
        const cliSession = 'test-session-' + Date.now();
        
        const response = await axios.post(`${BASE_URL}/cli/link/start`, {
            provider: 'cursor',
            cli_session: cliSession
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.auth_url) {
            throw new Error('Auth URL not returned');
        }
        
        return response.data;
    },

    // Integrations - Start Link (Figma)
    async testStartLinkFigma() {
        const token = await getAuthToken();
        const cliSession = 'test-session-' + Date.now();
        
        const response = await axios.post(`${BASE_URL}/cli/link/start`, {
            provider: 'figma',
            cli_session: cliSession
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.auth_url) {
            throw new Error('Auth URL not returned');
        }
        
        return response.data;
    },

    // Integrations - Get Sync Progress (Notion)
    async testGetSyncProgressNotion() {
        const token = await getAuthToken();
        
        try {
            const response = await axios.get(`${BASE_URL}/integrations/notion/progress`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            // 404 is acceptable if no sync in progress
            if (error.response?.status === 404) {
                return { message: 'No sync in progress' };
            }
            throw error;
        }
    },

    // Integrations - Get Figma Projects
    async testGetFigmaProjects() {
        const token = await getAuthToken();
        
        try {
            const response = await axios.get(`${BASE_URL}/integrations/figma/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!Array.isArray(response.data)) {
                throw new Error('Expected array of projects');
            }
            
            return response.data;
        } catch (error) {
            // 404 is acceptable if Figma not linked
            if (error.response?.status === 404) {
                return { message: 'Figma not linked' };
            }
            throw error;
        }
    },

    // API Keys - List
    async testListApiKeys() {
        const token = await getAuthToken();
        const response = await axios.get(`${BASE_URL}/auth/api-key`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!Array.isArray(response.data)) {
            throw new Error('Expected array of API keys');
        }
        
        return response.data;
    },

    // API Keys - Create
    async testCreateApiKey() {
        const token = await getAuthToken();
        const response = await axios.post(`${BASE_URL}/auth/api-key`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.key) {
            throw new Error('API key not returned');
        }
        
        // Store key ID for revocation test
        return response.data;
    },

    // API Keys - Revoke
    async testRevokeApiKey(keyId) {
        const token = await getAuthToken();
        const response = await axios.delete(`${BASE_URL}/auth/api-key/${keyId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        return { success: true };
    },

    // Devsync - Get Context
    async testDevsync() {
        const token = await getAuthToken();
        const response = await axios.post(`${BASE_URL}/devsync`, {
            project_path: process.cwd(),
            query: 'test query'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.context) {
            throw new Error('Context not returned');
        }
        
        return response.data;
    },

    // Enhance - Test prompt enhancement
    async testEnhance() {
        const token = await getAuthToken();
        const response = await axios.post(`${BASE_URL}/enhance`, {
            prompt: 'Create a React component for user authentication'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.enhanced_prompt) {
            throw new Error('Enhanced prompt not returned');
        }
        
        return response.data;
    }
};

// Main test runner
async function runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     PromptBrain CLI - Backend API Test Suite              ║');
    console.log('║     Testing all API endpoints                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    log(`Test User: ${TEST_EMAIL}`, 'info');
    log(`Backend URL: ${BASE_URL}`, 'info');
    console.log('');

    // Check authentication
    try {
        const session = await auth.loadSession();
        if (!session) {
            log('ERROR: Not logged in. Please run: pb login', 'error');
            process.exit(1);
        }
        log(`Authenticated as: ${session.email || TEST_EMAIL}`, 'success');
    } catch (error) {
        log(`Authentication check failed: ${error.message}`, 'error');
        process.exit(1);
    }

    // Run tests
    logSection('Health & System Tests');
    await runTest('Health Check', apiTests.testHealth);

    logSection('Authentication Tests');
    await runTest('Get User Info', apiTests.testGetUserInfo);

    logSection('Billing Tests');
    await runTest('Get Usage', apiTests.testGetUsage);
    await runTest('Get Billing Portal URL', apiTests.testGetBillingPortal);

    logSection('Integration Tests');
    await runTest('List Integrations', apiTests.testListIntegrations);
    await runTest('Start Link - Notion', apiTests.testStartLinkNotion);
    await runTest('Start Link - Cursor', apiTests.testStartLinkCursor);
    await runTest('Start Link - Figma', apiTests.testStartLinkFigma);
    await runTest('Get Sync Progress - Notion', apiTests.testGetSyncProgressNotion);
    await runTest('Get Figma Projects', apiTests.testGetFigmaProjects);

    logSection('API Key Tests');
    await runTest('List API Keys', apiTests.testListApiKeys);
    const apiKeyResult = await runTest('Create API Key', apiTests.testCreateApiKey);
    
    if (apiKeyResult?.id) {
        await runTest('Revoke API Key', () => apiTests.testRevokeApiKey(apiKeyResult.id));
    } else {
        await skipTest('Revoke API Key', 'No API key created');
    }

    logSection('Core Feature Tests');
    await runTest('Devsync - Get Context', apiTests.testDevsync);
    await runTest('Enhance Prompt', apiTests.testEnhance);

    // Print summary
    logSection('Test Summary');
    console.log('');
    log(`Total Tests: ${results.passed + results.failed + results.skipped}`, 'info');
    log(`Passed: ${results.passed}`, 'success');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
    log(`Skipped: ${results.skipped}`, results.skipped > 0 ? 'warning' : 'info');
    console.log('');

    // Print failed tests
    if (results.failed > 0) {
        logSection('Failed Tests');
        results.tests
            .filter(t => t.status === 'failed')
            .forEach(t => {
                log(`${t.name}: ${t.error}`, 'error');
            });
        console.log('');
    }

    // Print success rate
    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'success' : 'warning');
    console.log('');

    if (results.failed === 0) {
        log('All tests passed! 🎉', 'success');
    } else {
        log('Some tests failed. Please review the errors above.', 'error');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('\nTest suite failed:', error);
    process.exit(1);
});
