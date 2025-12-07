// Quick script to manually store the API key
const { apiKeyStorage } = require('./dist/lib/apiKeyStorage');

const API_KEY = 'pb_239d7094b81e9f0e21d6023047380c0f9bd4b08f63cee3b6947fae8bcd67dc8aec60eeaf3eab4b7a';
const KEY_ID = 'dc43...'; // Placeholder ID

async function storeKey() {
    try {
        await apiKeyStorage.storeKey(KEY_ID, API_KEY);
        console.log('✓ API key stored successfully!');
        
        // Verify it was stored
        const retrieved = await apiKeyStorage.getActiveKey();
        console.log('✓ Verified - key retrieved:', retrieved ? 'YES' : 'NO');
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

storeKey();
