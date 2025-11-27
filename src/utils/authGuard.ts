/**
 * Authentication Guard Utility
 * 
 * Provides utilities for validating authentication before command execution.
 */

import { auth } from '../lib/auth';
import { logger } from './logger';
import chalk from 'chalk';

export interface AuthCheckResult {
    authenticated: boolean;
    session: Awaited<ReturnType<typeof auth.loadSession>>;
    needsRefresh: boolean;
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<AuthCheckResult> {
    const session = await auth.loadSession();
    const needsRefresh = await auth.needsRefresh();
    
    return {
        authenticated: !!session,
        session,
        needsRefresh,
    };
}

/**
 * Require authentication for a command
 * Exits process if not authenticated
 */
export async function requireAuth(commandName?: string): Promise<void> {
    const { authenticated, needsRefresh } = await checkAuth();
    
    if (!authenticated) {
        const context = commandName ? ` to use ${commandName}` : '';
        logger.error(`You must be logged in${context}.`);
        logger.info(chalk.cyan('Run: pb login'));
        process.exit(1);
    }
    
    // Proactively refresh if needed
    if (needsRefresh) {
        logger.debug('Token needs refresh, attempting refresh...');
        const refreshResult = await auth.refreshToken();
        if (!refreshResult) {
            logger.error('Your session has expired. Please log in again.');
            logger.info(chalk.cyan('Run: pb login'));
            process.exit(1);
        }
        logger.debug('Token refreshed successfully');
    }
}

/**
 * Decorator-style function to wrap command run methods with auth check
 */
export function withAuth<T extends (...args: any[]) => Promise<void>>(
    fn: T,
    commandName?: string
): T {
    return (async (...args: Parameters<T>): Promise<void> => {
        await requireAuth(commandName);
        return fn(...args);
    }) as T;
}

/**
 * Check if a command requires authentication
 */
export function isAuthRequired(commandId: string): boolean {
    // Commands that don't require auth
    const publicCommands = [
        'login',
        'logout',
        'help',
        'version',
        'health',
    ];
    
    return !publicCommands.includes(commandId);
}

/**
 * Display authentication status
 */
export async function displayAuthStatus(): Promise<void> {
    const { authenticated, session, needsRefresh } = await checkAuth();
    
    if (!authenticated) {
        logger.info(chalk.yellow('Not logged in'));
        logger.info(chalk.dim('Run: pb login'));
        return;
    }
    
    const email = session?.email || 'Unknown';
    const timeUntilExpiry = await auth.getTimeUntilExpiry();
    
    logger.info(chalk.green('✓ Logged in'));
    logger.info(`  Email: ${chalk.bold(email)}`);
    
    if (timeUntilExpiry !== null) {
        if (timeUntilExpiry < 300) {
            logger.info(`  Token: ${chalk.yellow('Expiring soon')} (${timeUntilExpiry}s remaining)`);
        } else {
            const minutes = Math.floor(timeUntilExpiry / 60);
            logger.info(`  Token: ${chalk.green('Valid')} (${minutes}m remaining)`);
        }
    }
    
    if (needsRefresh) {
        logger.info(chalk.dim('  Token will be refreshed on next request'));
    }
}
