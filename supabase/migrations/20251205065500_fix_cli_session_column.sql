-- Fix column name from cli_session_id to cli_session
ALTER TABLE public.cli_sessions 
RENAME COLUMN cli_session_id TO cli_session;

-- Update index name
DROP INDEX IF EXISTS idx_cli_sessions_cli_session_id;
CREATE INDEX idx_cli_sessions_cli_session ON public.cli_sessions(cli_session);
