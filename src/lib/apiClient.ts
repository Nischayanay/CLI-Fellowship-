import axios, { AxiosError } from 'axios';
import { auth } from './auth';
import { logger } from '../utils/logger';

const BASE_URL = 'https://promptbrain-engine.vercel.app';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor to add token
apiClient.interceptors.request.use(async (config) => {
    const session = await auth.loadSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                logger.error('Not logged in. Run: pb login');
                // Optionally we could throw a specific error here to be caught by commands
            }
        }
        return Promise.reject(error);
    }
);

// Integration API methods
export interface LinkStartResponse {
    auth_url: string;
    cli_session: string;
}

export interface Integration {
    provider: string;
    connected: boolean;
    connected_at?: string;
}

export const integrationApi = {
    /**
     * Start OAuth flow for a provider
     * @param provider - The provider name (e.g., 'notion', 'cursor')
     * @param cliSession - Unique CLI session ID
     */
    startLink: async (provider: string, cliSession: string): Promise<LinkStartResponse> => {
        const response = await apiClient.post('/cli/link/start', {
            provider,
            cli_session: cliSession,
        });
        return response.data;
    },

    /**
     * List all integrations for the current user
     * @param cliSession - Optional CLI session ID for polling during OAuth
     */
    listIntegrations: async (cliSession?: string): Promise<Integration[]> => {
        const params = cliSession ? { cli_session: cliSession } : {};
        const response = await apiClient.get('/integrations/list', { params });
        return response.data;
    },
};
