import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { auth } from './auth';
import { logger } from '../utils/logger';
import { withRetry, getRetryAfterMs } from '../utils/retry';
import { createError, ErrorCode, PBError } from '../utils/errors';
import dns from 'dns/promises';
import { apiKeyStorage } from './apiKeyStorage';

const BASE_URL = 'https://promptbrain-context-engine.vercel.app';
const DEFAULT_TIMEOUT = 15000; // 15s timeout
const CONNECTIVITY_CACHE_TTL = 30000; // 30 seconds

// Connectivity state cache
let connectivityCache: { isOnline: boolean; timestamp: number } | null = null;

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: DEFAULT_TIMEOUT,
});

/**
 * Check network connectivity with caching
 */
export const checkConnectivity = async (forceCheck = false): Promise<boolean> => {
    const now = Date.now();
    
    // Return cached result if still valid
    if (!forceCheck && connectivityCache && (now - connectivityCache.timestamp) < CONNECTIVITY_CACHE_TTL) {
        return connectivityCache.isOnline;
    }

    try {
        await dns.lookup('google.com');
        connectivityCache = { isOnline: true, timestamp: now };
        return true;
    } catch {
        connectivityCache = { isOnline: false, timestamp: now };
        return false;
    }
};

/**
 * Clear connectivity cache (useful for testing)
 */
export const clearConnectivityCache = (): void => {
    connectivityCache = null;
};

/**
 * Get user-friendly error message based on status code
 */
const getErrorMessage = (status: number, responseData?: any): string => {
    const serverMessage = responseData?.message || responseData?.error;
    
    switch (status) {
        case 400:
            return serverMessage || 'Invalid request. Please check your input.';
        case 401:
            return 'Authentication failed. Please run `pb login` to authenticate.';
        case 403:
            return 'Access denied. You do not have permission for this operation.';
        case 404:
            return serverMessage || 'Resource not found.';
        case 402:
            return 'Quota exceeded. Please upgrade your plan or wait for quota reset.';
        case 422:
            return serverMessage || 'Invalid data format. Please check your input.';
        case 429:
            return 'Rate limit exceeded. Please wait before retrying.';
        case 500:
            return 'Server error. Please try again later or check status at status.promptbrain.io';
        case 502:
        case 503:
        case 504:
            return 'Service temporarily unavailable. Please try again in a few moments.';
        default:
            return serverMessage || `Request failed with status ${status}`;
    }
};

/**
 * Get troubleshooting suggestion based on error
 */
const getTroubleshootingSuggestion = (status: number): string | undefined => {
    switch (status) {
        case 401:
            return 'Try running: pb login';
        case 403:
            return 'Check your account permissions or contact support.';
        case 402:
            return 'Visit https://promptbrain.io/pricing to upgrade your plan.';
        case 429:
            return 'Wait a few seconds and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
            return 'Check service status at status.promptbrain.io';
        default:
            return undefined;
    }
};

// Request interceptor to add authentication (API key or token)
apiClient.interceptors.request.use(async (config) => {
    // 1. Try to load API key from storage first
    const apiKey = await apiKeyStorage.getActiveKey();
    if (apiKey) {
        config.headers['x-api-key'] = apiKey;
        logger.debug(`[API] ${config.method?.toUpperCase()} ${config.url} (using API key)`);
        return config;
    }
    
    // 2. Fallback to session token
    const token = await auth.ensureValidToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        logger.debug(`[API] ${config.method?.toUpperCase()} ${config.url} (using session token)`);
        return config;
    }

    // 3. No authentication available
    logger.debug(`[API] ${config.method?.toUpperCase()} ${config.url} (no auth)`);
    return config;
}, (error) => {
    logger.debug(`[API] Request setup error: ${error.message}`);
    return Promise.reject(error);
});

