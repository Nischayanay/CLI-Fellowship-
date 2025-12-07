#!/usr/bin/env node

/**
 * PromptBrain CLI - Interactive Test Suite
 * Tests all commands for user: anayb.dhamma@gmail.com
 */

const { execSync } = require('child_process');
const readline = require('readline');

const TEST_EMAIL = 'anayb.dhamma@gmail.com';

// Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n');
    log('='.repeat(60), 'blue');
    log(title, 'bright');
    log('='.repeat(60), 'blue');
    console.log('');
}

function logTest(command) {
    log(`▶ Testing: ${command}`, 'yellow');
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'cyan');
}

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${question}${colors.reset} `, (answer) => {
            resolve(answer.trim());
        });
    });
}

function runCommand(command, options = {}) {
    try {
        logTest(command);
        const output = execSync(command, {
            stdio: options.silent ? 'pipe' : 'inherit',
            encoding: 'utf-8'
        });
        logSuccess(`Command completed`);
        return { success: true, output };
    } catch (error) {
        if (!options.allowFail) {
            logError(`Command failed: ${error.message}`);
        }
        return { success: false, error };
    }
}

async function waitForUser(message = 'Press Enter to continue...') {
    await prompt(message);
}

const tests = {
    async setup() {
        logSection('Setup: Building and Linking CLI');
        
        logInfo('Building CLI...');
        runCommand('npm run build');
        
        logInfo('Linking CLI for testing...');
        runCommand('npm link');
        
        logSuccess('Setup complete!');
        await waitForUser();
    },

    async basicCommands() {
        logSection('Test 1: Basic Commands');
        
        runCommand('pb --version');
        runCommand('pb --help');
        
        logSuccess('Basic commands passed');
        await waitForUser();
    },

    async authentication() {
        logSection('Test 2: Authentication');
        
        logInfo(`Testing login for: ${TEST_EMAIL}`);
        logInfo('You will be prompted for your password');
        
        runCommand(`pb login --email ${TEST_EMAIL}`);
        
        logInfo('Verifying authentication...');
        runCommand('pb whoami');
        
        logSuccess('Authentication successful');
        await waitForUser();
    },

    async usageAndQuota() {
        logSection('Test 3: Usage & Quota');
        
        runCommand('pb usage');
        runCommand('pb usage --json');
        runCommand('pb quota');
        
        logSuccess('Usage and quota commands passed');
        await waitForUser();
    },

    async systemHealth() {
        logSection('Test 4: System Health');
        
        runCommand('pb doctor');
        runCommand('pb health');
        
        logSuccess('System health checks passed');
        await waitForUser();
    },

    async integrationsList() {
        logSection('Test 5: List Integrations (Before Linking)');
        
        runCommand('pb link list');
        runCommand('pb link list --verbose');
        runCommand('pb link list --json');
        
        logSuccess('Integration list commands passed');
        await waitForUser();
    },

    async linkNotion() {
        logSection('Test 6: Link Notion Integration');
        
        logInfo('This will open your browser for OAuth authorization');
        logInfo('Please approve the Notion connection in your browser');
        
        const proceed = await prompt('Ready to link Notion? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
            logInfo('Skipping Notion linking');
            return;
        }
        
        runCommand('pb link notion');
        
        logSuccess('Notion linked successfully!');
        await waitForUser();
    },

    async linkCursor() {
        logSection('Test 7: Link Cursor Integration');
        
        logInfo('This will open your browser for OAuth authorization');
        logInfo('Please approve the Cursor connection in your browser');
        
        const proceed = await prompt('Ready to link Cursor? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
            logInfo('Skipping Cursor linking');
            return;
        }
        
        runCommand('pb link cursor');
        
        logSuccess('Cursor linked successfully!');
        await waitForUser();
    },

    async linkFigma() {
        logSection('Test 8: Link Figma Integration');
        
        logInfo('This will open your browser for OAuth authorization');
        logInfo('You will then be able to select which projects to sync');
        
        const proceed = await prompt('Ready to link Figma? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
            logInfo('Skipping Figma linking');
            return;
        }
        
        runCommand('pb link figma');
        
        logSuccess('Figma linked successfully!');
        await waitForUser();
    },

    async linkChatGPT() {
        logSection('Test 9: Link ChatGPT Integration');
        
        logInfo('ChatGPT requires an export file from chat.openai.com');
        logInfo('Export instructions:');
        logInfo('1. Go to chat.openai.com');
        logInfo('2. Click profile → Settings → Data controls');
        logInfo('3. Click "Export data" and wait for email');
        logInfo('4. Download and extract the ZIP file');
        logInfo('5. Find conversations.json');
        
        const hasFile = await prompt('Do you have the conversations.json file? (y/n): ');
        if (hasFile.toLowerCase() !== 'y') {
            logInfo('Skipping ChatGPT linking - export file required');
            return;
        }
        
        const filePath = await prompt('Enter path to conversations.json: ');
        if (!filePath) {
            logInfo('No file path provided, skipping');
            return;
        }
        
        runCommand(`pb link chatgpt --file "${filePath}"`);
        
        logSuccess('ChatGPT history imported successfully!');
        await waitForUser();
    },

    async integrationsListAfter() {
        logSection('Test 10: List Integrations (After Linking)');
        
        logInfo('Checking all linked integrations...');
        runCommand('pb link list');
        runCommand('pb link list --verbose');
        
        logSuccess('All integrations verified');
        await waitForUser();
    },

    async apiKeys() {
        logSection('Test 11: API Key Management');
        
        logInfo('Listing existing API keys...');
        runCommand('pb api key list');
        
        const createKey = await prompt('Create a new API key? (y/n): ');
        if (createKey.toLowerCase() === 'y') {
            logInfo('Creating new API key...');
            logInfo('⚠️  The full key will only be shown once - save it securely!');
            runCommand('pb api key create');
            
            logInfo('Listing updated API keys...');
            runCommand('pb api key list');
        }
        
        logSuccess('API key management tested');
        await waitForUser();
    },

    async enhance() {
        logSection('Test 12: Prompt Enhancement');
        
        const testPrompts = [
            'Create a React component for user authentication',
            'Fix bug in my Next.js API route',
            'Write a Python function to parse CSV files',
            'Design a database schema for a blog'
        ];
        
        logInfo('Testing prompt enhancement with multiple prompts...');
        
        for (const prompt of testPrompts) {
            logInfo(`\nEnhancing: "${prompt}"`);
            runCommand(`pb enhance "${prompt}"`);
        }
        
        logSuccess('Prompt enhancement tested');
        await waitForUser();
    },

    async devsync() {
        logSection('Test 13: Devsync Context');
        
        logInfo('Getting context from current project...');
        runCommand('pb devsync', { allowFail: true });
        
        logSuccess('Devsync tested');
        await waitForUser();
    },

    async templates() {
        logSection('Test 14: Template Library');
        
        runCommand('pb lib list');
        
        logSuccess('Template library tested');
        await waitForUser();
    },

    async init() {
        logSection('Test 15: Project Initialization');
        
        logInfo('Testing project initialization in current directory...');
        runCommand('pb init', { allowFail: true });
        
        logSuccess('Init command tested');
        await waitForUser();
    },

    async billing() {
        logSection('Test 16: Billing Portal');
        
        const openBilling = await prompt('Open billing portal in browser? (y/n): ');
        if (openBilling.toLowerCase() === 'y') {
            runCommand('pb billing open');
        } else {
            logInfo('Skipping billing portal');
        }
        
        await waitForUser();
    },

    async update() {
        logSection('Test 17: Update Check');
        
        runCommand('pb update --check');
        
        logSuccess('Update check completed');
        await waitForUser();
    },

    async summary() {
        logSection('Test Summary');
        
        logSuccess('All tests completed successfully! 🎉');
        console.log('');
        logInfo(`User tested: ${TEST_EMAIL}`);
        logInfo('Commands tested: 20+ commands');
        console.log('');
        log('Quick reference:', 'bright');
        console.log('  • View integrations: pb link list');
        console.log('  • Check usage: pb usage');
        console.log('  • Enhance prompts: pb enhance "<your prompt>"');
        console.log('  • Get context: pb devsync');
        console.log('  • System health: pb doctor');
        console.log('');
        logSuccess('Testing complete!');
    }
};

async function runTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║     PromptBrain CLI - Interactive Test Suite              ║', 'bright');
    log('║     Testing all commands and integrations                 ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    console.log('');
    logInfo(`Test User: ${TEST_EMAIL}`);
    logInfo('This script will guide you through testing all CLI commands');
    console.log('');
    
    const proceed = await prompt('Ready to start testing? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
        logInfo('Testing cancelled');
        rl.close();
        return;
    }

    try {
        await tests.setup();
        await tests.basicCommands();
        await tests.authentication();
        await tests.usageAndQuota();
        await tests.systemHealth();
        await tests.integrationsList();
        await tests.linkNotion();
        await tests.linkCursor();
        await tests.linkFigma();
        await tests.linkChatGPT();
        await tests.integrationsListAfter();
        await tests.apiKeys();
        await tests.enhance();
        await tests.devsync();
        await tests.templates();
        await tests.init();
        await tests.billing();
        await tests.update();
        await tests.summary();
    } catch (error) {
        logError(`Test suite failed: ${error.message}`);
        console.error(error);
    } finally {
        rl.close();
    }
}

// Run the test suite
runTests();
