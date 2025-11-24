const oclifTest = require('@oclif/test');
console.log('Keys:', Object.keys(oclifTest));
console.log('Type of test:', typeof oclifTest.test);
console.log('Type of default:', typeof oclifTest.default);
if (oclifTest.test) {
    console.log('Keys of test:', Object.keys(oclifTest.test));
}
