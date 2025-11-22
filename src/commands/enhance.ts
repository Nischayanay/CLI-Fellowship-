import { Command, Args } from '@oclif/core';
import { apiClient } from '../lib/apiClient';
import { logger } from '../utils/logger';
import chalk from 'chalk';

export default class Enhance extends Command {
    static description = 'Enhance a prompt using the Context Engine';

    static args = {
        prompt: Args.string({ description: 'The prompt to enhance', required: true }),
    };

    async run(): Promise<void> {
        const { args } = await this.parse(Enhance);
        const prompt = args.prompt;

        logger.info('Enhancing prompt...');

        try {
            const { data } = await apiClient.post('/general', { prompt });

            logger.success('Prompt Enhanced!');
            logger.log('');
            logger.log(chalk.bold('Original:'));
            logger.dim(prompt);
            logger.log('');
            logger.log(chalk.bold('Enhanced:'));
            logger.log(chalk.green(data.enhanced_prompt || data.result || 'No enhancement returned.')); // Adjust based on actual API response structure

            if (data.context_sources && data.context_sources.length > 0) {
                logger.log('');
                logger.log(chalk.bold('Context Sources Used:'));
                data.context_sources.forEach((source: any) => {
                    logger.log(`  - ${source.name || source.type} (${source.count || 1} snippets)`);
                });
            }

        } catch (error) {
            // Error handled by interceptor
        }
    }
}
