import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { auth } from '../../lib/auth';
import { integrationApi, Integration } from '../../lib/apiClient';
import { logger } from '../../utils/logger';
import { formatDuration } from '../../lib/progressTracker';

interface IntegrationConfig {
    name: string;
    provider: string;
    icon: string;
    description: string;
    setupCommand: string;
}

const AVAILABLE_INTEGRATIONS: IntegrationConfig[] = [
    { 
        name: 'Notion', 
        provider: 'notion', 
        icon: '📝',
        description: 'Sync your Notion workspace documentation',
        setupCommand: 'pb link notion'
    },
    { 
        name: 'Cursor', 
        provider: 'cursor', 
        icon: '💻',
        description: 'Connect your Cursor IDE for code context',
        setupCommand: 'pb link cursor'
    },
    { 
        name: 'Figma', 
        provider: 'figma', 
        icon: '🎨',
        description: 'Import design specifications from Figma',
        setupCommand: 'pb link figma'
    },
    { 
        name: 'ChatGPT', 
        provider: 'chatgpt', 
        icon: '🤖',
        description: 'Import your ChatGPT conversation history',
        setupCommand: 'pb link chatgpt'
    },
];

export default class LinkList extends Command {
    static description = 'List all integration connections and their status';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --verbose',
    ];

    static flags = {
        verbose: Flags.boolean({
            char: 'v',
            description: 'Show detailed integration information',
            default: false,
        }),
        json: Flags.boolean({
            description: 'Output as JSON',
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(LinkList);

        // Check if user is logged in
        const session = await auth.loadSession();
        if (!session) {
            logger.error('You must be logged in to view integrations.');
            logger.info('Run: pb login');
            process.exit(1);
        }

        try {
            logger.info(chalk.blue('📋 Fetching your integrations...'));

            // Fetch integrations from backend
            const integrations = await integrationApi.listIntegrations();

            // JSON output
            if (flags.json) {
                const output = this.buildJsonOutput(integrations);
                console.log(JSON.stringify(output, null, 2));
                return;
            }

            // Display integrations
            this.displayIntegrations(integrations, flags.verbose);

        } catch (error: any) {
            if (error.code === 'ECONN') {
                logger.error('Network error. Please check your connection.');
            } else if (error.response) {
                logger.error(`Failed to fetch integrations: ${error.response.data?.message || error.message}`);
            } else {
                logger.error(`An error occurred: ${error.message}`);
            }
            process.exit(1);
        }
    }

    /**
     * Display integrations with enhanced formatting
     */
    private displayIntegrations(integrations: Integration[], verbose: boolean): void {
        console.log('');
        console.log(chalk.bold('Your Integrations:'));
        console.log('');

        let connectedCount = 0;
        let errorCount = 0;

        for (const config of AVAILABLE_INTEGRATIONS) {
            const integration = integrations.find(i => i.provider === config.provider);
            this.displayIntegration(config, integration, verbose);
            
            if (integration?.connected) connectedCount++;
            if (integration?.sync_status === 'error') errorCount++;
        }

        // Summary
        console.log('');
        console.log(chalk.dim('─'.repeat(50)));
        console.log('');
        
        if (connectedCount === 0) {
            this.displayEmptyState();
        } else {
            console.log(chalk.dim(`${connectedCount} integration(s) connected`));
            if (errorCount > 0) {
                console.log(chalk.yellow(`${errorCount} integration(s) with errors`));
            }
        }

        console.log('');
        console.log(chalk.dim('To link an integration, run: pb link <provider>'));
        console.log(chalk.dim('Example: pb link notion'));
        console.log('');
    }

    /**
     * Display a single integration
     */
    private displayIntegration(config: IntegrationConfig, integration: Integration | undefined, verbose: boolean): void {
        const { icon, name, provider, description, setupCommand } = config;

        // Status indicator
        let statusText: string;
        let statusColor: (s: string) => string;

        if (!integration || !integration.connected) {
            statusText = 'not connected';
            statusColor = chalk.gray;
        } else if (integration.sync_status === 'error') {
            statusText = 'error';
            statusColor = chalk.red;
        } else if (integration.sync_status === 'syncing') {
            statusText = 'syncing...';
            statusColor = chalk.yellow;
        } else {
            statusText = 'connected';
            statusColor = chalk.green;
        }

        // Main line
        console.log(`${icon} ${chalk.bold(name)}: ${statusColor(statusText)}`);

        // Connected details
        if (integration?.connected) {
            // Last sync timestamp
            if (integration.last_sync) {
                const lastSync = new Date(integration.last_sync);
                const timeSince = Date.now() - lastSync.getTime();
                const timeAgo = this.formatTimeAgo(timeSince);
                console.log(chalk.dim(`   Last synced: ${timeAgo}`));
            } else if (integration.connected_at) {
                const connectedAt = new Date(integration.connected_at);
                console.log(chalk.dim(`   Connected: ${connectedAt.toLocaleDateString()}`));
            }

            // Items synced
            if (integration.items_synced !== undefined && integration.items_synced > 0) {
                console.log(chalk.dim(`   Items indexed: ${integration.items_synced.toLocaleString()}`));
            }

            // Error message
            if (integration.sync_status === 'error' && integration.error_message) {
                console.log(chalk.red(`   ⚠ Error: ${integration.error_message}`));
                console.log(chalk.dim(`   Try: ${setupCommand}`));
            }
        } else if (verbose) {
            // Show description for unconnected integrations in verbose mode
            console.log(chalk.dim(`   ${description}`));
            console.log(chalk.dim(`   Setup: ${setupCommand}`));
        }

        console.log('');
    }

    /**
     * Display empty state with setup instructions
     */
    private displayEmptyState(): void {
        console.log(chalk.yellow('No integrations connected yet.'));
        console.log('');
        console.log(chalk.bold('Get started by connecting an integration:'));
        console.log('');
        
        for (const config of AVAILABLE_INTEGRATIONS) {
            console.log(`  ${config.icon} ${chalk.cyan(config.setupCommand)}`);
            console.log(`     ${chalk.dim(config.description)}`);
            console.log('');
        }

        console.log(chalk.dim('Integrations help PromptBrain understand your project context'));
        console.log(chalk.dim('and provide more relevant suggestions.'));
    }

    /**
     * Format time ago string
     */
    private formatTimeAgo(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'just now';
    }

    /**
     * Build JSON output
     */
    private buildJsonOutput(integrations: Integration[]): any {
        return {
            integrations: AVAILABLE_INTEGRATIONS.map(config => {
                const integration = integrations.find(i => i.provider === config.provider);
                return {
                    provider: config.provider,
                    name: config.name,
                    connected: integration?.connected || false,
                    connected_at: integration?.connected_at || null,
                    last_sync: integration?.last_sync || null,
                    sync_status: integration?.sync_status || null,
                    items_synced: integration?.items_synced || 0,
                    error_message: integration?.error_message || null,
                };
            }),
            summary: {
                total: AVAILABLE_INTEGRATIONS.length,
                connected: integrations.filter(i => i.connected).length,
                errors: integrations.filter(i => i.sync_status === 'error').length,
            },
        };
    }
}
