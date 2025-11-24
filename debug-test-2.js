try {
    const testLib = require('@oclif/test/lib/test');
    console.log('Found lib/test:', Object.keys(testLib));
} catch (e) {
    console.log('lib/test not found');
}

try {
    const command = require('@oclif/test/command');
    console.log('Found command:', Object.keys(command));
} catch (e) {
    console.log('command not found');
}
