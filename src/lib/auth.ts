import keytar from 'keytar';
import axios from 'axios';

const SERVICE_NAME = 'promptbrain-cli';
const ACCOUNT_NAME = 'session';
const SUPABASE_URL = 'https://ubgmotiourmwaudgeexx.supabase.co';
const TOKEN_REFRESH_THRESHOLD_SECONDS = 300; // Refresh when < 5 minutes remain

export interface Session {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;  // Timestamp when token expires
    user_id: string;
    email?: string;
}

export interface TokenRefreshResult {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

/**
 * Calculate expiration timestamp from expires_in seconds
 */
const calculateExpiresAt = (expiresIn: number): number => {
    return Date.now() + (expiresIn * 1000);
};

/**
 * Check if token is expired or about to expire
 */
const isTokenExpired = (session: Session): boolean => {
    const now = Date.now();
    const threshold = TOKEN_REFRESH_THRESHOLD_SECONDS * 1000;
    return now >= (session.expires_at - threshold);
};

export const auth = {
    /**
     * Save session with calculated expiration timestamp
     */
    saveSession: async (session: Session | Omit<Session, 'expires_at'>): Promise<void> => {
        const sessionWithExpiry: Session = {
            ...session,
            expires_at: 'expires_at' in session ? session.expires_at : calculateExpiresAt(session.expires_in)
        };
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(sessionWithExpiry));
    },

    /**
     * Load session from secure storage
     */
    loadSession: async (): Promise<Session | null> => {
        const data = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        if (!data) return null;
        try {
            const session = JSON.parse(data) as Session;
            // Migrate old sessions without expires_at
            if (!session.expires_at && session.expires_in) {
                session.expires_at = calculateExpiresAt(session.expires_in);
            }
            return session;
        } catch {
            return null;
        }
    },

    /**
     * Delete session from secure storage
     */
    deleteSession: async (): Promise<boolean> => {
        return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    },

    /**
     * Check if user is logged in with valid session
     */
    isLoggedIn: async (): Promise<boolean> => {
        const session = await auth.loadSession();
        return !!session;
    },

    /**
     * Check if current token needs refresh
     */
    needsRefresh: async (): Promise<boolean> => {
        const session = await auth.loadSession();
        if (!session) return false;
        return isTokenExpired(session);
    },

    /**
     * Refresh the access token using refresh_token
     */
    refreshToken: async (): Promise<TokenRefreshResult | null> => {
        const session = await auth.loadSession();
        if (!session?.refresh_token) return null;

        try {
            const response = await axios.post(
                `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
                { refresh_token: session.refresh_token },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': process.env.SUPABASE_ANON_KEY || ''
                    },
                    timeout: 10000
                }
            );

            const data = response.data;
            const newSession: Session = {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                expires_at: calculateExpiresAt(data.expires_in),
                user_id: data.user?.id || session.user_id,
                email: data.user?.email || session.email
            };

            await auth.saveSession(newSession);

            return {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in
            };
        } catch (error) {
            // If refresh fails, the session is invalid
            return null;
        }
    },

    /**
     * Ensure we have a valid token, refreshing if necessary
     */
    ensureValidToken: async (): Promise<string | null> => {
        const session = await auth.loadSession();
        if (!session) return null;

        if (isTokenExpired(session)) {
            const refreshResult = await auth.refreshToken();
            if (!refreshResult) {
                // Refresh failed, session is invalid
                await auth.deleteSession();
                return null;
            }
            return refreshResult.access_token;
        }

        return session.access_token;
    },

    /**
     * Get time until token expires in seconds
     */
    getTimeUntilExpiry: async (): Promise<number | null> => {
        const session = await auth.loadSession();
        if (!session?.expires_at) return null;
        return Math.max(0, Math.floor((session.expires_at - Date.now()) / 1000));
    }
};
