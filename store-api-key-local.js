#!/usr/bin/env node

const keytar = require('keytar');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const SERVICE_NAME = 'promptbrain-cli';
const API_KEY_ACCOUNT = 'api-key';
const API_KEY = 'pb_4fa9848683a4cfca0a419de7371eb482003bdcb2b0a69acc6cad098769b7f10d1673c5b1e4c61969';

async function storeApiKey() {
    try {
        // Store in keytar (secure storage)
        await keytar.setPassword(SERVICE_NAME, API_KEY_ACCOUNT, API_KEY);
        console.log('✅ API key stored successfully in secure storage');
        
        // Also create a simple config file for the CLI to find
        const configDir = path.join(os.homedir(), '.promptbrain');
        await fs.ensureDir(configDir);
        
        const configFile = path.join(configDir, 'auth.json');
        await fs.writeJson(configFile, {
            hasApiKey: true,
            lastLogin: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log('✅ Auth config updated');
        console.log('🚀 Ready to test CLI commands!');
        
    } catch (error) {
        console.error('❌ Failed to store API key:', error.message);
    }
}

storeApiKey();