import { Command } from '@oclif/core';
import { apiClient } from '../lib/apiClient';
import { auth } from '../lib/auth';
import { logger } from '../utils/logger';
import chalk from 'chalk';
// import ora from 'ora';

export default class Health extends Command {
    static description = 'Check the health of the CLI and connection to PromptBrain';

    static examples = [
        '<%= config.bin %> health',
    ];

    public async run(): Promise<void> {
        // const spinner = ora('Checking system health...').start();
        logger.log('Checking system health...');
        const results: Record<string, boolean | string> = {};

        try {
            // 1. Check Network/API Reachability
            // spinner.text = 'Checking API connection...';
            logger.log('Checking API connection...');
            try {
                await apiClient.get('/health');
                results.api = true;
            } catch (error) {
                results.api = 'Unreachable';
            }

            // 2. Check Auth Status
            // spinner.text = 'Checking authentication...';
            logger.log('Checking authentication...');
            const session = await auth.loadSession();
            if (session) {
                try {
                    await apiClient.get('/whoami');
                    results.auth = 'Valid';
                } catch (error: any) {
                    if (error.response?.status === 401) {
                        results.auth = 'Expired';
                    } else {
                        results.auth = 'Error';
                    }
                }
            } else {
                results.auth = 'Not Logged In';
            }

            // 3. Check Quota (if logged in)
            if (results.auth === 'Valid') {
                // spinner.text = 'Checking quota...';
                logger.log('Checking quota...');
                try {
                    const quotaRes = await apiClient.get('/quota');
                    results.quota = `${quotaRes.data.remaining}/${quotaRes.data.limit}`;
                } catch {
                    results.quota = 'Unknown';
                }
            } else {
                results.quota = 'N/A';
            }

            // spinner.stop();

            // Render Report
            logger.log('');
            logger.log(chalk.bold('🩺 System Health Report'));
            logger.log(chalk.gray('------------------------'));

            // API Status
            const apiStatus = results.api === true
                ? chalk.green('✔ Online')
                : chalk.red(`✖ ${results.api}`);
            logger.log(`API Status:    ${apiStatus}`);

            // Auth Status
            let authStatus = chalk.gray('? Unknown');
            if (results.auth === 'Valid') authStatus = chalk.green('✔ Authenticated');
            else if (results.auth === 'Not Logged In') authStatus = chalk.yellow('⚠ Not Logged In');
            else if (results.auth === 'Expired') authStatus = chalk.red('✖ Session Expired');
            else authStatus = chalk.red('✖ Error');
            logger.log(`Auth Status:   ${authStatus}`);

            // Quota Status
            const quotaStatus = results.quota === 'N/A'
                ? chalk.gray('N/A')
                : chalk.blue(results.quota);
            logger.log(`Quota:         ${quotaStatus}`);

            logger.log('');

        } catch (error) {
            // spinner.fail('Health check failed unexpectedly');
            logger.error('Health check failed unexpectedly');
            logger.error(String(error));
        }
    }
}
