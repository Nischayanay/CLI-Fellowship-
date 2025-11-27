import { Command, Args } from '@oclif/core';
import chalk from 'chalk';
import * as readline from 'readline';
import { auth } from '../../../lib/auth';
import { apiKeyApi } from '../../../lib/apiClient';
import { apiKeyStorage } from '../../../lib/apiKeyStorage';
import { logger } from '../../../utils/logger';
import { isPBError } from '../../../utils/errors';

export default class ApiKeyRevoke extends Command {
    static description = 'Revoke an API key';

    static examples = [
        '<%= config.bin %> <%= command.id %> <key-id>',
    ];

    static args = {
        id: Args.string({
            required: true,
            description: 'API key ID to revoke',
        }),
    };

    async run(): Promise<void> {
        const { args } = await this.parse(ApiKeyRevoke);

        try {
            // Check if user is authenticated
            const session = await auth.loadSession();
            if (!session) {
                logger.error('You must be logged in to revoke API keys.');
                logger.info('Run: pb login');
                process.exit(1);
            }

            // Check if this is the currently active key
            const metadata = await apiKeyStorage.getKeyMetadata();
            const isActiveKey = metadata?.id === args.id;

            if (isActiveKey) {
                console.log('');
                logger.warning('You are about to revoke your currently active API key.');
                console.log(chalk.dim('The CLI will fall back to session-based authentication.'));
                console.log('');

                const confirmed = await this.promptConfirm('Are you sure you want to continue? (y/N): ');
                if (!confirmed) {
                    logger.info('Revocation cancelled.');
                    return;
                }
            }

            logger.info(`Revoking API key ${args.id}...`);

            // Revoke the key via backend
            await apiKeyApi.revoke(args.id);

            // Remove from local storage if it's the active key
            if (isActiveKey) {
                await apiKeyStorage.removeActiveKey();
            }

            console.log('');
            logger.success(`API key ${chalk.cyan(args.id)} has been revoked.`);
            console.log('');

            if (isActiveKey) {
                console.log(chalk.dim('The CLI will now use session-based authentication.'));
                console.log(chalk.dim('To create a new API key, run: pb api key create'));
                console.log('');
            }

        } catch (error: any) {
            if (isPBError(error)) {
                logger.error(error.message);
                if (error.details.suggestion) {
                    logger.info(error.details.suggestion);
                }
                
                // If revocation failed, don't remove from local storage
                logger.debug('Revocation failed, keeping local key storage');
            } else {
                logger.error(`Failed to revoke API key: ${error.message}`);
            }
            process.exit(1);
        }
    }

    private async promptConfirm(question: string): Promise<boolean> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve) => {
            rl.question(question, (answer: string) => {
                rl.close();
                const normalized = answer.trim().toLowerCase();
                resolve(normalized === 'y' || normalized === 'yes');
            });
        });
    }
}
