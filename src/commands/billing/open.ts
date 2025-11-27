import { Command } from '@oclif/core';
import chalk from 'chalk';
import open from 'open';
import { auth } from '../../lib/auth';
import { billingApi } from '../../lib/apiClient';
import { logger } from '../../utils/logger';
import { isPBError } from '../../utils/errors';

export default class BillingOpen extends Command {
    static description = 'Open the billing portal in your browser';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];

    async run(): Promise<void> {
        try {
            // Check if user is authenticated
            const session = await auth.loadSession();
            if (!session) {
                logger.error('You must be logged in to access the billing portal.');
                logger.info('Run: pb login');
                process.exit(1);
            }

            logger.info('Opening billing portal...');

            // Get portal URL from backend
            const response = await billingApi.getPortalUrl();

            if (!response.url) {
                logger.error('Failed to get billing portal URL');
                process.exit(1);
            }

            // Try to open in browser
            try {
                await open(response.url);
                console.log('');
                logger.success('Billing portal opened in your browser.');
                console.log('');
                console.log(chalk.dim('If the browser did not open, visit:'));
                console.log(chalk.cyan(response.url));
                console.log('');
            } catch (openError: any) {
                // Browser failed to open
                console.log('');
                logger.warning('Could not open browser automatically.');
                console.log('');
                console.log(chalk.dim('Please visit this URL to access the billing portal:'));
                console.log(chalk.cyan(response.url));
                console.log('');
            }

        } catch (error: any) {
            if (isPBError(error)) {
                logger.error(error.message);
                if (error.details.suggestion) {
                    logger.info(error.details.suggestion);
                }
            } else {
                logger.error(`Failed to open billing portal: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
