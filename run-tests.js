const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find all test files
function findTestFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...findTestFiles(fullPath));
        } else if (item.endsWith('.test.ts')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

const testFiles = findTestFiles('test');
let totalPassed = 0;
let totalFailed = 0;
let allResults = [];

console.log('🧪 Running Phase-2 Test Checkpoint\n');

for (const file of testFiles) {
    try {
        console.log(`📋 Testing: ${file}`);
        const result = execSync(`npx ts-node -e "
            require('${path.resolve(file)}');
        "`, { encoding: 'utf8', stdio: 'pipe' });
        
        console.log('✅ PASSED\n');
        allResults.push({ file, status: 'PASSED' });
        totalPassed++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(error.message);
        console.log('');
        allResults.push({ file, status: 'FAILED', error: error.message });
        totalFailed++;
    }
}

console.log('='.repeat(50));
console.log('📊 PHASE-2 TEST CHECKPOINT RESULTS');
console.log('='.repeat(50));

allResults.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${result.file}`);
});

console.log('');
console.log(`📈 Total Tests: ${totalPassed + totalFailed}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalFailed}`);
console.log(`📊 Pass Rate: ${totalFailed === 0 ? '100%' : Math.round((totalPassed / (totalPassed + totalFailed)) * 100) + '%'}`);

if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Phase-2 checkpoint complete.');
} else {
    console.log('\n⚠️  Some tests failed. Please review and fix.');
    process.exit(1);
}