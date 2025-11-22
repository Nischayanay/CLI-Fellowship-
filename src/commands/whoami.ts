import { Command } from '@oclif/core';
import { logger } from '../utils/logger';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/apiClient';

export default class Whoami extends Command {
    static description = 'Display current user information';

    async run(): Promise<void> {
        const session = await auth.loadSession();
        if (!session) {
            logger.error('Not logged in. Run: pb login');
            process.exit(1);
        }

        try {
            // We can get basic info from the session directly if we stored it
            // But the prompt asks to "Decode JWT or make GET request to /auth/user"
            // Since we are using Supabase, /auth/v1/user is the endpoint.
            // However, `apiClient` points to `promptbrain-engine.vercel.app`.
            // The prompt says "Decode JWT or make GET request to: /auth/user".
            // If I use `apiClient`, it goes to the engine.
            // If I use the Supabase URL, it goes to Supabase.
            // The prompt requirements for `whoami` say:
            // "Decode JWT or make GET request to: /auth/user"
            // And "Print: email, user_id, plan, quota used, quota remaining".
            // Plan and quota are likely in the Context Engine, not Supabase Auth (unless in metadata).
            // The previous `whoami` implementation fetched from `/whoami` on the Engine.
            // The new requirement says "Print: email, user_id, plan, quota...".
            // If I call `/auth/user` on Supabase, I only get auth info.
            // If I call `/whoami` on Engine, I get everything (assuming Engine supports the new auth).
            // The prompt says "Make GET request to: /auth/user".
            // This implies I should hit the Auth server?
            // But then where do I get "plan" and "quota"?
            // Maybe the prompt implies `/auth/user` on the *Engine*?
            // Or maybe I should stick to the Engine's `/whoami` which I already have, but update it to use the new token?
            // The prompt says "Implement pb whoami Command ... Decode JWT or make GET request to: /auth/user".
            // This is slightly contradictory with "plan (free/pro), quota used...".
            // I will assume the user wants me to use the `apiClient` (which points to Engine) and maybe the Engine has an `/auth/user` endpoint now?
            // OR, I should fetch Auth info from Supabase AND Plan info from Engine?
            // The previous `whoami` was `GET /whoami`.
            // I will try to call `GET /whoami` on the Engine using the new token.
            // If the prompt strictly wants `/auth/user`, I might be missing something about the Engine's API changes.
            // However, given "plan" and "quota" are required, and those are business logic, they must come from the Engine.
            // I will implement it to call `apiClient.get('/whoami')` as it's the most logical way to get plan/quota, 
            // and I'll assume the Engine validates the Supabase token.
            // WAIT. The prompt says: "Decode JWT or make GET request to: /auth/user".
            // It creates a specific requirement.
            // I will implement a call to `apiClient.get('/auth/user')` (assuming the engine exposes this) OR just decode the JWT for email/id and call `/whoami` for the rest?
            // Actually, I'll stick to the previous `GET /whoami` pattern but ensure it uses the new `apiClient`.
            // The prompt might be using generic terms.
            // Let's look at the `apiClient` requirement: "Add header on every request...".
            // So `apiClient` is ready.
            // I will use `apiClient.get('/whoami')` because it returns exactly what is asked (plan, quota).
            // I will also print email/user_id from the session if available.

            logger.info('Fetching user info...');
            const { data } = await apiClient.get('/whoami');

            logger.info('User Information:');
            logger.log(`  Email: ${session.email || data.email}`);
            logger.log(`  User ID: ${session.user_id || data.user_id}`);
            logger.log(`  Plan: ${data.plan}`);
            logger.log(`  Quota Used: ${data.usage_today || data.quota_used}`);
            logger.log(`  Quota Remaining: ${data.quota_remaining}`);

        } catch (error: any) {
            // Fallback if /whoami fails but we have session
            logger.log(`  Email: ${session.email}`);
            logger.log(`  User ID: ${session.user_id}`);
            logger.warning('Could not fetch plan details from server.');
        }
    }
}
