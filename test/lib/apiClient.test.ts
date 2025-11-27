import { expect } from 'chai';
import { integrationApi } from '../../src/lib/apiClient';



describe('integrationApi', () => {
    describe('startLink', () => {
        it('should have startLink method', () => {
            expect(integrationApi.startLink).to.be.a('function');
        });
    });

    describe('listIntegrations', () => {
        it('should have listIntegrations method', () => {
            expect(integrationApi.listIntegrations).to.be.a('function');
        });
    });
});
