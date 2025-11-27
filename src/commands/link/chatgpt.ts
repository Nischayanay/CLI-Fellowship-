import { Command, Flags } from '@oclif/core';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { auth } from '../../lib/auth';
import { request, integrationApi } from '../../lib/apiClient';
import { logger } from '../../utils/logger';
import { ProgressTracker } from '../../lib/progressTracker';
import { poll } from '../../utils/polling';
import * as readline from 'readline';

interface ChatGPTConversation {
    id: string;
    title: string;
    create_time: number;
    update_time: number;
    mapping?: Record<string, any>;
}

interface ChatGPTExport {
    conversations?: ChatGPTConversation[];
    // Alternative format
    [key: string]: any;
}

interface ValidationResult {
    valid: boolean;
    conversationCount: number;
    errors: string[];
}

interface IngestionResult {
    job_id: string;
    conversations_queued: number;
}

export default class LinkChatGPT extends Command {
    static description = 'Import ChatGPT conversation history into PromptBrain';

    static examples = [
        '<%= config.bin %> <%= command.id %> --file ~/Downloads/conversations.json',
        '<%= config.bin %> <%= command.id %>',
    ];

    static flags = {
        file: Flags.string({
            char: 'f',
            description: 'Path to ChatGPT export JSON file',
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(LinkChatGPT);

        // Check if user is logged in
        const session = await auth.loadSession();
        if (!session) {
            logger.error('You must be logged in to link integrations.');
            logger.info('Run: pb login');
            process.exit(1);
        }

        const progress = new ProgressTracker();

        try {
            logger.info(chalk.blue('🤖 ChatGPT History Import'));
            console.log('');

            // Get file path
            let filePath = flags.file;
            
            if (!filePath) {
                const promptedPath = await this.promptForFile();
                if (!promptedPath) {
                    logger.error('No file provided. Exiting.');
                    process.exit(1);
                }
                filePath = promptedPath;
            }

            // Resolve and validate path
            const resolvedPath = path.resolve(filePath.replace(/^~/, process.env.HOME || ''));
            
            if (!await fs.pathExists(resolvedPath)) {
                logger.error(`File not found: ${resolvedPath}`);
                this.showExportInstructions();
                process.exit(1);
            }

            // Read and parse file
            progress.start('Reading export file...', 3);
            
            let exportData: ChatGPTExport;
            try {
                const fileContent = await fs.readFile(resolvedPath, 'utf-8');
                exportData = JSON.parse(fileContent);
            } catch (error: any) {
                progress.fail('Failed to read file');
                logger.error(`Invalid JSON file: ${error.message}`);
                process.exit(1);
            }

            progress.update(1, 3, 'Validating data format...', 'validation');

            // Validate data
            const validation = this.validateExportData(exportData);
            
            if (!validation.valid) {
                progress.fail('Validation failed');
                logger.error('Invalid ChatGPT export format:');
                validation.errors.forEach(err => logger.error(`  • ${err}`));
                this.showExportInstructions();
                process.exit(1);
            }

            progress.update(2, 3, 'Preparing for ingestion...', 'preparation');

            logger.info('');
            logger.info(chalk.green(`✓ Found ${validation.conversationCount} conversations`));

            // Confirm with user
            const confirmed = await this.confirmIngestion(validation.conversationCount);
            if (!confirmed) {
                logger.info('Import cancelled.');
                return;
            }

            progress.update(3, 3, 'Starting ingestion...', 'ingestion');
            progress.succeed('Data validated');

            // Start ingestion
            const conversations = this.extractConversations(exportData);
            const ingestionResult = await this.startIngestion(conversations);

            // Track progress
            progress.start('Ingesting conversations...', validation.conversationCount);

            await this.trackIngestionProgress(progress, ingestionResult.job_id);

            progress.succeed(chalk.green(`✓ Successfully imported ${validation.conversationCount} conversations!`));
            
            logger.info('');
            logger.info(chalk.dim('Your ChatGPT history is now searchable in PromptBrain.'));
            logger.info(chalk.dim('Use `pb devsync` to get context from your conversations.'));

        } catch (error: any) {
            progress.fail('ChatGPT import failed');
            
            if (error.code === 'EAUTH') {
                logger.error('Authentication failed. Please run: pb login');
            } else if (error.code === 'ECONN') {
                logger.error('Network error. Please check your connection.');
            } else {
                logger.error(error.message || 'An unexpected error occurred');
            }
            process.exit(1);
        }
    }

    /**
     * Prompt user for file path
     */
    private async promptForFile(): Promise<string | null> {
        console.log(chalk.bold('How to export your ChatGPT history:'));
        console.log(chalk.dim('1. Go to chat.openai.com'));
        console.log(chalk.dim('2. Click your profile → Settings → Data controls'));
        console.log(chalk.dim('3. Click "Export data" and wait for the email'));
        console.log(chalk.dim('4. Download and extract the ZIP file'));
        console.log(chalk.dim('5. Find conversations.json in the extracted folder'));
        console.log('');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve) => {
            rl.question(chalk.cyan('Enter path to conversations.json: '), (answer) => {
                rl.close();
                const trimmed = answer.trim();
                resolve(trimmed || null);
            });
        });
    }

