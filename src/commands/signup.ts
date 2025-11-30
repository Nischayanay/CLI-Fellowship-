import { Command, Flags, ux } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/apiClient';
import colors from '../utils/colors';
import progress from '../utils/progress';
import ui from '../utils/ui';
import * as readline from 'readline';

export default class Signup extends Command {
    static description = 'Create a new PromptBrain account';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --email user@example.com',
    ];

    static flags = {
        email: Flags.string({ char: 'e', description: 'Email address' }),
        password: Flags.string({ char: 'p', description: 'Password' }),
        name: Flags.string({ char: 'n', description: 'Full name (optional)' }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Signup);
        let email = flags.email;
        let password = flags.password;
        let name = flags.name;

        console.log('');
        console.log(colors.heading('🚀 Create Your PromptBrain Account'));
        console.log('');
        console.log(colors.dim('Join thousands of developers using PromptBrain'));
        console.log('');

        // Collect user information
        if (!email) {
            email = await this.promptInput('Email');
        }

        // Trim whitespace
        email = email.trim();

        if (!this.isValidEmail(email)) {
            logger.error('Invalid email address format');
            ui.tip('Example: user@example.com');
            process.exit(1);
        }

        if (!password) {
            password = await this.promptPassword('Password (min 8 characters)');
        }

        // Trim whitespace
        password = password.trim();

        if (password.length < 8) {
            logger.error('Password must be at least 8 characters long');
            ui.tip('Use a strong password with letters, numbers, and symbols');
            process.exit(1);
        }

        if (!name) {
            name = await this.promptInput('Full Name (optional, press Enter to skip)', false);
        }

        // Trim whitespace
        if (name) {
            name = name.trim();
        }

        progress.start('Creating your account...');

        try {
            // Sign up via backend API (backend handles Supabase)
            const response = await apiClient.post('/api/auth/signup', {
                email,
                password,
                full_name: name || undefined,
            });

            const data = response.data;

            // Save session if auto-confirmed
            if (data.access_token) {
                await auth.saveSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_in: data.expires_in,
                    user_id: data.user.id,
                    email: data.user.email,
                });

                progress.succeed('Account created successfully!');
                console.log('');
                ui.goodNews(`Welcome to PromptBrain, ${name || email}! 🎉`);
                console.log('');
                console.log(colors.primary('You are now logged in and ready to go!'));
                console.log('');
                console.log(colors.dim('Try these commands:'));
                console.log(`  ${colors.primary('pb enhance')} "your prompt here"`);
                console.log(`  ${colors.primary('pb init')}     # Initialize your project`);
                console.log(`  ${colors.primary('pb doctor')}   # Check system health`);
                console.log('');
            } else {
                // Email confirmation required
                progress.succeed('Account created!');
                console.log('');
                ui.goodNews('Please check your email to verify your account');
                console.log('');
                console.log(colors.dim('After verification, run:'));
                console.log(`  ${colors.primary('pb login')}`);
                console.log('');
            }

        } catch (error: any) {
            progress.fail('Signup failed');
            console.log('');

            if (error.response) {
                const errorMsg = error.response.data?.error || error.response.data?.message || error.message;
                const status = error.response.status;
                
                if (status === 404) {
                    logger.error('Backend endpoint not found');
                    console.log('');
                    console.log(colors.dim('The signup endpoint is not yet implemented on the backend.'));
                    console.log(colors.dim('Required: POST /auth/signup'));
                    console.log('');
                    ui.tip('See docs/BACKEND_AUTH_API.md for implementation details');
                } else if (status === 409 || errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
                    logger.error('This email is already registered');
                    console.log('');
                    ui.tip(`Already have an account? Run: ${colors.primary('pb login')}`);
                } else if (status === 400 && errorMsg.includes('password')) {
                    logger.error('Password does not meet requirements');
                    ui.tip('Use at least 8 characters with a mix of letters and numbers');
                } else if (status === 400) {
                    logger.error(`Invalid input: ${errorMsg}`);
                } else if (status >= 500) {
                    logger.error('Server error. Please try again later.');
                } else {
                    logger.error(`Signup failed: ${errorMsg}`);
                }
            } else if (error.request) {
                logger.error('Network error. Please check your connection.');
            } else {
                logger.error(`An unexpected error occurred: ${error.message || JSON.stringify(error)}`);
                console.log('');
                console.log(colors.dim('Debug info:'));
                console.log(colors.dim(`Error type: ${error.constructor.name}`));
                if (error.config?.url) {
                    console.log(colors.dim(`URL: ${error.config.url}`));
                }
            }
            
            console.log('');
            process.exit(1);
        }
    }

    private isValidEmail(email: string): boolean {
        // More comprehensive email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    private async promptInput(question: string, required: boolean = true): Promise<string> {
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
