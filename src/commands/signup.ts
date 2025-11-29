import { Command, Flags } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';
import axios from 'axios';
import colors from '../utils/colors';
import progress from '../utils/progress';
import ui from '../utils/ui';

const SUPABASE_URL = 'https://ubgmotiourmwaudgeexx.supabase.co';

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
            email = await this.prompt('Email');
        }

        if (!this.isValidEmail(email)) {
            logger.error('Invalid email address format');
            process.exit(1);
        }

        if (!password) {
            password = await this.prompt('Password (min 8 characters)', true);
        }

        if (password.length < 8) {
            logger.error('Password must be at least 8 characters long');
            ui.tip('Use a strong password with letters, numbers, and symbols');
            process.exit(1);
        }

        if (!name) {
            name = await this.prompt('Full Name (optional, press Enter to skip)');
        }

        progress.start('Creating your account...');

        try {
            // Sign up with Supabase
            const response = await axios.post(`${SUPABASE_URL}/auth/v1/signup`, {
                email,
                password,
                data: {
                    full_name: name || undefined,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_ANON_KEY || ''
                }
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

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const errorMsg = error.response.data?.msg || error.response.data?.error_description || error.message;
                    
                    if (error.response.status === 422 || errorMsg.includes('already registered')) {
                        logger.error('This email is already registered');
                        console.log('');
                        ui.tip(`Already have an account? Run: ${colors.primary('pb login')}`);
                    } else if (errorMsg.includes('password')) {
                        logger.error('Password does not meet requirements');
                        ui.tip('Use at least 8 characters with a mix of letters and numbers');
                    } else {
                        logger.error(`Signup failed: ${errorMsg}`);
                    }
                } else {
                    logger.error('Network error. Please check your connection.');
                }
            } else {
                logger.error(`An unexpected error occurred: ${error.message}`);
            }
            
            console.log('');
            process.exit(1);
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private async prompt(question: string, isPassword = false): Promise<string> {
        return new Promise((resolve) => {
            const stdin = process.stdin;
            const stdout = process.stdout;

            stdout.write(colors.primary(question + ': '));

            if (isPassword) {
                stdin.setRawMode(true);
            }

            stdin.resume();
            stdin.setEncoding('utf8');

            let input = '';
            const onData = (char: string) => {
                char = char.toString();

                if (char === '\n' || char === '\r' || char === '\u0004') {
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener('data', onData);
                    stdout.write('\n');
                    resolve(input);
                } else if (char === '\u0003') {
                    process.exit();
                } else if (char === '\u007f') {
                    if (input.length > 0) {
                        input = input.slice(0, -1);
                        if (isPassword) {
                            stdout.write('\b \b');
                        } else {
                            stdout.write('\b \b');
                        }
                    }
                } else {
                    input += char;
                    if (isPassword) {
                        stdout.write('*');
                    } else {
                        stdout.write(char);
                    }
                }
            };

            stdin.on('data', onData);
        });
    }
}
