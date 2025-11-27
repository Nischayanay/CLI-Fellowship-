import chalk from 'chalk';
import { logger } from './logger';

export enum ErrorCode {
    ECONN = 'ECONN',      // Connection/network error
    EAUTH = 'EAUTH',      // Authentication error
    EQUOTA = 'EQUOTA',    // Quota exceeded
    ERATE = 'ERATE',      // Rate limit exceeded
    EVALIDATION = 'EVALIDATION', // Validation error
    ETIMEOUT = 'ETIMEOUT', // Timeout error
    EOFFLINE = 'EOFFLINE', // Offline error
    EUNKNOWN = 'EUNKNOWN', // Unknown error
}

export interface ErrorDetails {
    status?: number;
    suggestion?: string;
    requestId?: string;
    retryAfterMs?: number;
    context?: Record<string, any>;
}

export class PBError extends Error {
    public readonly code: ErrorCode;
    public readonly originalError?: any;
    public readonly details: ErrorDetails;

    constructor(message: string, code: ErrorCode, originalError?: any, details: ErrorDetails = {}) {
        super(message);
        this.name = 'PBError';
        this.code = code;
        this.originalError = originalError;
        this.details = details;

        // Restore prototype chain for instanceof checks
        Object.setPrototypeOf(this, PBError.prototype);
    }

    /**
     * Get user-friendly error message with suggestion
     */
    getDisplayMessage(): string {
        let msg = this.message;
        if (this.details.suggestion) {
            msg += `\n${chalk.dim('Suggestion:')} ${this.details.suggestion}`;
        }
        if (this.details.requestId) {
            msg += `\n${chalk.dim('Request ID:')} ${this.details.requestId}`;
        }
        return msg;
    }

    /**
     * Check if error is retryable
     */
    isRetryable(): boolean {
        return [ErrorCode.ECONN, ErrorCode.ERATE, ErrorCode.ETIMEOUT].includes(this.code);
    }

    /**
     * Check if error requires re-authentication
     */
    requiresReauth(): boolean {
        return this.code === ErrorCode.EAUTH;
    }
}

/**
 * Create a PBError with optional details
 */
export const createError = (
    message: string, 
    code: ErrorCode, 
    originalError?: any,
    details?: ErrorDetails
): PBError => {
    return new PBError(message, code, originalError, details);
};

/**
 * Type guard for PBError
 */
export const isPBError = (error: any): error is PBError => {
    return error instanceof PBError;
};

/**
 * Format error for display to user
 */
export const formatError = (error: any): string => {
    if (isPBError(error)) {
        return error.getDisplayMessage();
    }
    
    if (error instanceof Error) {
        return error.message;
    }
    
    return String(error);
};

/**
 * Handle error with appropriate logging and user feedback
 */
export const handleError = (error: any, context?: string): void => {
    const prefix = context ? `[${context}] ` : '';
    
    if (isPBError(error)) {
        logger.error(`${prefix}${error.message}`);
        
        if (error.details.suggestion) {
            logger.info(chalk.dim(`Suggestion: ${error.details.suggestion}`));
        }
        
        if (error.requiresReauth()) {
            logger.info(chalk.yellow('Please run: pb login'));
        }
        
        if (error.details.requestId) {
            logger.debug(`Request ID: ${error.details.requestId}`);
        }
    } else if (error instanceof Error) {
        logger.error(`${prefix}${error.message}`);
    } else {
        logger.error(`${prefix}${String(error)}`);
    }
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: string
): T => {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, context);
            throw error;
        }
    }) as T;
};

/**
 * Error messages for common scenarios
 */
export const ErrorMessages = {
    NETWORK_OFFLINE: 'No internet connection. Please check your network.',
    NETWORK_TIMEOUT: 'Request timed out. The server took too long to respond.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    AUTH_FAILED: 'Authentication failed. Please run `pb login` to authenticate.',
    AUTH_EXPIRED: 'Your session has expired. Please run `pb login` to re-authenticate.',
    AUTH_DENIED: 'Access denied. You do not have permission for this operation.',
    QUOTA_EXCEEDED: 'Quota exceeded. Please upgrade your plan or wait for quota reset.',
    RATE_LIMITED: 'Rate limit exceeded. Please wait before retrying.',
    VALIDATION_FAILED: 'Invalid input. Please check your data and try again.',
    SERVER_ERROR: 'Server error. Please try again later or check status at status.promptbrain.io',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again in a few moments.',
};

/**
 * Suggestions for common error scenarios
 */
export const ErrorSuggestions = {
    NETWORK: 'Check your internet connection and try again.',
    AUTH: 'Run: pb login',
    QUOTA: 'Visit https://promptbrain.io/pricing to upgrade your plan.',
    RATE_LIMIT: 'Wait a few seconds and try again.',
    SERVER: 'Check service status at status.promptbrain.io',
};
