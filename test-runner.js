const { detectTask } = require('./dist/lib/task-detector');

console.log('🧪 Phase-2 Task Detector Test Checkpoint');
console.log('==========================================');

let passed = 0;
let failed = 0;

function runTest(name, testFn) {
    try {
        testFn();
        console.log('✅', name);
        passed++;
    } catch (error) {
        console.log('❌', name, ':', error.message);
        failed++;
    }
}

// Test 1: File extension detection
runTest('File extension detection', () => {
    const result = detectTask('Review my script.py file');
    if (result.task_type !== 'coding') {
        throw new Error(`Expected 'coding' but got '${result.task_type}'`);
    }
    if (!result.reasoning.includes('extension')) {
        throw new Error(`Expected reasoning to include 'extension'`);
    }
});

// Test 2: Priority coding over creative
runTest('Priority coding over creative', () => {
    const result = detectTask('Write code to create a blog post');
    if (result.task_type !== 'coding') {
        throw new Error(`Expected 'coding' but got '${result.task_type}'`);
    }
});

// Test 3: Priority structured over creative
runTest('Priority structured over creative', () => {
    const result = detectTask('Write a JSON schema for blog posts');
    if (result.task_type !== 'structured') {
        throw new Error(`Expected 'structured' but got '${result.task_type}'`);
    }
});

// Test 4: SQL detection
runTest('SQL query detection', () => {
    const result = detectTask('Optimize this: SELECT * FROM users');
    if (result.task_type !== 'structured') {
        throw new Error(`Expected 'structured' but got '${result.task_type}'`);
    }
    if (!result.reasoning.includes('SQL')) {
        throw new Error(`Expected reasoning to include 'SQL'`);
    }
});

// Test 5: Basic coding detection
runTest('Basic coding detection', () => {
    const result = detectTask('Fix the typescript bug in my React component');
    if (result.task_type !== 'coding') {
        throw new Error(`Expected 'coding' but got '${result.task_type}'`);
    }
    if (result.confidence <= 0.7) {
        throw new Error(`Expected confidence > 0.7 but got ${result.confidence}`);
    }
});

// Test 6: Confidence bounds
runTest('Confidence bounds', () => {
    const result = detectTask('Fix this bug');
    if (result.confidence < 0 || result.confidence > 1) {
        throw new Error(`Confidence ${result.confidence} is out of bounds [0,1]`);
    }
});

// Test 7: Empty string handling
runTest('Empty string handling', () => {
    const result = detectTask('');
    if (result.task_type !== 'general') {
        throw new Error(`Expected 'general' but got '${result.task_type}'`);
    }
    if (result.confidence >= 0.5) {
        throw new Error(`Expected low confidence but got ${result.confidence}`);
    }
});

// Test 8: Deterministic behavior
runTest('Deterministic behavior', () => {
    const prompt = 'Fix the Python error in my script';
    const result1 = detectTask(prompt);
    const result2 = detectTask(prompt);
    
    if (result1.task_type !== result2.task_type) {
        throw new Error('Results are not deterministic');
    }
    if (result1.confidence !== result2.confidence) {
        throw new Error('Confidence is not deterministic');
    }
    if (result1.reasoning !== result2.reasoning) {
        throw new Error('Reasoning is not deterministic');
    }
});

console.log('');
console.log('📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Pass Rate: ${failed === 0 ? '100%' : Math.round((passed / (passed + failed)) * 100) + '%'}`);

if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Task detector is working correctly.');
    console.log('✅ File extension logic fixed');
    console.log('✅ Priority ordering fixed'); 
    console.log('✅ SQL detection fixed');
    console.log('✅ Error handling enhanced');
} else {
    console.log('\n⚠️  Some tests failed. Please review.');
    process.exit(1);
}