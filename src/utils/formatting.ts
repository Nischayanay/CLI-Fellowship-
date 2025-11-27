import chalk from 'chalk';

/**
 * Mask API key for display (pb_xxxxxx_last4)
 */
export const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return '***';
    
    const prefix = key.startsWith('pb_') ? 'pb_' : '';
    const last4 = key.slice(-4);
    const maskedLength = Math.max(6, key.length - prefix.length - 4);
    const masked = 'x'.repeat(maskedLength);
    
    return `${prefix}${masked}${last4}`;
};

/**
 * Format time until reset
 */
export const formatTimeUntilReset = (resetAt: string): string => {
    const now = Date.now();
    const reset = new Date(resetAt).getTime();
    const diff = reset - now;
    
    if (diff <= 0) return 'now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

/**
 * Format usage percentage with color
 */
export const formatUsagePercentage = (used: number, limit: number | null): string => {
    if (limit === null) return chalk.green('unlimited');
    
    const percentage = (used / limit) * 100;
    const rounded = Math.round(percentage);
    
    if (percentage >= 100) return chalk.red(`${rounded}%`);
    if (percentage >= 80) return chalk.yellow(`${rounded}%`);
    return chalk.green(`${rounded}%`);
};

/**
 * Get plan display name with emoji
 */
export const formatPlanName = (plan: string): string => {
    switch (plan.toLowerCase()) {
        case 'free':
            return '🆓 Free Plan';
        case 'pro':
            return '⭐ Pro Plan';
        case 'builder':
            return '🚀 Builder Plan';
        default:
            return plan;
    }
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
    const now = Date.now();
    const date = new Date(dateString).getTime();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
};
