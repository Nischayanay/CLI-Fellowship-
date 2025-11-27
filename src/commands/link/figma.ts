import { Command, Flags } from '@oclif/core';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import { auth } from '../../lib/auth';
import { integrationApi, request } from '../../lib/apiClient';
import { openBrowser } from '../../utils/browser';
import { poll } from '../../utils/polling';
import { logger } from '../../utils/logger';
import { ProgressTracker } from '../../lib/progressTracker';
import * as readline from 'readline';

interface FigmaProject {
    id: string;
    name: string;
    last_modified: string;
}

interface FigmaIngestionResult {
    job_id: string;
    projects_count: number;
    estimated_files: number;
}

export default class LinkFigma extends Command {
    static description = 'Link your Figma workspace to PromptBrain';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --all',
        '<%= config.bin %> <%= command.id %> --projects proj1,proj2',
    ];

    static flags = {
        all: Flags.boolean({
            char: 'a',
            description: 'Sync all accessible Figma projects',
            default: false,
        }),
        projects: Flags.string({
            char: 'p',
            description: 'Comma-separated list of project IDs to sync',
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(LinkFigma);

        // Check if user is logged in
        const session = await auth.loadSession();
        if (!session) {
            logger.error('You must be logged in to link integrations.');
            logger.info('Run: pb login');
            process.exit(1);
        }

        const progress = new ProgressTracker();

        try {
            // Generate unique CLI session ID
            const cliSession = uuidv4();

            logger.info(chalk.blue('🎨 Starting Figma authorization...'));

            // Start the OAuth flow
            const { auth_url } = await integrationApi.startLink('figma', cliSession);

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
                    const figma = integrations.find(i => i.provider === 'figma');

                    if (figma && figma.connected) {
                        isLinked = true;
                        return true;
                    }
                    return false;
                } catch (error) {
                    // Continue polling on errors
                    return false;
                }
            }, 2000, 300000); // Poll every 2 seconds for up to 5 minutes

            if (!isLinked) {
                logger.error('Failed to link Figma. Please try again.');
                process.exit(1);
            }

            logger.success(chalk.green('✓ Figma linked successfully!'));

            // Fetch available projects
            progress.start('Fetching Figma projects...', 0);
            
            const projects = await this.fetchFigmaProjects();
            
            progress.succeed(`Found ${projects.length} Figma projects`);

            if (projects.length === 0) {
                logger.info(chalk.dim('No projects found in your Figma workspace.'));
                return;
            }

            // Determine which projects to sync
            let projectsToSync: FigmaProject[];

            if (flags.all) {
                projectsToSync = projects;
            } else if (flags.projects) {
                const projectIds = flags.projects.split(',').map(id => id.trim());
                projectsToSync = projects.filter(p => projectIds.includes(p.id));
                
                if (projectsToSync.length === 0) {
                    logger.error('None of the specified project IDs were found.');
                    this.displayProjects(projects);
                    process.exit(1);
                }
            } else {
                // Interactive selection
                this.displayProjects(projects);
                projectsToSync = await this.selectProjects(projects);
            }

            if (projectsToSync.length === 0) {
                logger.info('No projects selected for sync.');
                return;
            }

            // Start ingestion
            logger.info('');
            logger.info(chalk.blue(`🔄 Starting ingestion for ${projectsToSync.length} project(s)...`));

            const ingestionResult = await this.startIngestion(projectsToSync);
            
            // Track ingestion progress
            progress.start('Ingesting design data...', ingestionResult.estimated_files);

            await this.trackIngestionProgress(progress, ingestionResult.job_id);

            progress.succeed(chalk.green(`✓ Successfully indexed ${projectsToSync.length} Figma project(s)!`));
            
            logger.info(chalk.dim('Your Figma designs are now available as context in PromptBrain.'));

        } catch (error: any) {
            progress.fail('Figma linking failed');
            
            if (error.message === 'Polling timeout exceeded') {
                logger.error('Authorization timed out. Please try again.');
                logger.info('Make sure to complete the authorization in your browser within 5 minutes.');
            } else if (error.response) {
                logger.error(`Failed to link Figma: ${error.response.data?.message || error.message}`);
            } else {
                logger.error(`An error occurred: ${error.message}`);
            }
            process.exit(1);
        }
    }

    /**
     * Fetch available Figma projects
     */
    private async fetchFigmaProjects(): Promise<FigmaProject[]> {
        try {
            return await request('GET', '/integrations/figma/projects');
        } catch (error) {
            logger.debug(`Failed to fetch Figma projects: ${error}`);
            return [];
        }
    }

    /**
     * Display available projects
     */
    private displayProjects(projects: FigmaProject[]): void {
        console.log('');
        console.log(chalk.bold('Available Figma Projects:'));
        console.log('');
        
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            const lastModified = new Date(project.last_modified).toLocaleDateString();
            console.log(`  ${chalk.cyan(`[${i + 1}]`)} ${chalk.bold(project.name)}`);
            console.log(`      ${chalk.dim(`ID: ${project.id} | Last modified: ${lastModified}`)}`);
        }
        console.log('');
    }

    /**
     * Interactive project selection
     */
    private async selectProjects(projects: FigmaProject[]): Promise<FigmaProject[]> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve) => {
            console.log(chalk.dim('Enter project numbers to sync (comma-separated), or "all" for all projects:'));
            
            rl.question('> ', (answer) => {
                rl.close();
                
                const trimmed = answer.trim().toLowerCase();
                
                if (trimmed === 'all' || trimmed === 'a') {
                    resolve(projects);
                    return;
                }

                if (trimmed === '' || trimmed === 'none' || trimmed === 'n') {
                    resolve([]);
                    return;
                }

                const indices = trimmed.split(',')
                    .map(s => parseInt(s.trim(), 10) - 1)
                    .filter(i => i >= 0 && i < projects.length);

                const selected = indices.map(i => projects[i]);
                resolve(selected);
            });
        });
    }

    /**
     * Start ingestion for selected projects
     */
    private async startIngestion(projects: FigmaProject[]): Promise<FigmaIngestionResult> {
        const projectIds = projects.map(p => p.id);
        
        return await request('POST', '/integrations/figma/ingest', {
            project_ids: projectIds,
        });
    }

    /**
     * Track ingestion progress
     */
    private async trackIngestionProgress(progress: ProgressTracker, jobId: string): Promise<void> {
        await poll(async () => {
            try {
                const status = await integrationApi.getSyncProgress('figma');
                
                if (status.phase === 'complete') {
                    return true;
                }

                progress.update(
                    status.items_processed,
                    status.items_total,
                    status.current_item || 'Processing...',
                    status.phase
                );

                return false;
            } catch (error) {
                // Continue polling on errors
                return false;
            }
        }, 1000, 600000); // Poll every second for up to 10 minutes
    }
}
