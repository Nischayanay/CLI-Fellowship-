import { Command, Args } from '@oclif/core';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/apiClient';
import { logger } from '../utils/logger';
import colors from '../utils/colors';

export default class Unlink extends Command {
    static description = 'Unlink an integration from PromptBrain';

    static args = {
        provider: Args.string({
            description: 'Provider to unlink (notion, cursor, figma, chatgpt)',
            required: true,
            options: ['notion', 'cursor', 'figma', 'chatgpt'],
        }),
    };

    static examples = [
        '<%= config.bin %> <%= command.id %> notion',
        '<%= config.bin %> <%= command.id %> cursor',
    ];

    async run(): Promise<void> {
        const { args } = await this.parse(Unlink);
        const provider = args.provider;

        // Check if user is logged in
        const session = await auth.loadSession();
        if (!session) {
            logger.error('You must be logged in to unlink integrations.');
            logger.info('Run: pb login');
            process.exit(1);
        }

        try {
            console.log('');
            console.log(colors.warning(`🔓 Unlinking ${provider}...`));

            // Call backend to unlink
            await apiClient.delete(`/integrations/${provider}/unlink`);

            console.log('');
            logger.success(`✓ ${provider} unlinked successfully!`);
            console.log('');
            console.log(colors.dim(`Your ${provider} data has been disconnected.`));
            console.log(colors.dim(`To reconnect, run: ${colors.primary(`pb link ${provider}`)}`));
            console.log('');

        } catch (error: any) {
            console.log('');
            if (error.response?.status === 404) {
                logger.error(`${provider} is not currently linked.`);
                console.log('');
                console.log(colors.dim(`To see your integrations, run: ${colors.primary('pb link list')}`));
            } else if (error.code === 'ECONN') {
                logger.error('Network error. Please check your connection.');
            } else if (error.response) {
                logger.error(`Failed to unlink ${provider}: ${error.response.data?.message || error.message}`);
            } else {
                logger.error(`An error occurred: ${error.message}`);
            }
            console.log('');
            process.exit(1);
        }
    }
}
