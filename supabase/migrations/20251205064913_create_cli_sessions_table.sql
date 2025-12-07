-- Create cli_sessions table for OAuth linking flow
CREATE TABLE IF NOT EXISTS public.cli_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cli_session UUID NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    auth_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_provider CHECK (provider IN ('notion', 'cursor', 'figma', 'chatgpt')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'expired', 'failed'))
);

-- Create index for faster lookups
CREATE INDEX idx_cli_sessions_cli_session ON public.cli_sessions(cli_session);
CREATE INDEX idx_cli_sessions_user_id ON public.cli_sessions(user_id);
CREATE INDEX idx_cli_sessions_expires_at ON public.cli_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.cli_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own CLI sessions
CREATE POLICY "Users can view own CLI sessions"
    ON public.cli_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own CLI sessions
CREATE POLICY "Users can create own CLI sessions"
    ON public.cli_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own CLI sessions
CREATE POLICY "Users can update own CLI sessions"
    ON public.cli_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role can do everything (for backend API key auth)
CREATE POLICY "Service role has full access"
    ON public.cli_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE public.cli_sessions IS 'Stores temporary CLI session data for OAuth linking flows';
