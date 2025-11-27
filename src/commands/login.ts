import { Command, Flags, ux } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';
import axios from 'axios';
import colors from '../utils/colors';
import progress from '../utils/progress';
import ui from '../utils/ui';

const SUPABASE_URL = 'https://ubgmotiourmwaudgeexx.supabase.co';

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
            email = await this.prompt('Email');
        }
        if (!password) {
            password = await this.prompt('Password', true);
        }

        progress.start('Authenticating...');

        try {
            const response = await axios.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                email,
                password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_ANON_KEY || ''
                }
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

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    if (error.response.status === 400) {
                        logger.error('Invalid email or password.');
                        ui.tip('Double-check your credentials and try again.');
                    } else {
                        logger.error(`Login failed: ${error.response.data.error_description || error.message}`);
                    }
                } else {
                    logger.error('Network error. Please check your connection.');
                }
            } else {
                logger.error(`An unexpected error occurred: ${error.message}`);
            }
            process.exit(1);
        }
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
