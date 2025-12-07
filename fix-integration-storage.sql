-- Check and fix the linked_apps table structure

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'linked_apps'
ORDER BY ordinal_position;

-- Check if there's data in oauth_tokens
SELECT provider, created_at 
FROM oauth_tokens 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there's data in linked_apps
SELECT provider, connected, created_at 
FROM linked_apps 
ORDER BY created_at DESC 
LIMIT 5;

-- Check cli_sessions
SELECT provider, status, created_at 
FROM cli_sessions 
ORDER BY created_at DESC 
LIMIT 5;
