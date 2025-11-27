import { Command, Flags } from '@oclif/core';
import { auth } from '../lib/auth';
import { billingApi } from '../lib/apiClient';
import { logger } from '../utils/logger';
import { formatTimeUntilReset, formatPlanName } from '../utils/formatting';
import { isPBError } from '../utils/errors';
import colors from '../utils/colors';
import ui from '../utils/ui';
import jsonOutput from '../utils/json-output';

export default class Quota extends Command {
    static description = 'Check quota limits for your plan';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
    ];

    static flags = {
        json: Flags.boolean({
            description: 'Output results in JSON format',
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Quota);

        try {
            // Check if user is authenticated
            const session = await auth.loadSession();
            if (!session) {
                if (flags.json) {
                    jsonOutput.error('NOT_AUTHENTICATED', 'You must be logged in to check quota.', {
                        suggestion: 'Run: pb login',
                    });
                } else {
                    logger.error('You must be logged in to check quota.');
                    ui.tip('Run: pb login');
                }
                process.exit(1);
            }

            // Fetch usage data (includes quota info)
            const usage = await billingApi.getUsage();

            if (flags.json) {
                // JSON output mode
                const remaining = usage.daily_limit ? Math.max(0, usage.daily_limit - usage.daily_usage) : null;
                const usagePercent = usage.daily_limit ? (usage.daily_usage / usage.daily_limit) * 100 : 0;

                jsonOutput.success({
                    plan: usage.plan,
                    daily_limit: usage.daily_limit,
                    daily_usage: usage.daily_usage,
                    remaining,
                    usage_percent: Math.round(usagePercent),
                    reset_at: usage.reset_at,
                    unlimited: usage.daily_limit === null,
                });
            } else {
                // Display quota with new UI
                console.log('');
                ui.section('Quota Information');

                // Plan
                ui.keyValue('Current Plan', formatPlanName(usage.plan));
                console.log('');

                // Quota limits
                if (usage.daily_limit === null) {
                    ui.keyValue('Daily Limit', colors.success('Unlimited requests'));
                    console.log('');
                    console.log(colors.dim('You have unlimited API requests with your current plan.'));
                } else {
                    ui.keyValue('Daily Limit', colors.primary(`${usage.daily_limit.toLocaleString()} requests per day`));
                    
                    const resetTime = formatTimeUntilReset(usage.reset_at);
                    ui.keyValue('Next Reset', colors.primary(resetTime));
                    console.log('');

                    // Current usage
                    const remaining = Math.max(0, usage.daily_limit - usage.daily_usage);
                    const usagePercent = (usage.daily_usage / usage.daily_limit) * 100;
                    
                    if (usagePercent >= 100) {
                        console.log(colors.statusError('You have reached your daily quota.'));
                        console.log(colors.dim(`Your quota will reset in ${resetTime}.`));
                    } else if (usagePercent >= 80) {
                        console.log(colors.statusWarning(`${remaining.toLocaleString()} requests remaining today.`));
                    } else {
                        console.log(colors.statusSuccess(`${remaining.toLocaleString()} requests remaining today.`));
                    }
                }

                console.log('');

                // Plan-specific messaging
                if (usage.plan === 'free') {
                    ui.section('Upgrade for More');
                    console.log(colors.dim('Free Plan:    50 requests/day'));
                    console.log(colors.primary('Pro Plan:     Unlimited requests'));
                    console.log(colors.primary('Builder Plan: Unlimited requests + advanced features'));
                    console.log('');
                    ui.tip('Upgrade your plan: https://promptbrain.io/pricing');
                    console.log('');
                } else if (usage.plan === 'pro') {
                    console.log(colors.dim('✨ Thank you for being a Pro subscriber!'));
                    console.log(colors.dim('   You have unlimited API requests.'));
                    console.log('');
                } else if (usage.plan === 'builder') {
                    console.log(colors.dim('🚀 Thank you for being a Builder subscriber!'));
                    console.log(colors.dim('   You have unlimited API requests and access to all features.'));
                    console.log('');
                }
            }

        } catch (error: any) {
            if (flags.json) {
                jsonOutput.error('QUOTA_FETCH_FAILED', `Failed to fetch quota: ${error.message}`);
            } else {
                if (isPBError(error)) {
                    logger.error(error.message);
                    if (error.details.suggestion) {
                        ui.tip(error.details.suggestion);
                    }
                } else {
                    logger.error(`Failed to fetch quota: ${error.message}`);
                }
            }
            process.exit(1);
        }
    }
}
