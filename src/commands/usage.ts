import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { auth } from '../lib/auth';
import { billingApi } from '../lib/apiClient';
import { logger } from '../utils/logger';
import { formatTimeUntilReset, formatUsagePercentage, formatPlanName } from '../utils/formatting';
import { isPBError } from '../utils/errors';

export default class Usage extends Command {
    static description = 'Check API usage and limits';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --json',
    ];

    static flags = {
        json: Flags.boolean({
            description: 'Output as JSON',
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Usage);

        try {
            // Check if user is authenticated
            const session = await auth.loadSession();
            if (!session) {
                logger.error('You must be logged in to check usage.');
                logger.info('Run: pb login');
                process.exit(1);
            }

            // Fetch usage data
            const usage = await billingApi.getUsage();

            // JSON output
            if (flags.json) {
                console.log(JSON.stringify(usage, null, 2));
                return;
            }

            // Display usage
            console.log('');
            console.log(chalk.bold('API Usage'));
            console.log('');

            // Plan
            console.log(chalk.bold('Plan: ') + formatPlanName(usage.plan));
            console.log('');

            // Usage stats
            if (usage.daily_limit === null) {
                console.log(chalk.bold('Daily Usage: ') + chalk.green(`${usage.daily_usage.toLocaleString()} requests`));
                console.log(chalk.bold('Daily Limit: ') + chalk.green('Unlimited'));
            } else {
                const percentage = formatUsagePercentage(usage.daily_usage, usage.daily_limit);
                console.log(chalk.bold('Daily Usage: ') + `${usage.daily_usage.toLocaleString()} / ${usage.daily_limit.toLocaleString()} requests (${percentage})`);
                
                // Show remaining
                const remaining = usage.daily_limit - usage.daily_usage;
                if (remaining > 0) {
                    console.log(chalk.bold('Remaining: ') + chalk.green(`${remaining.toLocaleString()} requests`));
                } else {
                    console.log(chalk.bold('Remaining: ') + chalk.red('0 requests'));
                }
            }

            // Reset time
            const resetTime = formatTimeUntilReset(usage.reset_at);
            console.log(chalk.bold('Resets in: ') + chalk.cyan(resetTime));
            console.log('');

            // Warnings
            if (usage.past_due) {
                console.log(chalk.red('⚠️  Your account has a past-due balance.'));
                console.log(chalk.dim('Please update your payment method to continue using the service.'));
                console.log(chalk.cyan('Run: pb billing open'));
                console.log('');
            }

            if (usage.daily_limit !== null) {
                const usagePercent = (usage.daily_usage / usage.daily_limit) * 100;
                
                if (usagePercent >= 100) {
                    console.log(chalk.red('⚠️  You have reached your daily quota limit.'));
                    console.log(chalk.dim('Your quota will reset in ' + resetTime + '.'));
                    console.log(chalk.dim('Upgrade your plan for unlimited requests:'));
                    console.log(chalk.cyan('https://promptbrain.io/pricing'));
                    console.log('');
                } else if (usagePercent >= 80) {
                    console.log(chalk.yellow('⚠️  You are approaching your daily quota limit.'));
                    console.log(chalk.dim('Consider upgrading your plan for unlimited requests:'));
                    console.log(chalk.cyan('https://promptbrain.io/pricing'));
                    console.log('');
                }
            }

            // Plan-specific messaging
            if (usage.plan === 'free') {
                console.log(chalk.dim('💡 Upgrade to Pro or Builder for unlimited requests and more features.'));
                console.log(chalk.dim('   Visit: https://promptbrain.io/pricing'));
                console.log('');
            } else if (usage.plan === 'pro' || usage.plan === 'builder') {
                console.log(chalk.dim('✨ Thank you for being a ' + formatPlanName(usage.plan) + ' subscriber!'));
                console.log('');
            }

        } catch (error: any) {
            if (isPBError(error)) {
                logger.error(error.message);
                if (error.details.suggestion) {
                    logger.info(error.details.suggestion);
                }
            } else {
                logger.error(`Failed to fetch usage: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
