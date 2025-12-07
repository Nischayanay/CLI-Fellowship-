-- Add state column for OAuth state parameter
ALTER TABLE public.cli_sessions 
ADD COLUMN IF NOT EXISTS state TEXT;

-- Create index for state lookups
CREATE INDEX IF NOT EXISTS idx_cli_sessions_state ON public.cli_sessions(state);
