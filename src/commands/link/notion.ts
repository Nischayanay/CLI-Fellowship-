import { Command } from '@oclif/core';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import { auth } from '../../lib/auth';
import { integrationApi } from '../../lib/apiClient';
import { openBrowser } from '../../utils/browser';
import { poll } from '../../utils/polling';
import { logger } from '../../utils/logger';

export default class LinkNotion extends Command {
    static description = 'Link your Notion workspace to PromptBrain';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];

    async run(): Promise<void> {
        // Check if user is logged in
        const session = await auth.loadSession();
        if (!session) {
            logger.error('You must be logged in to link integrations.');
            logger.info('Run: pb login');
            process.exit(1);
        }

        try {
            // Generate unique CLI session ID
            const cliSession = uuidv4();

            logger.info(chalk.blue('🔗 Starting Notion authorization...'));

            // Start the OAuth flow
            const { auth_url } = await integrationApi.startLink('notion', cliSession);

            logger.info(chalk.yellow('Opening browser for authorization...'));

            // Open browser
            await openBrowser(auth_url);

            logger.info(chalk.cyan('⏳ Waiting for you to approve access...'));
            logger.info(chalk.dim('(This may take a few moments)'));

            // Poll for completion
            let isLinked = false;
            await poll(async () => {
                try {
                    const integrations = await integrationApi.listIntegrations(cliSession);
                    const notion = integrations.find(i => i.provider === 'notion');

                    if (notion && notion.connected) {
                        isLinked = true;
                        return true;
                    }
                    return false;
                } catch (error) {
                    // Continue polling on errors
                    return false;
                }
            }, 2000, 300000); // Poll every 2 seconds for up to 5 minutes

            if (isLinked) {
                logger.success(chalk.green('✓ Notion linked successfully!'));
                logger.info(chalk.dim('Your Notion workspace is now synced with PromptBrain.'));
            } else {
                logger.error('Failed to link Notion. Please try again.');
                process.exit(1);
            }

        } catch (error: any) {
            if (error.message === 'Polling timeout exceeded') {
                logger.error('Authorization timed out. Please try again.');
                logger.info('Make sure to complete the authorization in your browser within 5 minutes.');
            } else if (error.response) {
                logger.error(`Failed to link Notion: ${error.response.data?.message || error.message}`);
            } else {
                logger.error(`An error occurred: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