    /**
     * Validate ChatGPT export data
     */
    private validateExportData(data: ChatGPTExport): ValidationResult {
        const errors: string[] = [];
        let conversationCount = 0;

        // Check if it's an array (direct conversations export)
        if (Array.isArray(data)) {
            conversationCount = data.length;
            
            // Validate structure of first few items
            const sample = data.slice(0, 5);
            for (const conv of sample) {
                if (!conv.id && !conv.title) {
                    errors.push('Conversations missing required fields (id or title)');
                    break;
                }
            }
        }
        // Check if it has a conversations property
        else if (data.conversations && Array.isArray(data.conversations)) {
            conversationCount = data.conversations.length;
            
            const sample = data.conversations.slice(0, 5);
            for (const conv of sample) {
                if (!conv.id && !conv.title) {
                    errors.push('Conversations missing required fields (id or title)');
                    break;
                }
            }
        }
        // Unknown format
        else {
            errors.push('Unrecognized export format. Expected array of conversations or object with "conversations" property.');
        }

        if (conversationCount === 0 && errors.length === 0) {
            errors.push('No conversations found in export file');
        }

        return {
            valid: errors.length === 0,
            conversationCount,
            errors,
        };
    }

    /**
     * Extract conversations from export data
     */
    private extractConversations(data: ChatGPTExport): ChatGPTConversation[] {
        if (Array.isArray(data)) {
            return data;
        }
        if (data.conversations && Array.isArray(data.conversations)) {
            return data.conversations;
        }
        return [];
    }

    /**
     * Confirm ingestion with user
     */
    private async confirmIngestion(count: number): Promise<boolean> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve) => {
            rl.question(
                chalk.yellow(`Import ${count} conversations? (y/n): `),
                (answer) => {
                    rl.close();
                    resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
                }
            );
        });
    }

    /**
     * Start ingestion process
     */
    private async startIngestion(conversations: ChatGPTConversation[]): Promise<IngestionResult> {
        // Send conversations to backend for processing
        return await request('POST', '/integrations/chatgpt/ingest', {
            conversations: conversations.map(conv => ({
                id: conv.id,
                title: conv.title,
                created_at: conv.create_time ? new Date(conv.create_time * 1000).toISOString() : undefined,
                updated_at: conv.update_time ? new Date(conv.update_time * 1000).toISOString() : undefined,
                messages: this.extractMessages(conv),
            })),
        });
    }

    /**
     * Extract messages from conversation mapping
     */
    private extractMessages(conv: ChatGPTConversation): Array<{ role: string; content: string }> {
        const messages: Array<{ role: string; content: string }> = [];
        
        if (!conv.mapping) return messages;

        // ChatGPT export uses a mapping structure
        const nodes = Object.values(conv.mapping);
        
        for (const node of nodes) {
            if (node && typeof node === 'object' && 'message' in node) {
                const msg = (node as any).message;
                if (msg && msg.content && msg.content.parts) {
                    const content = msg.content.parts.join('\n');
                    if (content.trim()) {
                        messages.push({
                            role: msg.author?.role || 'unknown',
                            content: content.trim(),
                        });
                    }
                }
            }
        }

        return messages;
    }

    /**
     * Track ingestion progress
     */
    private async trackIngestionProgress(progress: ProgressTracker, jobId: string): Promise<void> {
        await poll(async () => {
            try {
                const status = await integrationApi.getSyncProgress('chatgpt');
                
                if (status.phase === 'complete') {
                    return true;
                }

                progress.update(
                    status.items_processed,
                    status.items_total,
                    status.current_item || 'Processing conversations...',
                    status.phase
                );

                return false;
            } catch (error) {
                // Continue polling on errors
                return false;
            }
        }, 1000, 600000); // Poll every second for up to 10 minutes
    }

    /**
     * Show export instructions
     */
    private showExportInstructions(): void {
        console.log('');
        console.log(chalk.bold('How to export your ChatGPT history:'));
        console.log('');
        console.log('  1. Go to ' + chalk.cyan('https://chat.openai.com'));
        console.log('  2. Click your profile icon in the bottom-left');
        console.log('  3. Select ' + chalk.bold('Settings'));
        console.log('  4. Go to ' + chalk.bold('Data controls'));
        console.log('  5. Click ' + chalk.bold('Export data'));
        console.log('  6. Wait for the email with download link');
        console.log('  7. Download and extract the ZIP file');
        console.log('  8. Use the ' + chalk.cyan('conversations.json') + ' file');
        console.log('');
    }
}
