#!/usr/bin/env node

// Direct command execution without oclif.run()
const path = require('path');

// Manually load and execute a command
async function main() {
    try {
        const ListCommand = require('./dist/commands/lib/list.js').default;
        const cmd = new ListCommand([], {});
        await cmd.run();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
