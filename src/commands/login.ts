import { Command, Flags, ux } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/apiClient';
import { apiKeyStorage } from '../lib/apiKeyStorage';
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
            const response = await apiClient.post('/api/auth/login', {
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

            // Fetch and store API key for integration endpoints
            try {
                const apiKeyResponse = await apiClient.get('/api/auth/api-key');
                if (apiKeyResponse.data?.key) {
                    await apiKeyStorage.storeKey(apiKeyResponse.data.id, apiKeyResponse.data.key);
                    logger.debug('API key stored successfully');
                }
            } catch (apiKeyError: any) {
                // Non-fatal: user can still use CLI without API key for basic operations
                logger.debug(`Could not fetch API key: ${apiKeyError.message}`);
            }

            progress.succeed(`Logged in as ${data.user.email}`);
            console.log('');
            ui.goodNews('You can now use PBCLI to enhance your prompts!');
            console.log('');

        } catch (error: any) {
            progress.fail('Authentication failed');
            console.log('');

            // Helper function to safely extract error message
            const getErrorMessage = (err: any): string => {
                if (typeof err === 'string') return err;
                if (err?.message && typeof err.message === 'string') return err.message;
                if (err?.error && typeof err.error === 'string') return err.error;
                try {
                    return JSON.stringify(err);
                } catch {
                    return String(err);
                }
            };

            if (error.response) {
                const status = error.response.status;
                const responseData = error.response.data;
                
                // Extract error message properly
                let errorMsg = getErrorMessage(responseData) || getErrorMessage(error);
                
                if (status === 401 || status === 400) {
                    logger.error(`Invalid email or password: ${errorMsg}`);
                    ui.tip('Double-check your credentials and try again');
                    console.log('');
                    ui.tip(`New user? Run: ${colors.primary('pb signup')}`);
                } else if (status === 404) {
                    logger.error('Account not found');
                    ui.tip(`Create an account: ${colors.primary('pb signup')}`);
                } else if (status >= 500) {
                    logger.error(`Server error: ${errorMsg}`);
                } else {
                    logger.error(`Login failed: ${errorMsg}`);
                }
            } else if (error.request) {
                logger.error('Network error. Could not reach the server.');
                console.log(colors.dim(`Check if the server is running at: ${apiClient.defaults.baseURL}`));
                console.log('');
                ui.tip('Make sure the backend server is running');
            } else {
                const errorMsg = getErrorMessage(error);
                logger.error(`An unexpected error occurred: ${errorMsg}`);
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
