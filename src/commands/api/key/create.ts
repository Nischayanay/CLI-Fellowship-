import { Command } from '@oclif/core';
import chalk from 'chalk';
import { auth } from '../../../lib/auth';
import { apiKeyApi } from '../../../lib/apiClient';
import { apiKeyStorage } from '../../../lib/apiKeyStorage';
import { logger } from '../../../utils/logger';
import { isPBError } from '../../../utils/errors';

export default class ApiKeyCreate extends Command {
    static description = 'Create a new API key for CLI authentication';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];

    async run(): Promise<void> {
        try {
            // Check if user is authenticated
            const session = await auth.loadSession();
            if (!session) {
                logger.error('You must be logged in to create an API key.');
                logger.info('Run: pb login');
                process.exit(1);
            }

            logger.info('Creating API key...');

            // Create API key via backend
            const response = await apiKeyApi.create();

            if (!response.key) {
                logger.error('Failed to create API key: No key returned from server');
                process.exit(1);
            }

            // Store the key securely
            await apiKeyStorage.storeKey(response.id, response.key);

            // Display success message with the full key (only time it's shown)
            console.log('');
            logger.success('API key created successfully!');
            console.log('');
            console.log(chalk.bold('Your API key:'));
            console.log(chalk.cyan(response.key));
            console.log('');
            console.log(chalk.yellow('⚠️  This is the only time you will see the full key.'));
            console.log(chalk.dim('The key has been securely stored for CLI use.'));
            console.log('');
            console.log(chalk.dim('Key ID: ') + response.id);
            console.log(chalk.dim('Created: ') + new Date(response.created_at).toLocaleString());
            console.log('');
            console.log(chalk.dim('The CLI will now use this API key for authentication.'));
            console.log(chalk.dim('To revoke this key, run: pb api key revoke ' + response.id));
            console.log('');

        } catch (error: any) {
            if (isPBError(error)) {
                logger.error(error.message);
                if (error.details.suggestion) {
                    logger.info(error.details.suggestion);
                }
            } else {
                logger.error(`Failed to create API key: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
