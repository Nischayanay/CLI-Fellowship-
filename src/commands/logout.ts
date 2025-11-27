import { Command } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';
import colors from '../utils/colors';
import ui from '../utils/ui';

export default class Logout extends Command {
    static description = 'Logout from PromptBrain';

    async run(): Promise<void> {
        const deleted = await auth.deleteSession();
        
        console.log('');
        if (deleted) {
            console.log(colors.statusSuccess('Logged out successfully'));
            ui.tip('Run "pb login" to log back in.');
        } else {
            console.log(colors.statusWarning('No active session found.'));
            ui.tip('You can log in with "pb login".');
        }
        console.log('');
    }
}
