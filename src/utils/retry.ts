import { logger } from './logger';

export interface RetryOptions {
    retries: number;
    minTimeout: number;
    maxTimeout: number;
    factor: number;
    jitter: boolean;
    onRetry?: (error: any, attempt: number, delay: number) => void;
}

export interface RetryState {
    attempt: number;
    totalAttempts: number;
    lastDelay: number;
    errors: Error[];
}

const DEFAULT_OPTIONS: RetryOptions = {
    retries: 3,
    minTimeout: 500,
    maxTimeout: 10000,
    factor: 3, // 500ms -> 1500ms -> 4500ms
    jitter: true,
};

// Retryable HTTP status codes
const RETRYABLE_STATUS_CODES = new Set([
    408, // Request Timeout
    429, // Too Many Requests (rate limit)
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
]);

// Non-retryable HTTP status codes (client errors)
const NON_RETRYABLE_STATUS_CODES = new Set([
    400, // Bad Request
    401, // Unauthorized
    402, // Payment Required / Quota Exceeded
    403, // Forbidden
    404, // Not Found
    422, // Unprocessable Entity
]);

// Retryable error codes
const RETRYABLE_ERROR_CODES = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EPIPE',
    'ECONNABORTED',
]);

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Add jitter to delay to prevent thundering herd
 */
const addJitter = (delay: number): number => {
    const jitterFactor = 0.2; // ±20%
    const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (
    attempt: number,
    options: Pick<RetryOptions, 'minTimeout' | 'maxTimeout' | 'factor' | 'jitter'>
): number => {
    const exponentialDelay = options.minTimeout * Math.pow(options.factor, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, options.maxTimeout);
    return options.jitter ? addJitter(cappedDelay) : cappedDelay;
};

/**
 * Check if an error is retryable
 */
export const isRetryableError = (error: any): boolean => {
    // Network errors
    if (error.code && RETRYABLE_ERROR_CODES.has(error.code)) {
        return true;
    }

    // HTTP errors
    if (error.response?.status) {
        const status = error.response.status;
        if (NON_RETRYABLE_STATUS_CODES.has(status)) {
            return false;
        }
        if (RETRYABLE_STATUS_CODES.has(status)) {
            return true;
        }
        // Retry 5xx errors by default
        if (status >= 500 && status < 600) {
            return true;
        }
    }

    // No response means network error - retryable
    if (!error.response && error.request) {
        return true;
    }

    return false;
};

/**
 * Extract retry-after header value in milliseconds
 */
export const getRetryAfterMs = (error: any): number | null => {
    const retryAfter = error.response?.headers?.['retry-after'];
    if (!retryAfter) return null;

    // If it's a number, it's seconds
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
        return seconds * 1000;
    }

    // If it's a date string
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
        return Math.max(0, date.getTime() - Date.now());
    }

    return null;
};

/**
 * Enhanced retry wrapper with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
    const state: RetryState = {
        attempt: 0,
        totalAttempts: opts.retries + 1,
        lastDelay: 0,
        errors: []
    };

    while (true) {
        try {
            return await fn();
        } catch (error: any) {
            state.attempt++;
            state.errors.push(error);

            // Check if we've exhausted retries
            if (state.attempt > opts.retries) {
                logger.debug(`All ${opts.retries} retry attempts exhausted`);
                throw error;
            }

            // Check if error is retryable
            if (!isRetryableError(error)) {
                logger.debug(`Non-retryable error: ${error.message || error}`);
                throw error;
            }

            // Calculate delay (respect retry-after header for rate limits)
            let delay: number;
            const retryAfterMs = getRetryAfterMs(error);
            if (retryAfterMs !== null && error.response?.status === 429) {
                delay = retryAfterMs;
                logger.debug(`Rate limited, waiting ${delay}ms (from retry-after header)`);
            } else {
                delay = calculateBackoffDelay(state.attempt, opts);
            }

            state.lastDelay = delay;

            // Call retry callback
            if (opts.onRetry) {
                opts.onRetry(error, state.attempt, delay);
            } else {
                const status = error.response?.status || error.code || 'unknown';
                logger.debug(`Retry ${state.attempt}/${opts.retries} after ${delay}ms (error: ${status})`);
            }

            await wait(delay);
        }
    }
}

/**
 * Create a retry wrapper with custom options
 */
export const createRetryWrapper = (defaultOptions: Partial<RetryOptions>) => {
    return <T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> => {
        return withRetry(fn, { ...defaultOptions, ...options });
    };
};

/**
 * Retry with specific configuration for API calls
 */
export const withApiRetry = createRetryWrapper({
    retries: 3,
    minTimeout: 500,
    maxTimeout: 10000,
    factor: 3,
    jitter: true
});

/**
 * Retry with aggressive configuration for critical operations
 */
export const withAggressiveRetry = createRetryWrapper({
    retries: 5,
    minTimeout: 1000,
    maxTimeout: 30000,
    factor: 2,
    jitter: true
});
