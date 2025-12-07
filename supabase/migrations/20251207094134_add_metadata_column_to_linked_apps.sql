-- Add metadata column to linked_apps table
ALTER TABLE public.linked_apps 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_linked_apps_metadata ON public.linked_apps USING gin(metadata);

-- Add comment
COMMENT ON COLUMN public.linked_apps.metadata IS 'Additional integration-specific metadata (workspace info, bot details, etc.)';
