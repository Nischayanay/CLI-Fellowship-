import { Command } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';

export default class Logout extends Command {
    static description = 'Logout from PromptBrain';

    async run(): Promise<void> {
        const deleted = await auth.deleteSession();
        if (deleted) {
            logger.success('Logged out');
        } else {
            logger.warning('No active session found.');
        }
    }
}
