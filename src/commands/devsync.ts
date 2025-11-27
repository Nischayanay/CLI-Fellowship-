import { Command, Flags } from '@oclif/core';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import { auth } from '../lib/auth';
import { devsyncApi, DevsyncRequest, DevsyncResponse, ContextItem } from '../lib/apiClient';
import { logger } from '../utils/logger';
import { ProgressTracker } from '../lib/progressTracker';

interface GitStatus {
    branch: string;
    modified_files: string[];
    untracked_files: string[];
}

interface GitCommit {
    hash: string;
    message: string;
    author: string;
}

export default class Devsync extends Command {
    static description = 'Get coding context for your current development task';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --query "how to implement authentication"',
        '<%= config.bin %> <%= command.id %> --files src/lib/auth.ts',
    ];

    static flags = {
        query: Flags.string({
            char: 'q',
            description: 'Specific query for context retrieval',
        }),
        files: Flags.string({
            char: 'f',
            description: 'Comma-separated list of files to include in context',
            multiple: true,
        }),
        commits: Flags.integer({
            char: 'c',
            description: 'Number of recent commits to include',
            default: 5,
        }),
        verbose: Flags.boolean({
            char: 'v',
            description: 'Show detailed output',
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Devsync);

        // Check authentication
        const session = await auth.loadSession();
        if (!session) {
            logger.error('You must be logged in to use devsync.');
            logger.info('Run: pb login');
            process.exit(1);
        }

        const progress = new ProgressTracker();
        
        try {
            progress.start('Analyzing project state...', 4);

            // Step 1: Get project path
            const projectPath = process.cwd();
            progress.update(1, 4, 'Detecting git status...', 'analysis');

            // Step 2: Get git status
            const gitStatus = await this.getGitStatus();
            progress.update(2, 4, 'Fetching recent commits...', 'analysis');

            // Step 3: Get recent commits
            const recentCommits = await this.getRecentCommits(flags.commits);
            progress.update(3, 4, 'Retrieving context from Context Engine...', 'retrieval');

            // Step 4: Build request and call API
            const request: DevsyncRequest = {
                project_path: projectPath,
                git_status: gitStatus,
                recent_commits: recentCommits,
                query: flags.query,
            };

            // Add specific files if provided
            if (flags.files && flags.files.length > 0) {
                request.open_files = flags.files;
            }

            const response = await devsyncApi.getContext(request);
            progress.update(4, 4, 'Formatting results...', 'formatting');

            progress.succeed('Context retrieved successfully!');

            // Display results
            this.displayResults(response, flags.verbose);

        } catch (error: any) {
            progress.fail('Failed to retrieve context');
            
            if (error.code === 'EAUTH') {
                logger.error('Authentication failed. Please run: pb login');
            } else if (error.code === 'ECONN') {
                logger.error('Network error. Please check your connection.');
            } else {
                logger.error(error.message || 'An unexpected error occurred');
            }
            
            if (flags.verbose) {
                logger.debug(`Error details: ${JSON.stringify(error, null, 2)}`);
            }
            
            process.exit(1);
        }
    }

    /**
     * Get current git status
     */
    private async getGitStatus(): Promise<GitStatus | undefined> {
        try {
            // Check if we're in a git repo
            execSync('git rev-parse --git-dir', { stdio: 'pipe' });

            const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
            
            const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
            const lines = statusOutput.split('\n').filter(Boolean);
            
            const modified_files: string[] = [];
            const untracked_files: string[] = [];
            
            for (const line of lines) {
                const status = line.substring(0, 2);
                const file = line.substring(3);
                
                if (status.includes('?')) {
                    untracked_files.push(file);
                } else {
                    modified_files.push(file);
                }
            }

            return { branch, modified_files, untracked_files };
        } catch {
            // Not a git repo or git not available
            return undefined;
        }
    }

    /**
     * Get recent git commits
     */
    private async getRecentCommits(count: number): Promise<GitCommit[] | undefined> {
        try {
            const format = '%H|%s|%an';
            const output = execSync(`git log -${count} --format="${format}"`, { encoding: 'utf-8' });
            const lines = output.split('\n').filter(Boolean);
            
            return lines.map(line => {
                const [hash, message, author] = line.split('|');
                return { hash: hash.substring(0, 7), message, author };
            });
        } catch {
            return undefined;
        }
    }

    /**
     * Display the devsync results
     */
    private displayResults(response: DevsyncResponse, verbose: boolean): void {
        console.log('');

        // Display context items
        if (response.context && response.context.length > 0) {
            console.log(chalk.bold.cyan('📚 Relevant Context:'));
            console.log('');
            
            for (const item of response.context) {
                this.displayContextItem(item, verbose);
            }
        }

        // Display suggestions
        if (response.suggestions && response.suggestions.length > 0) {
            console.log(chalk.bold.yellow('💡 Suggestions:'));
            console.log('');
            
            for (const suggestion of response.suggestions) {
                console.log(`  • ${suggestion}`);
            }
            console.log('');
        }

        // Display relevant docs
        if (response.relevant_docs && response.relevant_docs.length > 0) {
            console.log(chalk.bold.blue('📖 Related Documentation:'));
            console.log('');
            
            for (const doc of response.relevant_docs) {
                console.log(`  ${chalk.bold(doc.title)}`);
                console.log(`  ${chalk.dim(doc.url)}`);
                if (verbose && doc.excerpt) {
                    console.log(`  ${chalk.gray(doc.excerpt.substring(0, 100))}...`);
                }
                console.log('');
            }
        }

        // Display code examples
        if (response.code_examples && response.code_examples.length > 0) {
            console.log(chalk.bold.green('💻 Code Examples:'));
            console.log('');
            
            for (const example of response.code_examples) {
                console.log(`  ${chalk.dim(example.description)}`);
                console.log('');
                this.displayCodeBlock(example.code, example.language);
                console.log('');
            }
        }

        // Summary
        const totalItems = 
            (response.context?.length || 0) + 
            (response.suggestions?.length || 0) + 
            (response.relevant_docs?.length || 0) + 
            (response.code_examples?.length || 0);
        
        if (totalItems === 0) {
            console.log(chalk.yellow('No relevant context found for your current project state.'));
            console.log(chalk.dim('Try linking more integrations with: pb link notion'));
        } else {
            console.log(chalk.dim(`Found ${totalItems} relevant items.`));
        }
    }

    /**
     * Display a single context item
     */
    private displayContextItem(item: ContextItem, verbose: boolean): void {
        const typeIcons: Record<string, string> = {
            code: '📝',
            doc: '📄',
            issue: '🎫',
            design: '🎨',
        };

        const icon = typeIcons[item.type] || '📌';
        const relevance = Math.round(item.relevance_score * 100);
        
        console.log(`  ${icon} ${chalk.bold(item.title)} ${chalk.dim(`(${relevance}% relevant)`)}`);
        console.log(`     ${chalk.dim(`Source: ${item.source}`)}`);
        
        if (verbose) {
            // Show content preview
            const preview = item.content.substring(0, 200).replace(/\n/g, ' ');
            console.log(`     ${chalk.gray(preview)}${item.content.length > 200 ? '...' : ''}`);
        }
        
        console.log('');
    }

    /**
     * Display a code block with syntax highlighting
     */
    private displayCodeBlock(code: string, language: string): void {
        const lines = code.split('\n');
        const maxLineNumWidth = String(lines.length).length;
        
        // Language-specific colors
        const langColors: Record<string, (s: string) => string> = {
            typescript: chalk.blue,
            javascript: chalk.yellow,
            python: chalk.green,
            rust: chalk.red,
            go: chalk.cyan,
        };
        
        const langColor = langColors[language.toLowerCase()] || chalk.white;
        
        console.log(chalk.dim(`  ┌─ ${language}`));
        
        for (let i = 0; i < lines.length; i++) {
            const lineNum = String(i + 1).padStart(maxLineNumWidth, ' ');
            const line = lines[i];
            
            // Basic syntax highlighting
            const highlighted = this.highlightSyntax(line, language);
            console.log(`  ${chalk.dim('│')} ${chalk.dim(lineNum)} ${highlighted}`);
        }
        
        console.log(chalk.dim('  └─'));
    }

    /**
     * Basic syntax highlighting for code
     */
    private highlightSyntax(line: string, language: string): string {
        // Keywords for common languages
        const keywords = [
            'const', 'let', 'var', 'function', 'class', 'interface', 'type',
            'import', 'export', 'from', 'return', 'if', 'else', 'for', 'while',
            'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super',
            'def', 'self', 'fn', 'pub', 'struct', 'impl', 'trait', 'enum',
        ];

        let result = line;

        // Highlight strings
        result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, match => chalk.green(match));

        // Highlight comments
        result = result.replace(/(\/\/.*$|#.*$)/g, match => chalk.gray(match));

        // Highlight keywords
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            result = result.replace(regex, chalk.magenta(keyword));
        }

        // Highlight numbers
        result = result.replace(/\b(\d+)\b/g, chalk.cyan('$1'));

        return result;
    }
}
