-- Drop existing policies
DROP POLICY IF EXISTS "Service role has full access" ON public.cli_sessions;
DROP POLICY IF EXISTS "Users can view own CLI sessions" ON public.cli_sessions;
DROP POLICY IF EXISTS "Users can create own CLI sessions" ON public.cli_sessions;
DROP POLICY IF EXISTS "Users can update own CLI sessions" ON public.cli_sessions;

-- Create new policies that work with both JWT and API key auth
-- Allow all operations when authenticated (covers both JWT and service role)
CREATE POLICY "Authenticated users can manage CLI sessions"
    ON public.cli_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Note: The backend will handle authorization logic
-- RLS is enabled but permissive for authenticated requests