// Response interceptor for comprehensive error handling
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        logger.debug(`[API] Success: ${response.status} ${response.config.url}`);
        return response;
    },
    async (error: AxiosError) => {
        // Handle network errors (no response)
        if (!error.response) {
            const isOnline = await checkConnectivity(true);
            
            if (!isOnline) {
                const pbError = createError(
                    'No internet connection. Please check your network.',
                    ErrorCode.ECONN,
                    error
                );
                return Promise.reject(pbError);
            }
            
            if (error.code === 'ECONNABORTED') {
                const pbError = createError(
                    'Request timed out. The server took too long to respond.',
                    ErrorCode.ECONN,
                    error
                );
                return Promise.reject(pbError);
            }
            
            const pbError = createError(
                'Network error. Please check your connection and try again.',
                ErrorCode.ECONN,
                error
            );
            return Promise.reject(pbError);
        }

        const status = error.response.status;
        const responseData = error.response.data as any;
        const requestId = error.response.headers?.['x-request-id'];
        
        logger.debug(`[API] Error: ${status} ${error.config?.url}${requestId ? ` (request-id: ${requestId})` : ''}`);

        // Handle 401 with API key - remove invalid key
        if (status === 401) {
            const apiKey = await apiKeyStorage.getActiveKey();
            if (apiKey) {
                logger.debug('[API] Removing invalid API key');
                await apiKeyStorage.removeActiveKey();
            }
        }

        // Handle 402 quota exceeded
        if (status === 402 && responseData?.error === 'quota_exceeded') {
            const pbError = createError(
                'Quota exceeded. Upgrade your plan to continue.',
                ErrorCode.EQUOTA,
                error,
                {
                    status,
                    suggestion: 'Visit https://promptbrain.io/pricing to upgrade',
                    context: { 
                        reset_at: responseData.reset_at,
                        upgrade_required: responseData.upgrade_required 
                    }
                }
            );
            return Promise.reject(pbError);
        }

        // Handle 402 payment required
        if (status === 402 && responseData?.error === 'payment_required') {
            const pbError = createError(
                'Payment required. Please update your billing information.',
                ErrorCode.EQUOTA,
                error,
                {
                    status,
                    suggestion: 'Run: pb billing open',
                }
            );
            return Promise.reject(pbError);
        }

        // Map status to error code
        let errorCode: ErrorCode;
        switch (status) {
            case 401:
            case 403:
                errorCode = ErrorCode.EAUTH;
                break;
            case 429:
                errorCode = ErrorCode.ERATE;
                break;
            case 402:
                errorCode = ErrorCode.EQUOTA;
                break;
            default:
                errorCode = ErrorCode.EUNKNOWN;
        }

        const message = getErrorMessage(status, responseData);
        const suggestion = getTroubleshootingSuggestion(status);
        
        const pbError = createError(message, errorCode, error);
        
        // Attach additional context
        (pbError as any).status = status;
        (pbError as any).suggestion = suggestion;
        (pbError as any).requestId = requestId;
        
        // For rate limiting, attach retry-after info
        if (status === 429) {
            const retryAfterMs = getRetryAfterMs(error);
            if (retryAfterMs) {
                (pbError as any).retryAfterMs = retryAfterMs;
            }
        }

        return Promise.reject(pbError);
    }
);

export interface RequestOptions extends AxiosRequestConfig {
    skipRetry?: boolean;
    skipTokenRefresh?: boolean;
    queueIfOffline?: boolean;
}

/**
 * Unified request wrapper with retry and error handling
 */
export async function request<T = any>(
    method: Method,
    path: string,
    body?: any,
    options: RequestOptions = {}
): Promise<T> {
    // Check connectivity before making request
    const isOnline = await checkConnectivity();
    if (!isOnline) {
        throw createError(
            'No internet connection. Please check your network.',
            ErrorCode.ECONN
        );
    }

    const fn = async () => {
        const response = await apiClient.request<T>({
            method,
            url: path,
            data: body,
            ...options,
        });
        return response.data;
    };

    if (options.skipRetry) {
        return fn();
    }

    return withRetry(fn, {
        onRetry: (error, attempt, delay) => {
            const status = error.response?.status || error.code || 'unknown';
            logger.debug(`[API] Retry ${attempt}/3 for ${method.toUpperCase()} ${path} after ${delay}ms (error: ${status})`);
        }
    });
}

