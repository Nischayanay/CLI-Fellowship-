import keytar from 'keytar';

const SERVICE_NAME = 'promptbrain-cli';
const ACCOUNT_NAME = 'session';

export interface Session {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: string;
    email?: string;
}

export const auth = {
    saveSession: async (session: Session): Promise<void> => {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(session));
    },

    loadSession: async (): Promise<Session | null> => {
        const data = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        if (!data) return null;
        try {
            return JSON.parse(data) as Session;
        } catch {
            return null;
        }
    },

    deleteSession: async (): Promise<boolean> => {
        return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    },

    isLoggedIn: async (): Promise<boolean> => {
        const session = await auth.loadSession();
        return !!session;
    }
};
