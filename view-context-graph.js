#!/usr/bin/env node
// Script to view context graph data from the backend

const axios = require('axios');

const API_KEY = 'pb_239d7094b81e9f0e21d6023047380c0f9bd4b08f63cee3b6947fae8bcd67dc8aec60eeaf3eab4b7a';
const BASE_URL = process.env.PB_API_URL || 'http://localhost:3000';

async function viewContextGraph() {
    console.log('🔍 Fetching context graph data...\n');

    try {
        // 1. Get full graph data
        console.log('📊 Full Graph Data:');
        console.log('─'.repeat(60));
        const graph = await axios.get(`${BASE_URL}/api/graph/data`, {
            headers: { 'x-api-key': API_KEY }
        });
        
        const { nodes, edges, clusters, metadata } = graph.data;
        console.log(`Nodes: ${metadata.total_nodes}`);
        console.log(`Edges: ${metadata.total_edges}`);
        console.log(`Clusters: ${metadata.total_clusters}`);
        console.log('');
        
        if (nodes.length > 0) {
            console.log('Sample Nodes:');
            nodes.slice(0, 5).forEach(node => {
                console.log(`  • ${node.label} (${node.type}) - Salience: ${node.salience}`);
            });
            console.log('');
        } else {
            console.log('⚠️  No nodes in graph yet. Link an integration to populate data.\n');
        }

        // 2. Check integrations
        console.log('🔗 Connected Integrations:');
        console.log('─'.repeat(60));
        const integrations = await axios.get(`${BASE_URL}/integrations/list`, {
            headers: { 'x-api-key': API_KEY }
        });
        
        const connected = integrations.data.integrations.filter(i => i.connected);
        if (connected.length > 0) {
            connected.forEach(int => {
                console.log(`  ✓ ${int.provider} - ${int.items_synced || 0} items synced`);
            });
        } else {
            console.log('  ⚠️  No integrations connected yet.');
            console.log('  Run: PB_API_URL=http://localhost:3000 node bin/pb link notion');
        }
        console.log('');

        // 3. Search example
        console.log('🔎 Search Test (query: "authentication"):');
        console.log('─'.repeat(60));
        try {
            const search = await axios.get(`${BASE_URL}/api/graph/search?q=authentication`, {
                headers: { 'x-api-key': API_KEY }
            });
            console.log(`Found ${search.data.results.length} results`);
            if (search.data.results.length > 0) {
                search.data.results.slice(0, 3).forEach(result => {
                    console.log(`  • ${result.label} (score: ${result.score})`);
                });
            }
        } catch (err) {
            console.log(`  ⚠️  Search returned no results`);
        }
        console.log('');

        // 4. Graph statistics
        if (metadata.total_nodes > 0) {
            console.log('📈 Graph Statistics:');
            console.log('─'.repeat(60));
            console.log(`Time Range: ${metadata.time_range}`);
            console.log(`Filters Applied: ${JSON.stringify(metadata.filters_applied)}`);
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

console.log('='.repeat(60));
console.log('PromptBrain Context Graph Viewer');
console.log('='.repeat(60));
console.log('');

viewContextGraph().then(() => {
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 To populate the graph:');
    console.log('   1. Run: PB_API_URL=http://localhost:3000 node bin/pb link notion');
    console.log('   2. Authorize in browser');
    console.log('   3. Wait for sync to complete');
    console.log('   4. Run this script again to see the graph data');
    console.log('');
});