// API Key types
export interface ApiKeyResponse {
    id: string;
    key?: string; // Only present on creation
    key_preview: string; // Masked version
    scopes: string[];
    created_at: string;
}

export interface UsageResponse {
    daily_usage: number;
    daily_limit: number | null; // null = unlimited
    plan: 'free' | 'pro' | 'builder';
    reset_at: string;
    past_due: boolean;
    upgrade_required?: boolean;
}

export interface BillingPortalResponse {
    url: string;
    expires_at?: string;
}

// Enhancement API types
export interface EnhancementMetadata {
    task_type: string;
    confidence: number;
    reasoning: string;
}

export interface EnhancementRequest {
    prompt: string;
    metadata?: EnhancementMetadata;
}

// Integration API types
export interface LinkStartResponse {
    auth_url: string;
    cli_session: string;
}

export interface Integration {
    provider: string;
    connected: boolean;
    connected_at?: string;
    last_sync?: string;
    sync_status?: 'idle' | 'syncing' | 'error';
    error_message?: string;
    items_synced?: number;
}

export interface SyncProgress {
    provider: string;
    phase: 'authenticating' | 'fetching' | 'processing' | 'indexing' | 'complete';
    items_processed: number;
    items_total: number;
    current_item?: string;
}

// Devsync API types
export interface DevsyncRequest {
    project_path: string;
    git_status?: {
        branch: string;
        modified_files: string[];
        untracked_files: string[];
    };
    open_files?: string[];
    recent_commits?: Array<{
        hash: string;
        message: string;
        author: string;
    }>;
    query?: string;
}

export interface ContextItem {
    type: 'code' | 'doc' | 'issue' | 'design';
    title: string;
    content: string;
    relevance_score: number;
    source: string;
}

export interface DevsyncResponse {
    context: ContextItem[];
    suggestions: string[];
    relevant_docs: Array<{
        title: string;
        url: string;
        excerpt: string;
    }>;
    code_examples: Array<{
        language: string;
        code: string;
        description: string;
    }>;
}

// Integration API methods
export const integrationApi = {
    startLink: async (provider: string, cliSession: string): Promise<LinkStartResponse> => {
        return request('POST', '/cli/link/start', {
            provider,
            cli_session: cliSession,
        });
    },

    listIntegrations: async (cliSession?: string): Promise<Integration[]> => {
        const params = cliSession ? { cli_session: cliSession } : {};
        return request('GET', '/integrations/list', undefined, { params });
    },

    getSyncProgress: async (provider: string): Promise<SyncProgress> => {
        return request('GET', `/integrations/${provider}/progress`);
    },

    triggerIngestion: async (provider: string, options?: any): Promise<{ job_id: string }> => {
        return request('POST', `/integrations/${provider}/ingest`, options);
    },
};

// Devsync API methods
export const devsyncApi = {
    getContext: async (req: DevsyncRequest): Promise<DevsyncResponse> => {
        return request('POST', '/devsync', req);
    },
};

// API Key API methods
export const apiKeyApi = {
    create: async (): Promise<ApiKeyResponse> => {
        return request('POST', '/auth/api-key');
    },
    
    list: async (): Promise<ApiKeyResponse[]> => {
        return request('GET', '/auth/api-key');
    },
    
    revoke: async (id: string): Promise<void> => {
        return request('DELETE', `/auth/api-key/${id}`);
    }
};

// Billing API methods
export const billingApi = {
    getUsage: async (): Promise<UsageResponse> => {
        return request('GET', '/billing/usage');
    },
    
    getPortalUrl: async (): Promise<BillingPortalResponse> => {
        return request('GET', '/billing/portal');
    }
};

// Health check
export const healthApi = {
    check: async (): Promise<{ status: string; version?: string }> => {
        return request('GET', '/health', undefined, { skipRetry: true, timeout: 5000 });
    },
};
