import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { auth } from '../../../lib/auth';
import { apiKeyApi } from '../../../lib/apiClient';
import { logger } from '../../../utils/logger';
import { maskApiKey } from '../../../utils/formatting';
import { isPBError } from '../../../utils/errors';

export default class ApiKeyList extends Command {
    static description = 'List all API keys';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --json',
    ];

    static flags = {
        json: Flags.boolean({
            description: 'Output as JSON',
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(ApiKeyList);

        try {
            // Check if user is authenticated
            const session = await auth.loadSession();
            if (!session) {
                logger.error('You must be logged in to list API keys.');
                logger.info('Run: pb login');
                process.exit(1);
            }

            // Fetch API keys from backend
            const keys = await apiKeyApi.list();

            // JSON output
            if (flags.json) {
                const output = keys.map(key => ({
                    id: key.id,
                    key_preview: key.key_preview || maskApiKey(key.key || ''),
                    scopes: key.scopes,
                    created_at: key.created_at,
                }));
                console.log(JSON.stringify(output, null, 2));
                return;
            }

            // Display keys
            if (keys.length === 0) {
                console.log('');
                logger.info('No API keys found.');
                console.log('');
                console.log(chalk.dim('Create your first API key:'));
                console.log(chalk.cyan('  pb api key create'));
                console.log('');
                return;
            }

            console.log('');
            console.log(chalk.bold('Your API Keys:'));
            console.log('');

            for (const key of keys) {
                const masked = key.key_preview || maskApiKey(key.key || '');
                const createdDate = new Date(key.created_at).toLocaleDateString();
                const scopes = key.scopes.length > 0 ? key.scopes.join(', ') : 'all';

                console.log(chalk.bold('Key: ') + chalk.cyan(masked));
                console.log(chalk.dim('  ID: ') + key.id);
                console.log(chalk.dim('  Created: ') + createdDate);
                console.log(chalk.dim('  Scopes: ') + scopes);
                console.log('');
            }

            console.log(chalk.dim('To revoke a key, run: pb api key revoke <id>'));
            console.log('');

        } catch (error: any) {
            if (isPBError(error)) {
                logger.error(error.message);
                if (error.details.suggestion) {
                    logger.info(error.details.suggestion);
                }
            } else {
                logger.error(`Failed to list API keys: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
