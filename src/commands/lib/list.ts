import { Command } from '@oclif/core';
import { templateLoader } from '../../lib/templateLoader';
import { logger } from '../../utils/logger';
import chalk from 'chalk';

export default class LibList extends Command {
    static description = 'List all available templates';

    async run(): Promise<void> {
        try {
            const templates = await templateLoader.loadTemplates();

            const systemTemplates = templates.filter(t => t.isSystem);
            const userTemplates = templates.filter(t => !t.isSystem);

            logger.log(''); // Spacer

            logger.info(chalk.bold('System Templates'));
            if (systemTemplates.length === 0) {
                logger.dim('No system templates found.');
            } else {
                systemTemplates.forEach(t => {
                    logger.log(`  ${chalk.cyan(t.name)} ${chalk.dim(`(${t.category})`)}`);
                    logger.log(`    ${chalk.gray(t.description)}`);
                    logger.log('');
                });
            }

            logger.info(chalk.bold('Your Templates'));
            if (userTemplates.length === 0) {
                logger.dim('No user templates found. Use "pb lib add" to create one.');
            } else {
                userTemplates.forEach(t => {
                    logger.log(`  ${chalk.cyan(t.name)} ${chalk.dim(`(${t.category})`)}`);
                    logger.log(`    ${chalk.gray(t.description)}`);
                    logger.log('');
                });
            }
        } catch (error: any) {
            logger.error(`Failed to list templates: ${error.message}`);
        }
    }
}
