import { Command, Args } from '@oclif/core';
import { templateLoader } from '../../lib/templateLoader';
import { logger } from '../../utils/logger';
import chalk from 'chalk';

export default class LibRemove extends Command {
    static description = 'Remove a user template';

    static args = {
        name: Args.string({ description: 'Name of the template to remove', required: true }),
    };

    async run(): Promise<void> {
        const { args } = await this.parse(LibRemove);
        const name = args.name;

        try {
            await templateLoader.removeTemplate(name);
            logger.success(`Template ${chalk.cyan(name)} removed successfully.`);
        } catch (error: any) {
            logger.error(error.message);
        }
    }
}
