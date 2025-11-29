import { Command, Flags, ux } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/apiClient';
import colors from '../utils/colors';
import progress from '../utils/progress';
import ui from '../utils/ui';
import * as readline from 'readline';

export default class Login extends Command {
    static description = 'Login to PromptBrain using Email and Password';

    static flags = {
        email: Flags.string({ char: 'e', description: 'Email address' }),
        password: Flags.string({ char: 'p', description: 'Password' }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Login);
        let email = flags.email;
        let password = flags.password;

        console.log('');
        console.log(colors.heading('🔐 Login to PromptBrain'));
        console.log('');

        if (!email) {
            email = await this.promptInput('Email');
        }
        if (!password) {
            password = await this.promptPassword('Password');
        }

        progress.start('Authenticating...');

        try {
            // Login via backend API (backend handles Supabase)
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });

            const data = response.data;

            await auth.saveSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                user_id: data.user.id,
                email: data.user.email,
            });

            progress.succeed(`Logged in as ${data.user.email}`);
            console.log('');
            ui.goodNews('You can now use PBCLI to enhance your prompts!');
            console.log('');

        } catch (error: any) {
            progress.fail('Authentication failed');
            console.log('');

            if (error.response) {
                const status = error.response.status;
                const errorMsg = error.response.data?.error || error.response.data?.message || error.message;
                
                if (status === 401 || status === 400) {
                    logger.error('Invalid email or password');
                    ui.tip('Double-check your credentials and try again');
                    console.log('');
                    ui.tip(`New user? Run: ${colors.primary('pb signup')}`);
                } else if (status === 404) {
                    logger.error('Account not found');
                    ui.tip(`Create an account: ${colors.primary('pb signup')}`);
                } else if (status >= 500) {
                    logger.error('Server error. Please try again later.');
                } else {
                    logger.error(`Login failed: ${errorMsg}`);
                }
            } else if (error.request) {
                logger.error('Network error. Please check your connection.');
            } else {
                logger.error(`An unexpected error occurred: ${error.message}`);
            }
            process.exit(1);
        }
    }

    private async promptInput(question: string): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(colors.primary(question + ': '), (answer) => {
                rl.close();
                resolve(answer || '');
            });
        });
    }

    private async promptPassword(question: string): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            // Disable echo for password
            const stdin = process.stdin as any;
            stdin.setRawMode(true);
            
            process.stdout.write(colors.primary(question + ': '));
            
            let password = '';
            stdin.on('data', function onData(char: Buffer) {
                const c = char.toString('utf8');
                
                switch (c) {
                    case '\n':
                    case '\r':
                    case '\u0004':
                        stdin.setRawMode(false);
                        stdin.removeListener('data', onData);
                        process.stdout.write('\n');
                        rl.close();
                        resolve(password);
                        break;
                    case '\u0003':
                        process.exit();
                        break;
                    case '\u007f': // backspace
                        if (password.length > 0) {
                            password = password.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                        break;
                    default:
                        password += c;
                        process.stdout.write('*');
                        break;
                }
            });
        });
    }
}
