-- Add all missing columns to linked_apps table based on backend expectations

-- Add token storage columns
ALTER TABLE public.linked_apps 
ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Add connection status columns
ALTER TABLE public.linked_apps 
ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS items_synced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add workspace/integration specific columns
ALTER TABLE public.linked_apps 
ADD COLUMN IF NOT EXISTS workspace_id TEXT,
ADD COLUMN IF NOT EXISTS workspace_name TEXT,
ADD COLUMN IF NOT EXISTS bot_id TEXT;

-- Add timestamps if they don't exist
ALTER TABLE public.linked_apps 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_linked_apps_user_provider ON public.linked_apps(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_linked_apps_connected ON public.linked_apps(connected);
CREATE INDEX IF NOT EXISTS idx_linked_apps_sync_status ON public.linked_apps(sync_status);

-- Add constraints (drop first if exists to avoid errors)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_sync_status' 
        AND conrelid = 'public.linked_apps'::regclass
    ) THEN
        ALTER TABLE public.linked_apps 
        ADD CONSTRAINT valid_sync_status 
        CHECK (sync_status IN ('idle', 'syncing', 'completed', 'error'));
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.linked_apps.access_token_encrypted IS 'Encrypted OAuth access token';
COMMENT ON COLUMN public.linked_apps.refresh_token_encrypted IS 'Encrypted OAuth refresh token';
COMMENT ON COLUMN public.linked_apps.connected IS 'Whether the integration is currently connected';
COMMENT ON COLUMN public.linked_apps.sync_status IS 'Current sync status: idle, syncing, completed, error';
