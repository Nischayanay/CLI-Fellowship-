import { expect } from 'chai';
import { poll } from '../../dist/utils/polling.js';



describe('polling utility', () => {
    it('should resolve when condition is met', async () => {
        let counter = 0;
        const result = await poll(async () => {
            counter++;
            return counter >= 3;
        }, 100, 5000);

        expect(counter).to.equal(3);
    });

    it('should timeout if condition is never met', async () => {
        try {
            await poll(async () => false, 100, 500);
            expect.fail('Should have thrown timeout error');
        } catch (error: any) {
            expect(error.message).to.equal('Polling timeout exceeded');
        }
    });

    it('should handle errors in polling function', async () => {
        try {
            await poll(async () => {
                throw new Error('Test error');
            }, 100, 1000);
            expect.fail('Should have thrown error');
        } catch (error: any) {
            expect(error.message).to.equal('Test error');
        }
    });
});
