#!/usr/bin/env node

// Test if we can load Config
async function main() {
    try {
        console.log('Loading @oclif/core...');
        const { Config } = require('@oclif/core');
        console.log('Config loaded');

        console.log('Creating config...');
        const config = await Config.load();
        console.log('Config created:', !!config);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
