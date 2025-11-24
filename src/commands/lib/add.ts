import { Command } from '@oclif/core';
import { templateLoader } from '../../lib/templateLoader';
import { logger } from '../../utils/logger';
import chalk from 'chalk';
import * as readline from 'readline';

export default class LibAdd extends Command {
    static description = 'Add a new user template';

    async run(): Promise<void> {
        try {
            logger.info('Creating a new template...');

            const name = await this.promptInput('Name: ');
            const description = await this.promptInput('Description: ');
            const content = await this.promptInput('Template Body: ');

            // Validate
            if (!name || !content) {
                logger.error('Name and content are required.');
                return;
            }

            await templateLoader.addTemplate({
                name,
                description,
                content,
                category: 'custom'
            });

            logger.success(`Template ${chalk.cyan(name)} added successfully!`);
        } catch (error: any) {
            // Handle Ctrl+C or other interruptions gracefully
            if (error.code === 'EEXIT') return;
            logger.error(`Failed to add template: ${error.message}`);
        }
    }

    public async promptInput(question: string): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve) => {
            rl.question(question, (answer: string) => {
                rl.close();
                resolve(answer.trim());
            });
        });
    }
}
