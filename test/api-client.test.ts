import { expect } from 'chai';
import { apiClient, request } from '../src/lib/apiClient';

describe('API Client', () => {
    it('should have correct base URL', () => {
        expect(apiClient.defaults.baseURL).to.equal('http://localhost:3000');
    });

    it('should attach authorization header', async () => {
        // TODO: Mock auth.loadSession and verify interceptor
    });

    it('should retry on network error', async () => {
        // TODO: Mock axios adapter to fail then succeed
    });

    it('should not retry on 4xx errors', async () => {
        // TODO: Mock axios adapter to return 400
    });
});
