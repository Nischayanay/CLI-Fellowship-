import { Command } from '@oclif/core';
import chalk from 'chalk';
import { auth } from '../../lib/auth';
import { integrationApi } from '../../lib/apiClient';
import { logger } from '../../utils/logger';

export default class LinkList extends Command {
    static description = 'List all integration connections';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];

    async run(): Promise<void> {
        // Check if user is logged in
        const session = await auth.loadSession();
        if (!session) {
            logger.error('You must be logged in to view integrations.');
            logger.info('Run: pb login');
            process.exit(1);
        }

        try {
            logger.info(chalk.blue('📋 Fetching your integrations...'));

            // Fetch integrations
            const integrations = await integrationApi.listIntegrations();

            // Define all available integrations
            const availableIntegrations = [
                { name: 'Notion', provider: 'notion', icon: '📝' },
                { name: 'Cursor', provider: 'cursor', icon: '💻' },
                { name: 'ChatGPT', provider: 'chatgpt', icon: '🤖', comingSoon: true },
            ];

            console.log('\n' + chalk.bold('Your Integrations:') + '\n');

            for (const integration of availableIntegrations) {
                const connected = integrations.find(i => i.provider === integration.provider);

                if (integration.comingSoon) {
                    console.log(`${integration.icon} ${chalk.bold(integration.name)}: ${chalk.dim('coming soon')}`);
                } else if (connected && connected.connected) {
                    const connectedAt = connected.connected_at
                        ? chalk.dim(` (connected ${new Date(connected.connected_at).toLocaleDateString()})`)
                        : '';
                    console.log(`${integration.icon} ${chalk.bold(integration.name)}: ${chalk.green('✓ connected')}${connectedAt}`);
                } else {
                    console.log(`${integration.icon} ${chalk.bold(integration.name)}: ${chalk.yellow('not connected')}`);
                }
            }

            console.log('\n' + chalk.dim('To link an integration, run: pb link <provider>'));
            console.log(chalk.dim('Example: pb link notion') + '\n');

        } catch (error: any) {
            if (error.response) {
                logger.error(`Failed to fetch integrations: ${error.response.data?.message || error.message}`);
            } else {
                logger.error(`An error occurred: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
